package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	radi "github.com/Marcisbee/radi/go"
	flop "github.com/marcisbee/flop"
)

//go:generate go run ../../cmd/radi-build -entry app.tsx -out app.js -radi ../..
//go:embed app.js
var source string

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	dataDir := os.Getenv("RADI_DATA_DIR")
	if dataDir == "" {
		dataDir = "data"
	}
	app := flop.New(flop.Config{DataDir: dataDir, SyncMode: "normal"})
	flop.Define(app, "pages", func(s *flop.SchemaBuilder) { s.String("id").Primary(); s.String("title") })
	db, err := app.Open()
	if err != nil {
		return err
	}
	defer db.Close()
	table := db.Table("pages")
	row, err := table.Get("home")
	if err != nil {
		return err
	}
	if row == nil {
		if _, err = table.Insert(map[string]any{"id": "home", "title": "Hello & welcome 🦊"}); err != nil {
			return err
		}
	}
	h, err := radi.New(radi.Config{Source: source, Queue: 32, Operations: map[string]radi.Operation{
		"page": func(ctx context.Context, input json.RawMessage) (any, error) {
			if err := ctx.Err(); err != nil {
				return nil, err
			}
			var args struct {
				ID string `json:"id"`
			}
			if err := json.Unmarshal(input, &args); err != nil {
				return nil, err
			}
			row, err := table.Get(args.ID)
			if err != nil {
				return nil, err
			}
			return row, ctx.Err()
		},
	}, OnError: func(_ *http.Request, err error) { log.Print(err) }})
	if err != nil {
		return err
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		h.Close(ctx)
	}()
	addr := os.Getenv("RADI_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8080"
	}
	srv := &http.Server{Addr: addr, Handler: h, ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 30 * time.Second, MaxHeaderBytes: 32 << 10}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	result := make(chan error, 1)
	go func() { result <- srv.ListenAndServe() }()
	select {
	case err = <-result:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
	}
	shutdown, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	// Stop accepting HTTP work and drain before closing V8 and Flop.
	if err = srv.Shutdown(shutdown); err != nil {
		srv.Close()
	}
	return h.Close(shutdown)
}
