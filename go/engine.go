package radi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	v8 "github.com/tommie/v8go"
)

type engine struct {
	h      *Handler
	iso    *v8.Isolate
	script *v8.UnboundScript
	global *v8.ObjectTemplate
	active *execution
}

type execution struct {
	ctx     context.Context
	results chan completion
	calls   int
}

type completion struct {
	ID    int32           `json:"id"`
	Value json.RawMessage `json:"value,omitempty"`
	Error string          `json:"error,omitempty"`
}

func newEngine(h *Handler) (*engine, error) {
	e := &engine{h: h}
	if err := e.init(); err != nil {
		e.dispose()
		return nil, err
	}
	return e, nil
}

func (e *engine) init() error {
	e.iso = v8.NewIsolate(v8.WithResourceConstraints(0, e.h.config.MaxHeapBytes))
	e.global = v8.NewObjectTemplate(e.iso)
	callback := v8.NewFunctionTemplateWithError(e.iso, e.data)
	if err := e.global.Set("__radiData", callback); err != nil {
		return err
	}
	var err error
	e.script, err = e.iso.CompileUnboundScript(e.h.config.Source, "radi-app.js", v8.CompileOptions{})
	return err
}

func (e *engine) dispose() {
	if e.iso != nil {
		e.iso.Dispose()
		e.iso = nil
	}
}

func (e *engine) data(info *v8.FunctionCallbackInfo) (*v8.Value, error) {
	defer info.Release()
	x := e.active
	args := info.Args()
	if x == nil || len(args) != 3 {
		return nil, errors.New("radi: data outside request")
	}
	if err := x.ctx.Err(); err != nil {
		return nil, err
	}
	if x.calls >= e.h.config.MaxDataCalls {
		return nil, errors.New("radi: data call limit")
	}
	name, input := args[1].String(), args[2].String()
	op, ok := e.h.config.Operations[name]
	if !ok {
		return nil, errors.New("radi: unknown data operation")
	}
	if len(input) > e.h.config.MaxDataBytes || !json.Valid([]byte(input)) {
		return nil, errors.New("radi: invalid data input")
	}
	select {
	case e.h.dataSlots <- struct{}{}:
	default:
		return nil, errors.New("radi: data capacity exhausted")
	}
	x.calls++
	id := args[0].Int32()
	e.h.wg.Add(1) // The active request keeps WaitGroup nonzero until this Add.
	go e.runData(x, id, op, json.RawMessage(input))
	return nil, nil
}

func (e *engine) runData(x *execution, id int32, op Operation, input json.RawMessage) {
	defer e.h.wg.Done()
	defer func() { <-e.h.dataSlots }()
	result := completion{ID: id}
	func() {
		defer func() {
			if recover() != nil {
				result.Error = "data operation failed"
			}
		}()
		value, err := op(x.ctx, input)
		if err != nil {
			result.Error = "data operation failed"
			return
		}
		result.Value, err = json.Marshal(value)
		if err != nil || len(result.Value) > e.h.config.MaxDataBytes {
			result.Value = nil
			result.Error = "invalid data result"
		}
	}()
	select {
	case x.results <- result:
	case <-x.ctx.Done():
	}
}

func call(c *v8.Context, expression string) (*v8.Value, error) {
	return c.RunScript(expression, "radi-host.js")
}

func release(value *v8.Value, err error) error {
	if value != nil {
		value.Release()
	}
	return err
}

func (e *engine) serve(ctx context.Context, w http.ResponseWriter, r *http.Request, controller *http.ResponseController) (written bool, err error) {
	c, finish, err := e.begin(ctx, controller)
	if err != nil {
		return false, err
	}
	defer func() { err = finish(err) }()
	if err = e.start(c, r); err != nil {
		return false, err
	}
	return e.stream(c, w, controller)
}

