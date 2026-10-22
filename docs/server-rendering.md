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

For Go hosting, use the [embedded V8 adapter](go-server.md). It bundles TSX
into the Go binary and connects async components to Go operations such as Flop
reads. Go handles HTTP streaming, cancellation, backpressure, and shutdown;
no Node/Deno serving process is needed. The adapter uses its own pull-based
bridge, so bare V8 does not need Web Streams or Fetch globals.

Components and reactive children execute when rendering reaches them, rather
than during element creation. Props remain getter functions, including
`children`. Async components are awaited in document order. The stream flushes
available HTML before waiting for a promise, so the shell can arrive while
content is still loading. Siblings after the pending content wait for it; there
is no client-side replacement script or out-of-order suspense protocol.

The synchronous writer concatenates HTML directly. Streaming uses an explicit
traversal stack that can pause without creating a generator for each node. Both
share escaping and attribute handling, and neither builds an expanded virtual
tree. Validated tag/attribute names have bounded caches (256 entries each, names
up to 64 characters); request values and rendered HTML are never cached.
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

After optimization, a local Linux run with Deno 2.9.3 / V8 14.9 sampled peak
heap/RSS of 35.1/121.2 MiB for the string writer and 36.5/124.2 MiB for
streaming. Five shell-first reads with a never-resolving tail took 0.027–2.375
ms in the string benchmark process (first streaming use: 2.375 ms), and
0.003–0.163 ms after streaming warmup. These are in-process first-output
measurements, not network TTFB. The HTTP regression separately verifies shell
delivery before async resolution.

### Framework comparison

```sh
NODE_ENV=production deno run -A --no-lock --config deno.server.json \
  bench/server-compare.ts radi elements string 1000 200
```

Replace `radi` with `react`, `preact`, or `vue`; `elements` with `components`;
and `string` with `stream`. Run cases sequentially, each in its own process. The
script verifies exact expected HTML before measuring, includes tree creation,
uses 100 warmups and five batches of 200 renders, and prints all samples as
JSON. Stream cases fully consume the Web stream through `Response.text()`.

Pinned versions are React 19.2.0, Preact 10.26.8 with preact-render-to-string
6.5.13, and Vue/server-renderer 3.5.22. All run with `NODE_ENV=production`.
Component fixtures explicitly add Radi's host boundary in the other frameworks
so the output is identical. The 1,000-row element fixture emits 49,806
characters; the component fixture emits 62,806.

Two local sweeps, with reversed framework order on the second, produced these
ranges of median renders/second (higher is better):

| Workload            |        Radi |       React |      Preact |         Vue |
| ------------------- | ----------: | ----------: | ----------: | ----------: |
| Elements → string   | 5,224–5,291 | 2,896–3,105 | 4,143–4,233 | 2,010–2,129 |
| Components → string | 4,705–4,786 | 1,830–1,926 | 2,516–2,631 |     590–643 |
| Elements → stream   | 3,715–3,917 |     297–326 | 3,216–3,314 | 1,770–1,802 |
| Components → stream | 3,010–3,103 |     272–302 | 2,023–2,452 |     491–526 |

Radi leads these cases in both sweeps. The previous generator-based writer
measured 984 renders/second on the element-to-string fixture with 30 warmups;
the current implementation measures over 5,200 with the expanded harness. This
is a local synthetic comparison, not a universal framework ranking. These trees
are synchronous even in the streaming transport cases. Async correctness is
tested separately; this table does not rank async scheduling, hydration, network
TTFB, compiled Vue templates, Marko, or Node's native pipeable streams.

### Research and optimization choices

[Marko's server compiler](https://markojs.com/docs/explanation/why-is-marko-fast)
emits HTML directly without an intermediate tree, and
[Vue's SSR compiler](https://vuejs.org/guide/scaling-up/ssr) uses string
concatenation. Radi applies the direct-write principle at runtime while keeping
its existing JavaScript component API; it does not introduce a template
compiler.

Measured steps on the original 1,000-row fixture raised synchronous throughput
from approximately 984 to 2,125 renders/second by removing generator traversal,
then to 4,201 by scanning escaped text and avoiding attribute-entry arrays.
Bounded name metadata caches brought the final comparison above 5,200. Streaming
uses an explicit stack to retain backpressure and cancellation without nested
generators. These step measurements guide the implementation; use the repeatable
harness for a fresh comparison on deployment hardware.

[Marko's streaming documentation](https://markojs.com/docs/explanation/streaming)
also distinguishes ordered output from out-of-order replacement. Radi keeps its
ordered, script-free streaming contract. No claim of outperforming compiled
Marko SSR is made here.
