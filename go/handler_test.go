package radi_test

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	radi "github.com/Marcisbee/radi/go"
	"github.com/evanw/esbuild/pkg/api"
)

var source string

func TestMain(m *testing.M) {
	result := api.Build(api.BuildOptions{EntryPoints: []string{"testdata/app.tsx"}, Bundle: true, Format: api.FormatIIFE, GlobalName: "Radi", Platform: api.PlatformNeutral, Target: api.ES2022, JSX: api.JSXTransform, TsconfigRaw: `{ "compilerOptions": { "jsx": "react" } }`, JSXFactory: "createElement", JSXFragment: "Fragment", LogLevel: api.LogLevelWarning})
	if len(result.Errors) > 0 {
		os.Exit(1)
	}
	source = string(result.OutputFiles[0].Contents)
	os.Exit(m.Run())
}

func server(t *testing.T, c radi.Config) (*radi.Handler, *httptest.Server) {
	t.Helper()
	c.Source = source
	if c.OnError == nil {
		c.OnError = func(_ *http.Request, err error) { t.Log(err) }
	}
	h, err := radi.New(c)
	if err != nil {
		t.Fatal(err)
	}
	s := httptest.NewServer(h)
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := h.Close(ctx); err != nil {
			t.Error(err)
		}
		s.Close()
	})
	return h, s
}

func get(t *testing.T, s *httptest.Server, path string) (int, string, error) {
	t.Helper()
	res, err := s.Client().Get(s.URL + path)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	return res.StatusCode, string(body), err
}

func TestStreamingAndDisconnect(t *testing.T) {
	release := make(chan struct{})
	cancelled := make(chan struct{}, 2)
	_, s := server(t, radi.Config{Operations: map[string]radi.Operation{"read": func(ctx context.Context, _ json.RawMessage) (any, error) {
		select {
		case <-release:
			return "<& 🦊", nil
		case <-ctx.Done():
			cancelled <- struct{}{}
			return nil, ctx.Err()
		}
	}}})
	res, err := s.Client().Get(s.URL)
	if err != nil {
		t.Fatal(err)
	}
	prefix := make([]byte, len("<main>shell"))
	if _, err = io.ReadFull(res.Body, prefix); err != nil || string(prefix) != "<main>shell" {
		t.Fatalf("early shell: %q %v", prefix, err)
	}
	close(release)
	tail, err := io.ReadAll(res.Body)
	res.Body.Close()
	if err != nil || string(tail) != "&lt;&amp; 🦊<br>tail 🦊</main>" {
		t.Fatalf("tail: %q %v", tail, err)
	}
	// A second server holds data until the peer actually disconnects.
	_, s2 := server(t, radi.Config{Operations: map[string]radi.Operation{"read": func(ctx context.Context, _ json.RawMessage) (any, error) {
		<-ctx.Done()
		cancelled <- struct{}{}
		return nil, ctx.Err()
	}}})
	res, err = s2.Client().Get(s2.URL)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	select {
	case <-cancelled:
	case <-time.After(time.Second):
		t.Fatal("disconnect did not cancel data")
	}
}

func TestFailureRecovery(t *testing.T) {
	_, s := server(t, radi.Config{Timeout: 150 * time.Millisecond, MaxHeapBytes: 16 << 20, MaxResponseBytes: 1 << 20, Operations: map[string]radi.Operation{"read": func(context.Context, json.RawMessage) (any, error) { return "ok", nil }}})
	for _, path := range []string{"/error", "/reject", "/loop", "/microtasks", "/heap", "/never", "/large", "/calls", "/late-error"} {
		t.Run(path, func(t *testing.T) {
			code, body, err := get(t, s, path)
			if path == "/late-error" {
				if err == nil {
					t.Fatalf("truncation accepted: %d %q", code, body)
				}
			} else if code < 500 {
				t.Fatalf("failure returned %d", code)
			}
			if strings.Contains(body, "private-secret") {
				t.Fatal("private error leaked")
			}
			code, body, err = get(t, s, "/isolation")
			if code != 200 || body != "fresh" || err != nil {
				t.Fatalf("recovery: %d %q %v", code, body, err)
			}
		})
	}
	for range 3 {
		_, body, _ := get(t, s, "/isolation")
		if body != "fresh" {
			t.Fatal(body)
		}
	}
}