func (e *engine) begin(ctx context.Context, controller *http.ResponseController) (*v8.Context, func(error) error, error) {
	if e.iso == nil {
		if err := e.init(); err != nil {
			e.dispose()
			return nil, nil, err
		}
	}
	ctx, cancel := context.WithCancel(ctx)
	e.active = &execution{ctx: ctx, results: make(chan completion, e.h.config.MaxDataCalls)}
	// Join the watchdog before closing/reusing the isolate: a late termination
	// must never kill the next request or race disposal.
	watchDone := make(chan struct{})
	stopWatch := make(chan struct{})
	go func() {
		defer close(watchDone)
		select {
		case <-ctx.Done():
			controller.SetWriteDeadline(time.Now())
		case <-stopWatch:
			return
		}
		// Termination can land between V8 entries. Keep interrupting until
		// the owner acknowledges cancellation, including microtask execution.
		tick := time.NewTicker(time.Millisecond)
		defer tick.Stop()
		for {
			e.iso.TerminateExecution()
			select {
			case <-stopWatch:
				return
			case <-tick.C:
			}
		}
	}()
	c := v8.NewContext(e.iso, e.global)
	finish := func(err error) error {
		close(stopWatch)
		<-watchDone
		if err == nil {
			err = ctx.Err()
		}
		cancel()
		c.Close()
		e.active = nil
		// Discard pending microtasks and termination state after any failure.
		if err != nil {
			e.dispose()
		}
		return err
	}
	return c, finish, nil
}

func (e *engine) start(c *v8.Context, r *http.Request) error {
	if err := release(e.script.Run(c)); err != nil {
		return err
	}
	request, _ := json.Marshal(struct {
		Method  string      `json:"method"`
		URL     string      `json:"url"`
		Headers http.Header `json:"headers"`
	}{r.Method, r.URL.RequestURI(), r.Header})
	if len(request) > e.h.config.MaxDataBytes {
		return errors.New("radi: request metadata limit")
	}
	encoded, _ := json.Marshal(string(request))
	return release(call(c, fmt.Sprintf("Radi.app.start(%s,%d)", encoded, e.h.config.MaxResponseBytes)))
}

func (e *engine) stream(c *v8.Context, w http.ResponseWriter, controller *http.ResponseController) (written bool, err error) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "no-store")
	total := 0
	for {
		var chunk string
		var done bool
		chunk, done, err = e.pull(c)
		if err != nil {
			return
		}
		if done {
			return written, nil
		}
		total += len(chunk)
		if total > e.h.config.MaxResponseBytes {
			return written, errors.New("radi: response size limit")
		}
		deadline := time.Now().Add(e.h.config.WriteTimeout)
		if end, _ := e.active.ctx.Deadline(); end.Before(deadline) {
			deadline = end
		}
		if err = controller.SetWriteDeadline(deadline); err != nil {
			return
		}
		written = true
		if _, err = w.Write([]byte(chunk)); err != nil {
			return
		}
		if err = controller.Flush(); err != nil {
			return
		}
	}
}

func (e *engine) pull(c *v8.Context) (string, bool, error) {
	if err := e.active.ctx.Err(); err != nil {
		return "", false, err
	}
	value, err := call(c, "Radi.app.pull()")
	if err != nil {
		return "", false, err
	}
	defer value.Release()
	promise, err := value.AsPromise()
	if err != nil {
		return "", false, err
	}
	for promise.State() == v8.Pending {
		select {
		case <-e.active.ctx.Done():
			return "", false, e.active.ctx.Err()
		case result := <-e.active.results:
			message, _ := json.Marshal(result)
			quoted, _ := json.Marshal(string(message))
			if err := release(call(c, "Radi.app.settle("+string(quoted)+")")); err != nil {
				return "", false, err
			}
		}
	}
	result := promise.Result()
	defer result.Release()
	if promise.State() == v8.Rejected {
		return "", false, fmt.Errorf("radi: render rejected: %s", result.String())
	}
	var chunk struct {
		Value string `json:"value"`
		Done  bool   `json:"done"`
	}
	if err := json.Unmarshal([]byte(result.String()), &chunk); err != nil {
		return "", false, err
	}
	return chunk.Value, chunk.Done, nil
}
