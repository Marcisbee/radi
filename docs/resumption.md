# Resumption

Radi can send interactive boundaries as HTML plus JSON state, then load only the
handler requested by a click. The bootstrap does not render components, walk the
page, or create replacement DOM. This is explicit resumption, not automatic
hydration of arbitrary components or serialization of JavaScript closures.

On the server (works with string, async string, and streaming renderers):

```ts
import {
  createElement as h,
  renderToString,
  resumable,
  resumeClick,
} from 'radi/server';

const html = renderToString(resumable({ count: 0 }, [
  h('button', { type: 'button', ...resumeClick('increment') }, 'Increment'),
  h('output', null, '0'),
]));
```

Bundle a small bootstrap using the separate `radi/resume` entry:

```ts
import { resume } from 'radi/resume';

const dispose = resume(document, {
  increment: () => import('./counter.js').then((module) => module.increment),
}, { onError: (error) => console.error('Unable to deliver click', error) });
```

Install it **before the interactive HTML is parsed**, for example with a
blocking external script in the head. A deferred/module script alone cannot
capture clicks that happen before it executes. The bootstrap must be available;
application handler modules may load later. No inline script or `eval` is
required. Configure your CSP to allow the bootstrap and your handler modules.

The lazy module uses the server state and existing nodes:

```ts
import type { ResumeContext } from 'radi/resume';

export function increment(context: ResumeContext) {
  const state = context.state as { count: number };
  context.boundary.querySelector('output')!.firstChild!.nodeValue = String(
    ++state.count,
  );
}
```

State is parsed once per boundary and retained weakly in memory. Mutations and
assignments to `context.state` persist between handlers, but are not written
back to HTML. Use the same initial data for server markup and state. State must
contain only JSON values (finite numbers, strings, booleans, null, arrays, plain
objects), without cycles. It is public page data: never put secrets in it.
Attribute escaping protects serialized data, and markup only names keys from
your trusted registry; it never specifies executable source or module URLs.
Treat handler inputs as untrusted and enforce authorization on the server.

Click delivery is ordered within each boundary, including async handlers.
Separate boundaries progress independently. The final direct-child template
marks streamed completion; do not remove it until disposal. Handlers wait for
both that marker and their module. Nested boundaries own their clicks. Use a
valid boundary tag for the HTML context (`div` by default; `section`, `article`,
`main`, `aside`, `nav`, `span`, `li`, and `td` are also supported). Keep
ordinary client roots outside these boundaries: `createRoot` still owns and
replaces its initial content.

Only explicitly registered clicks are intercepted, including keyboard-generated
button clicks. They are delivered directly to the named handler exactly once;
they are not redispatched as synthetic DOM clicks. `context.element` is the
element carrying the binding; `context.event` retains the original target and
mouse/modifier fields. Its `currentTarget` is no longer valid during delivery.
Registered clicks suppress native defaults and propagation immediately: use
`type="button"` controls for actions. Navigation, form submission, input/change,
pointer gestures, and privileged actions requiring transient user activation are
not replayed. Leave links and native form controls unbound for native behavior.

The default cap is 64 queued/running clicks per bootstrap (`maxPending`).
Overflow is reported and dropped. Loading/stream completion has a 30-second
timeout (`timeout`). Failures call `onError`; later clicks can retry failed
module loads. Handlers should handle their own application errors and honor
`context.signal` when doing async work. Disposal removes capture, aborts pending
delivery, releases cached loaders, and prevents queued clicks from running.
Running application code cannot be forcibly stopped. Removed targets are
skipped. Install once per root, avoid overlapping roots, and call the disposer
before tearing down the page.

Run the real streaming example with `deno run -A examples/resumption.ts`, then
open `http://127.0.0.1:4318`. It deliberately delays handler delivery by two
seconds. The API adds no dependency to the normal client entry and no
per-element listener. Measure bootstrap bytes and click-to-handler latency on
your deployment; network module latency still applies to the first interaction.
