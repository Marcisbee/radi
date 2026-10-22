package radi_test

import (
	"context"
	"encoding/json"
	"io"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	radi "github.com/Marcisbee/radi/go"
	flop "github.com/marcisbee/flop"
)

func flopOperation(t *testing.T) radi.Operation {
	t.Helper()
	app := flop.New(flop.Config{DataDir: t.TempDir(), SyncMode: "normal"})
	flop.Define(app, "pages", func(s *flop.SchemaBuilder) { s.String("id").Primary(); s.String("title") })
	db, err := app.Open()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := db.Close(); err != nil {
			t.Error(err)
		}
	})
	table := db.Table("pages")
	if _, err = table.Insert(map[string]any{"id": "home", "title": "<& 🦊"}); err != nil {
		t.Fatal(err)
	}
	return func(ctx context.Context, _ json.RawMessage) (any, error) {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		row, err := table.Get("home")
		if err != nil {
			return nil, err
		}
		return row["title"], ctx.Err()
	}
}

func TestFlopHTTP(t *testing.T) {
	_, s := server(t, radi.Config{Operations: map[string]radi.Operation{"read": flopOperation(t)}})
	code, body, err := get(t, s, "/")
	if code != 200 || body != "<main>shell&lt;&amp; 🦊<br>tail 🦊</main>" || err != nil {
		t.Fatalf("%d %q %v", code, body, err)
	}
}

// Run RADI_SOAK_SECONDS=60 go test ./go -run TestSustainedFlop -count=3 -v.
// The correctness target is zero failed/mismatched responses. Throughput and
// process RSS are observations, not capacity guarantees or arbitrary pass bars.
func TestSustainedFlop(t *testing.T) {
	seconds, _ := strconv.Atoi(os.Getenv("RADI_SOAK_SECONDS"))
	if seconds < 1 {
		t.Skip("set RADI_SOAK_SECONDS for sustained load")
	}
	_, s := server(t, radi.Config{Queue: 32, Operations: map[string]radi.Operation{"read": flopOperation(t)}})
	var completed, failed atomic.Int64
	start := time.Now()
	end := start.Add(time.Duration(seconds) * time.Second)
	var clients sync.WaitGroup
	for range 16 {
		clients.Go(func() {
			for time.Now().Before(end) {
				res, err := s.Client().Get(s.URL)
				if err != nil {
					failed.Add(1)
					continue
				}
				body, err := io.ReadAll(res.Body)
				res.Body.Close()
				if err != nil || res.StatusCode != 200 || string(body) != "<main>shell&lt;&amp; 🦊<br>tail 🦊</main>" {
					failed.Add(1)
				} else {
					completed.Add(1)
				}
			}
		})
	}
	for time.Now().Before(end) {
		time.Sleep(time.Duration(seconds) * time.Second / 3)
		status, _ := os.ReadFile("/proc/self/status")
		for _, line := range strings.Split(string(status), "\n") {
			if strings.HasPrefix(line, "VmRSS:") {
				t.Logf("elapsed=%s completed=%d %s", time.Since(start).Round(time.Millisecond), completed.Load(), line)
			}
		}
	}
	clients.Wait()
	t.Logf("responses=%d failures=%d requests/s=%.1f", completed.Load(), failed.Load(), float64(completed.Load())/time.Since(start).Seconds())
	if failed.Load() != 0 || completed.Load() == 0 {
		t.Fatal("sustained HTTP correctness failed")
	}
}
