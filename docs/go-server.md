# Go and embedded V8

The `github.com/Marcisbee/radi/go` HTTP handler runs bundled TypeScript/TSX
inside the Go process. Go owns HTTP and Flop; JavaScript owns components.
There is no Node/Deno serving process or persisted V8 code cache.

The supported release target is Linux amd64 with glibc, Go 1.26.10, Clang 21
and the pinned v8go 0.40.0 dependency (V8 15.6.75.19). Other platforms are
not qualified by this integration's checks. CGO must remain enabled.

## Build and run

From a Radi checkout with Clang 21 installed:

```sh
export CC=clang-21 CXX=clang++-21 CGO_CXXFLAGS=-nostdinc++
go generate ./examples/go-server
go test ./...
go build -trimpath -o radi-go-server ./examples/go-server
RADI_ADDR=127.0.0.1:8080 RADI_DATA_DIR=./data ./radi-go-server
```

`go generate` uses the pinned Go esbuild API, so even the bundling step needs
no Node/Deno process. The example embeds the JavaScript **source** into the
binary, seeds a Flop page, and streams an async TSX component reading that row.
The binary needs a writable data directory; it needs neither the checkout nor
the JavaScript file at runtime. Do not commit generated `app.js` or binaries.

For another application, export `app = defineApp(render)` from `radi/go` in
your TSX entry. `data<T>(name, input)` returns a Promise for an allowlisted Go
operation. The type parameter describes your contract; validate input and
output in your operation. Bundle with:

```sh
go run github.com/Marcisbee/radi/cmd/radi-build@VERSION -entry app.tsx -out app.js
```

Install the matching npm `radi` version for resolution, or pass `-radi PATH`
to use a source checkout. Embed the result using `//go:embed`, then pass it as
`Config.Source`. Build errors reject unresolved host packages; V8 does not
provide Node modules, timers, fetch, DOM, or Web Streams globals. Use `data()`
for I/O and timing. Server JSX and ordinary promises need no polyfills.

## Go API

Import `radi "github.com/Marcisbee/radi/go"`. `radi.New(config)` returns
`(*radi.Handler, error)`. The handler implements `http.Handler`; register it
with your HTTP server or mux. `handler.Close(ctx)` cancels work and waits for
cleanup, returning a context error if the shutdown deadline expires.

`Config.Operations` maps names to functions with this signature:

```go
func(ctx context.Context, input json.RawMessage) (any, error)
```

