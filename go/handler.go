// Package radi serves bundled Radi TSX applications using embedded V8.
package radi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// Operation must respect ctx and return JSON-serializable data. It receives the
// original request context, including values installed by authentication middleware.
type Operation func(ctx context.Context, input json.RawMessage) (any, error)

type Config struct {
	Source           string
	Operations       map[string]Operation
	Workers          int
	Queue            int
	Timeout          time.Duration
	WriteTimeout     time.Duration
	MaxHeapBytes     uint64
	MaxResponseBytes int
	MaxDataBytes     int
	MaxDataCalls     int
	// OnError receives private diagnostics. HTTP clients receive generic errors.
	OnError func(*http.Request, error)
}

type Handler struct {
	config    Config
	workers   chan *engine
	slots     chan struct{}
	dataSlots chan struct{}
	ctx       context.Context
	cancel    context.CancelFunc
	mu        sync.Mutex
	closed    bool
	wg        sync.WaitGroup
	done      chan struct{}
}

func (config *Config) defaults() {
	if config.Workers == 0 {
		config.Workers = 1
	}
	if config.Timeout == 0 {
		config.Timeout = 10 * time.Second
	}
	if config.WriteTimeout == 0 {
		config.WriteTimeout = 5 * time.Second
	}
	if config.MaxHeapBytes == 0 {
		config.MaxHeapBytes = 64 << 20
	}
	if config.MaxResponseBytes == 0 {
		config.MaxResponseBytes = 16 << 20
	}
	if config.MaxDataBytes == 0 {
		config.MaxDataBytes = 1 << 20
	}
	if config.MaxDataCalls == 0 {
		config.MaxDataCalls = 32
	}
}

func New(config Config) (*Handler, error) {
	config.defaults()
	if config.Source == "" || config.Workers < 1 || config.Queue < 0 || config.Timeout < 0 || config.WriteTimeout < 0 || config.MaxHeapBytes < 8<<20 || config.MaxResponseBytes < 1 || config.MaxDataBytes < 1 || config.MaxDataCalls < 1 {
		return nil, errors.New("radi: invalid configuration")
	}
	ops := make(map[string]Operation, len(config.Operations))
	for name, op := range config.Operations {
		if op == nil {
			return nil, fmt.Errorf("radi: nil operation %q", name)
		}
		ops[name] = op
	}
	config.Operations = ops
	ctx, cancel := context.WithCancel(context.Background())
	h := &Handler{config: config, ctx: ctx, cancel: cancel, done: make(chan struct{}), workers: make(chan *engine, config.Workers), slots: make(chan struct{}, config.Workers+config.Queue), dataSlots: make(chan struct{}, config.Workers*config.MaxDataCalls)}
	for range config.Workers {
		e, err := newEngine(h)
		if err != nil {
			cancel()
			for len(h.workers) > 0 {
				(<-h.workers).dispose()
			}
			return nil, err
		}
		h.workers <- e
	}
	return h, nil
}

// Close rejects new work, cancels active/queued requests and waits for engines
// and data operations. A context deadline bounds waiting for a broken operation.
func (h *Handler) Close(ctx context.Context) error {
	h.mu.Lock()
	if !h.closed {
		h.closed = true
		h.cancel()
		go func() {
			h.wg.Wait()
			for range h.config.Workers {
				(<-h.workers).dispose()
			}
			close(h.done)
		}()
	}
	h.mu.Unlock()
	select {
	case <-h.done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (h *Handler) admit() bool {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.closed {
		return false
	}
	select {
	case h.slots <- struct{}{}:
		h.wg.Add(1)
		return true
	default:
		return false
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		http.Error(w, "method not allowed", 405)
		return
	}
	if !h.admit() {
		w.Header().Set("Retry-After", "1")
		http.Error(w, "renderer unavailable", 503)
		return
	}
	defer h.wg.Done()
	defer func() { <-h.slots }()
	ctx, cancel := context.WithTimeout(r.Context(), h.config.Timeout)
	stop := context.AfterFunc(h.ctx, cancel)
	defer stop()
	defer cancel()
	var e *engine
	select {
	case e = <-h.workers:
	case <-ctx.Done():
		http.Error(w, "render timeout", 504)
		return
	}
	defer func() { h.workers <- e }()
	controller := http.NewResponseController(w)
	deadline, _ := ctx.Deadline()
	if err := controller.SetWriteDeadline(deadline); err != nil {
		h.fail(w, r, fmt.Errorf("radi: write deadlines required: %w", err), false, ctx)
		return
	}
	defer controller.SetWriteDeadline(time.Time{})
	written, err := e.serve(ctx, w, r, controller)
	if err != nil {
		h.fail(w, r, err, written, ctx)
	}
}

func (h *Handler) fail(w http.ResponseWriter, r *http.Request, err error, written bool, ctx context.Context) {
	if h.config.OnError != nil {
		h.config.OnError(r, err)
	}
	// A truncated chunked response must never look like a successful complete page.
	if written {
		panic(http.ErrAbortHandler)
	}
	code := 500
	if ctx.Err() != nil {
		code = 504
	}
	http.Error(w, http.StatusText(code), code)
}
