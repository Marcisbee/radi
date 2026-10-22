# Server rendering

Import from `radi/server` and configure automatic JSX with
`jsxImportSource: "radi/server"`. Use the server JSX runtime for the entire
server component tree; client DOM nodes and universal-adapter nodes are separate
APIs. The server entry point does not require `document`, `window`, or `Node`
globals.

```tsx
import { renderToReadableStream, renderToString } from 'radi/server';

function Greeting(props: () => { name: string }) {
  return <h1>Hello, {props().name}</h1>;
}

const html = renderToString(<Greeting name='Ada' />);
const response = new Response(renderToReadableStream(<Greeting name='Ada' />), {
  headers: { 'content-type': 'text/html; charset=utf-8' },
});
```

`renderToString` is synchronous and throws if it encounters a promise. Use
`renderToStringAsync` to collect async output, or `renderToReadableStream` to
return ordered UTF-8 HTML bytes directly from a Fetch-compatible server such as
Deno. For Node HTTP, adapt the Web stream with Node's `Readable.fromWeb`.
`renderToStringRoot` and `ssr(() => tree)` remain synchronous conveniences.

Components and reactive children execute when rendering reaches them, rather
than during element creation. Props remain getter functions, including
`children`. Async components are awaited in document order. The stream flushes
available HTML before waiting for a promise, so the shell can arrive while
content is still loading. Siblings after the pending content wait for it; there
is no client-side replacement script or out-of-order suspense protocol.

The writer walks the input directly without building an expanded virtual tree.
Streaming batches roughly 16 KiB of text at a time (UTF-8 bytes and a large
individual attribute token may exceed this), with no read-ahead queue. Large
text nodes are split without breaking surrogate pairs. Backpressure pauses
traversal; cancellation stops future traversal. Cancellation cannot abort an
application promise or undo work already started by a component. Defer expensive
work inside components instead of creating promises eagerly.

Each subscribable is sampled for its first synchronous value and immediately
unsubscribed, supporting both cleanup functions and `unsubscribe()` objects. A
source without a synchronous value emits the existing null marker. Server
rendering does not maintain live subscriptions or run DOM lifecycle events.

Existing `<host>` component wrappers, reactive `<!--$-->` markers, null/boolean
comments, and fragment output are preserved. Component failures, including async
rejections, emit the existing `ERROR:ComponentName` fallback. Rejected promise
children, invalid input, and reactive/subscription errors fail the render or
error the stream. Once a response has started, its status cannot be changed.

Text and attributes are escaped. Event, key, ref, and function-valued attributes
are omitted; invalid tag/attribute names are rejected. There is no raw-HTML API.
Style objects retain existing client parity semantics (use explicit units such
as `fontSize: '12px'`). Hydration remains unimplemented.

`createRenderer`, `createServerStringAdapter`, and `SERVER_RENDERER` remain the
legacy universal-adapter API for custom renderers. Use their own creation and
rendering functions together; their eager nodes do not participate in the new
lazy streaming writer.

## Run and validate

```sh
deno task test:server
deno run --config deno.server.json --allow-net=127.0.0.1:8080 examples/server.ts
curl --no-buffer http://127.0.0.1:8080/
```

The example serves a streamed document and a `/health` readiness endpoint. The
server suite runs with no browser shims and checks real loopback HTTP delivery
before resolving the async content. The existing browser suite remains available
with `deno task test` and requires Playwright Chromium.

## Performance measurement

```sh
deno task bench:server 1000 200 adapter
deno task bench:server 1000 200 writer
deno task bench:server 1000 200 stream
```

Each invocation warms up with 30 renders, then runs five batches of 200 renders
of a 1,000-row page (53,806 output characters). Measurements include input-tree
creation, attributes, escaping, and output consumption. The adapter comparison
uses the retained universal adapter with server-runtime import/root fixes. The
stream case discards consumed bytes rather than retaining a full result. Memory
is sampled after each render and each streamed chunk, not a profiler's
allocation count or a guaranteed instantaneous peak. GC and machine load affect
these numbers; compare fresh processes on the same machine.

A local Linux run with Deno 2.9.3 / V8 14.9 measured:

| Renderer             | Median renders/s |    Range | Sampled peak heap | Sampled peak RSS |
| -------------------- | ---------------: | -------: | ----------------: | ---------------: |
| Universal adapter    |              645 |  537–650 |          81.0 MiB |        174.7 MiB |
| Direct string writer |              999 | 848–1006 |          34.7 MiB |        123.2 MiB |
| Streaming writer     |              881 |  822–902 |          36.9 MiB |        124.7 MiB |

The direct writer delivered about 1.55× the adapter's median throughput on this
fixture, supporting its use as the server default. Five shell-first reads with a
never-resolving async tail measured 0.039–2.282 ms in the string benchmark
process (first streaming use: 2.282 ms), and 0.003–0.135 ms after streaming
warmup. These are in-process first-output times, not network TTFB or universal
performance guarantees. The HTTP regression separately verifies that shell bytes
reach a client before async content resolves.