For example, after opening the `pages` Flop table as in
[`examples/go-server/main.go`](https://github.com/Marcisbee/radi/blob/master/examples/go-server/main.go):

```go
handler, err := radi.New(radi.Config{
    Source: source, // JavaScript source embedded with go:embed
    Queue: 32,
    Operations: map[string]radi.Operation{
        "page": func(ctx context.Context, input json.RawMessage) (any, error) {
            if err := ctx.Err(); err != nil {
                return nil, err
            }
            var args struct { ID string `json:"id"` }
            if err := json.Unmarshal(input, &args); err != nil {
                return nil, err
            }
            row, err := table.Get(args.ID)
            if err != nil {
                return nil, err
            }
            return row, ctx.Err()
        },
    },
})
if err != nil {
    return err
}
```

This matches `data<{ title: string }>('page', { id: 'home' })` in TSX.
The example uses public seeded data. Add application authorization before
reading private rows. Check missing rows and validate returned values before
using them in components.

| Config field | Default | Behavior |
| --- | --- | --- |
| `Source` | Required | Bundled JavaScript source exporting `Radi.app` |
| `Operations` | None | Allowlisted Go data functions |
| `Workers` | `1` | Parallel V8 instances; one active response per instance |
| `Queue` | `0` | Additional waiting requests; excess receives 503 |
| `Timeout` | `10 * time.Second` | Total request deadline, including queue time |
| `WriteTimeout` | `5 * time.Second` | Deadline for each response write |
| `MaxHeapBytes` | `64 << 20` | Best-effort V8 heap setting per worker, not an RSS cap |
| `MaxResponseBytes` | `16 << 20` | Total response byte limit |
| `MaxDataBytes` | `1 << 20` | Each data input/result and request metadata limit |
| `MaxDataCalls` | `32` | Total operation calls per request |
| `OnError` | None | `func(*http.Request, error)` for private render diagnostics |

Zero selects the default for each limit except `Queue`, where zero means no
waiting capacity. Negative limits are rejected. Go operations may run
concurrently, including within one request; protect shared mutable Go state.

## Request and lifecycle contract

- GET requests render HTML. Other methods receive 405. Mount the handler
  alongside Go API handlers for mutations, uploads, redirects, and auth.
- The TS request contains method, request URI (path plus query), and headers.
  Go operations receive the original request context, including auth values.
  Authorize access in Go; never trust identifiers supplied by components.
- One V8 worker is the default. Each request gets a fresh context and module
  state. The worker reuses its isolate and compiled source, but executes module
  initialization per request. Cross-request JavaScript caches are intentionally
  absent. Keep shared data caches in Go.
- Each worker handles one response at a time, including waits on data and
  slow clients. `Workers` scales parallel streams at a memory cost. `Queue`
  defaults to zero: excess work gets 503 with `Retry-After: 1`. The example
  allows 32 queued requests. The request deadline includes queue time.
- Rendering pauses at unresolved content and preserves document order.
  Each chunk is written and flushed before pulling another. OS and proxy
  buffers may absorb bytes; disable proxy buffering to expose early chunks.
  Middleware must preserve `ResponseController` deadlines and flush support
  (usually through `Unwrap`). Unsupported deadlines fail before rendering.
- Before output starts, rendering errors return generic 500 (504 on deadline).
  After output starts, errors abort the HTTP stream; readers must reject a
  truncated body. Diagnostics go to `OnError`, never into the HTML error body.
  Radi's existing component error fallback (`ERROR:ComponentName`) is preserved;
  applications needing a whole-request failure should reject outside that boundary.
- Disconnect, timeout, and `Close` cancel Go data contexts and interrupt V8.
  Failed executions discard the isolate before reuse. A joined watchdog prevents
  a late timeout from terminating the next request. `Close(ctx)` is idempotent,
  rejects new work, and waits for requests and outstanding operations before
  disposing engines. Drain `http.Server` first for graceful completion, then
  close the handler and database; cancel/close on expiry.

## Limits and operational boundary

Defaults: 10 seconds total request time, 5 seconds per socket write, 16 MiB
response, 1 MiB per data input/result and request metadata, 32 data calls per
request, and a 64 MiB V8 heap setting per worker. Data calls also have a global
in-flight bound of `Workers * MaxDataCalls`. Unknown operations, invalid JSON,
oversized results, panics and operation errors reject the Promise. Operation
errors are sanitized. Log private operation details in your Go operation.

These are **trusted application code** limits, not a hostile-code sandbox.
The V8 heap setting is best effort: allocation loops can be interrupted, but
large single allocations or native allocation failures can still terminate
the process. The renderer checks oversized text before escaping it; that does
not constrain arbitrary allocations inside application code. V8 heap size is
not whole-process RSS. Apply an OS/container memory limit and restart policy.
Use a process isolation design if executing untrusted code is required.

Go cannot forcibly stop an operation that ignores its context. Such operations
continue occupying the bounded global data capacity; `Close` returns its
context error if they do not finish. Bound external I/O and database work in
the operation. The pinned Flop synchronous `Get` has no context argument, so
the example checks cancellation before and after the read; it cannot interrupt
a read already inside Flop. Result byte limits apply after JSON serialization,
so operations must also bound their own allocations and query sizes.

Run behind your existing TLS/auth proxy. Set HTTP header/idle timeouts and
maximum headers, as in the example. Monitor 5xx, request latency, process RSS,
restart counts and private errors. Roll back the binary on new errors,
truncated responses, sustained memory growth, or failed readiness. This change
does not change Flop's persisted schema or deploy a consumer application.

## Verification and releases

```sh
go test -race ./go -timeout 3m
RADI_SOAK_SECONDS=60 go test ./go -run TestSustainedFlop -count=3 -timeout 4m -v
deno task test:server
```

The HTTP tests cover early shell/ordered escaping, actual Flop reads, client
disconnects, slow response readers, overload, shutdown, fresh request state,
exceptions, rejected promises, never-settling promises, CPU/microtask loops,
heap-loop interruption, response limits and recovery. The optional sustained
test uses 16 concurrent clients and compares every complete response against
an independent expected body. Its pass condition is zero errors/mismatches.
It reports throughput and process RSS at thirds of each run; these include the
in-process load client and are observations, not a capacity SLA or a comparison
with the earlier buffered benchmark.

`Go embedded server` CI bundles the example, runs race and ordinary tests, and
builds a Linux amd64 artifact on PRs, master pushes and published releases.
Go consumers pin the repository release tag; npm releases include `radi/go`.
Publishing remains the existing human-controlled release action. Rebuild the
app bundle and binary together when updating Radi. Preserve the prior binary
for rollback, and qualify your own components/data workload before deployment.