func TestOverloadAndShutdown(t *testing.T) {
	started := make(chan struct{})
	h, s := server(t, radi.Config{Operations: map[string]radi.Operation{"read": func(ctx context.Context, _ json.RawMessage) (any, error) {
		close(started)
		<-ctx.Done()
		return nil, ctx.Err()
	}}})
	res, err := s.Client().Get(s.URL)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	<-started
	code, _, _ := get(t, s, "/")
	if code != 503 {
		t.Fatalf("overload: %d", code)
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	if err = h.Close(ctx); err != nil {
		t.Fatal(err)
	}
	if _, err = io.ReadAll(res.Body); err == nil {
		t.Fatal("shutdown completed a partial response")
	}
	code, _, _ = get(t, s, "/")
	if code != 503 {
		t.Fatalf("closed handler: %d", code)
	}
}

func TestSlowReaderBackpressure(t *testing.T) {
	var calls atomic.Int64
	failure := make(chan error, 1)
	_, s := server(t, radi.Config{WriteTimeout: 100 * time.Millisecond, Timeout: 2 * time.Second, MaxDataCalls: 20000, OnError: func(_ *http.Request, err error) { failure <- err }, MaxResponseBytes: 128 << 20, Operations: map[string]radi.Operation{"chunk": func(context.Context, json.RawMessage) (any, error) {
		calls.Add(1)
		return strings.Repeat("x", 16384), nil
	}}})
	conn, err := net.Dial("tcp", strings.TrimPrefix(s.URL, "http://"))
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	conn.(*net.TCPConn).SetReadBuffer(1024)
	fmt.Fprint(conn, "GET /slow HTTP/1.1\r\nHost: localhost\r\n\r\n")
	reader := bufio.NewReader(conn)
	if _, err = reader.ReadString('\n'); err != nil {
		t.Fatal(err)
	}
	// Stop reading; the OS socket buffer may absorb some chunks, but rendering
	// must stop well before completing the 160 MB response.
	select {
	case err := <-failure:
		if timeout, ok := err.(net.Error); !ok || !timeout.Timeout() {
			t.Fatalf("expected socket write timeout: %v", err)
		}
	case <-time.After(time.Second):
		t.Fatal("slow reader did not time out")
	}
	count := calls.Load()
	if count == 0 || count >= 10000 {
		t.Fatalf("unbounded read-ahead: %d", count)
	}
	time.Sleep(150 * time.Millisecond)
	if calls.Load() != count {
		t.Fatal("render kept advancing after write deadline")
	}
	code, body, err := get(t, s, "/isolation")
	if code != 200 || body != "fresh" || err != nil {
		t.Fatalf("slow peer held engine: %d %q %v", code, body, err)
	}
}

func TestDataFailures(t *testing.T) {
	for name, op := range map[string]radi.Operation{
		"error":        func(context.Context, json.RawMessage) (any, error) { return nil, errors.New("private-secret") },
		"panic":        func(context.Context, json.RawMessage) (any, error) { panic("private-secret") },
		"oversized":    func(context.Context, json.RawMessage) (any, error) { return strings.Repeat("x", 2048), nil },
		"invalid JSON": func(context.Context, json.RawMessage) (any, error) { return make(chan int), nil },
	} {
		t.Run(name, func(t *testing.T) {
			_, s := server(t, radi.Config{MaxDataBytes: 1024, Operations: map[string]radi.Operation{"read": op}})
			code, body, err := get(t, s, "/data")
			if code != 500 || err != nil || strings.Contains(body, "private-secret") {
				t.Fatalf("data failure: %d %q %v", code, body, err)
			}
			code, body, err = get(t, s, "/isolation")
			if code != 200 || body != "fresh" || err != nil {
				t.Fatalf("recovery: %d %q %v", code, body, err)
			}
		})
	}
}

func TestParallelWorkersAndBoundedClose(t *testing.T) {
	started := make(chan struct{}, 2)
	release := make(chan struct{})
	h, s := server(t, radi.Config{Workers: 2, Operations: map[string]radi.Operation{"read": func(context.Context, json.RawMessage) (any, error) {
		started <- struct{}{}
		<-release // Model a dependency which does not cooperate with cancellation.
		return "ok", nil
	}}})
	defer close(release)
	for range 2 {
		res, err := s.Client().Get(s.URL)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
	}
	for range 2 {
		select {
		case <-started:
		case <-time.After(time.Second):
			t.Fatal("workers did not overlap")
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	if err := h.Close(ctx); !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("uncooperative close: %v", err)
	}
}
