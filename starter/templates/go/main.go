package main

import (
	"context"
	_ "embed"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	radi "github.com/Marcisbee/radi/go"
)

//go:generate go run github.com/Marcisbee/radi/cmd/radi-build -entry app.tsx -out app.js
//go:embed app.js
var source string

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	handler, err := radi.New(radi.Config{Source: source, Queue: 32})
	if err != nil {
		return err
	}
	defer handler.Close(context.Background())
	addr := os.Getenv("RADI_ADDR")
	if addr == "" {
		addr = "127.0.0.1:3000"
	}
	server := &http.Server{Addr: addr, Handler: handler, ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 30 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	result := make(chan error, 1)
	go func() { result <- server.ListenAndServe() }()
	log.Printf("http://%s", addr)
	select {
	case err = <-result:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
	}
	shutdown, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err = server.Shutdown(shutdown); err != nil {
		server.Close()
	}
	return handler.Close(shutdown)
}
