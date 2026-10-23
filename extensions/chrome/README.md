# Radi DevTools

A Chrome DevTools panel for the Radi DOM client. Load the extension directly
from this directory; it has no build step or dependencies.

1. Open `chrome://extensions`, enable **Developer mode**, choose **Load
   unpacked**, and select `extensions/chrome` from this checkout.
2. Use a Radi build from this change. In your development entry point:

   ```ts
   import { enableDevTools } from 'radi/devtools';

   const dispose = enableDevTools();
   // Call dispose() when the development entry point is unloaded by HMR.
   ```

   Gate the import and call with your bundler's development flag. Do not enable
   the bridge in production: it exposes component props to scripts in the page.
   Existing published Radi versions without this entry point are unsupported.
3. Open DevTools on your app tab and select **Radi** (possibly under `»`).

For a working example, run `deno task devtools:demo` and open
`http://127.0.0.1:8174`. Record, increment, remount, unmount, and
disable/re-enable the bridge to explore the panel's lifecycle states.

## Views

The panel follows Chrome DevTools' light or dark theme. Tree disclosure controls
collapse descendants; filtering still finds nodes inside collapsed branches. The
inspector uses fixed metric columns and collapsible property groups. In
Performance, “At, ms” is relative to the earliest call still in the buffer;
duration bars compare each call with the longest buffered call.

- **Components** shows named component hosts, nesting, props, and recorded call
  counts. Prop previews are shallow and capped; getters and functions are not
  invoked. Minified anonymous functions may have unhelpful names.
- **Layers** shows DOM nesting below Radi components and reactive nodes,
  including reactive expressions and attribute bindings. Selection exposes
  bounds, display, position, overflow, transform, and z-index. These are DOM
  layers, not browser compositor layers. Reactive anchors may own following
  siblings.
- **Performance** lists the latest 500 recorded component initialization and
  reactive render calls, including mount/update, duration, and unmounted nodes.
  Start recording before remounting to capture initialization. Clear resets
  counters and history. Recording stops when the panel is hidden or closed.

If the panel disconnects unexpectedly, recording expires after three seconds
without a snapshot. Resume recording after a long pause in the debugger.

**Highlight** briefly outlines the selected DOM element. For comment anchors it
uses the following element or parent; for zero-width hosts it uses the first
element child. **Inspect DOM** reveals the actual node in Chrome's Elements
panel. Filter accepts a component or element name. The inspector refreshes once
per second while visible; **Refresh** requests an immediate snapshot.

Durations measure inclusive synchronous Radi execution with `performance.now()`.
They exclude asynchronous waits, browser layout and paint, and reactive
attribute event handlers. Nested durations overlap and must not be summed as
frame time. Counters start at recording, not page load. This is a diagnostic
tool, not a benchmark; tree snapshots and profiling add overhead.

The first 5,000 nodes and 100 props per selected component are shown. Only the
main document is supported; iframe and shadow-root trees, resumable server-only
nodes, non-DOM renderers, and Web Store distribution are outside this version.
The extension requests no host permissions, sends no telemetry, and stores no
page data. It uses Chrome's DevTools inspected-window API to access the opt-in
bridge in the inspected page.

## Validation

`xvfb-run -a deno task test:devtools` loads the unpacked extension into
Chromium, opens the real DevTools panel, and drives the example. Install the
matching browser first with
`deno run -A npm:playwright@1.64.1 install chromium`.
