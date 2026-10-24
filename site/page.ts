import { references } from './reference.ts';
import { recipes } from './recipes.ts';
import { createElement as h, resumable, resumeClick } from '../src/server.ts';
import { code, githubLink, navigation, section, sidebarBrand } from './ui.ts';

function introduction() {
  return h(
    'section',
    { class: 'intro', id: 'overview' },
    h('h1', null, 'Introduction'),
    h(
      'p',
      { class: 'lead' },
      'Radi is a lightweight reactive JSX runtime. Write components as plain functions and update the DOM directly.',
    ),
    h(
      'div',
      { class: 'intro-links' },
      h('a', { class: 'primary', href: '#start' }, 'Install Radi →'),
      h(
        'a',
        { href: '#reactivity' },
        'How reactivity works →',
      ),
    ),
  );
}

const basicSections = [
  section(
    'start',
    'Installation',
    h('h3', { id: 'create-project' }, 'Create a project'),
    h(
      'p',
      null,
      'Open a terminal with Node.js 22+ and npm installed. Allow about 5 minutes for the SPA setup, depending on download speed.',
    ),
    h('h3', null, 'Step 1: Create your app'),
    code('Terminal', 'npm create radi@latest -- my-app --template spa', 'bash'),
    h(
      'p',
      null,
      'Use a new or empty directory. The generator refuses nonempty destinations and does not install dependencies.',
    ),
    h('h3', null, 'Step 2: Install dependencies'),
    code('Terminal', 'cd my-app\nnpm install', 'bash'),
    h('h3', null, 'Step 3: Start the development server'),
    code('Terminal', 'npm run dev', 'bash'),
    h('h3', null, 'Step 4: Open your app'),
    h(
      'p',
      null,
      'Open http://127.0.0.1:3000. Your Radi app is running. Edit app.tsx, save, and reload the browser to see your change.',
    ),
    h('h3', { id: 'choose-template' }, 'Choose another template'),
    h(
      'p',
      null,
      'Replace spa in the create command with the template you need:',
    ),
    h(
      'ul',
      null,
      h(
        'li',
        null,
        h('code', null, 'spa'),
        ' — a browser-rendered app. Start here if you are unsure.',
      ),
      h(
        'li',
        null,
        h('code', null, 'ssr'),
        ' — HTML rendered by a Node server for each request.',
      ),
      h(
        'li',
        null,
        h('code', null, 'ssg'),
        ' — HTML generated at build time for a static host.',
      ),
      h(
        'li',
        null,
        h('code', null, 'go'),
        ' — a Go server with embedded V8 for rendering.',
      ),
    ),
    h(
      'p',
      null,
      'The Go starter also requires Linux amd64 with glibc, Go 1.26.10, Clang 21, and CGO enabled. Follow its generated README.md to set the compiler environment before running npm run dev.',
    ),
    h(
      'p',
      null,
      'Each generated README.md explains editing, building, and deployment for that template.',
    ),
    h('h3', { id: 'existing-project' }, 'Use an existing project'),
    h(
      'p',
      null,
      'Already created a starter? Skip this manual setup. To add Radi to an existing project, follow the steps below. The reference describes the current repository API; check exports and types against your installed version before using newer features.',
    ),
    h('h3', { id: 'install-package' }, 'Add the package'),
    code(
      'Terminal',
      'npm install radi',
      'bash',
    ),
    h('h3', { id: 'configure-jsx' }, 'Configure JSX'),
    h(
      'p',
      null,
      'Use a bundler that supports JSX. Merge these options into your TypeScript configuration.',
    ),
    code(
      'tsconfig.json',
      '{\n  "compilerOptions": {\n    "jsx": "react-jsx",\n    "jsxImportSource": "radi",\n    "types": ["./node_modules/radi/jsx.d.ts"]\n  }\n}',
      'json',
    ),
    h(
      'p',
      null,
      'The types entry above loads Radi’s browser JSX declarations. Its JSX attributes are permissive, so type checking does not guarantee valid HTML or correct runtime behavior.',
    ),
    h(
      'p',
      null,
      'The signal, channel, renderer, types and symbols entries below describe source-checkout APIs. Check your package exports before importing those subpaths. The application recipes use the public client API.',
    ),
    h('h3', { id: 'first-component' }, 'Mount your first component'),
    h(
      'p',
      null,
      'Add a <div id="app"></div> to your HTML, then mount a component from your browser entry.',
    ),
    code(
      'main.tsx',
      "import { createRoot } from 'radi';\n\nfunction App() {\n  return <h1>Hello, Radi.</h1>;\n}\n\nconst root = createRoot(document.getElementById('app')!);\nroot.render(<App />);",
    ),
  ),
  section(
    'components',
    'Components',
    h(
      'p',
      null,
      'A component runs once when it mounts. Keep state in its closure. Props arrive as a getter; call it inside a reactive expression to read the latest value.',
    ),
    code(
      'greeting.tsx',
      'function Greeting(props: () => { name: string }) {\n  return <h1>Hello, {() => props().name}!</h1>;\n}',
    ),
  ),
  section(
    'reactivity',
    'Reactivity',
    h(
      'p',
      null,
      'Wrap dynamic children or attributes in functions. Call update on their ancestor to evaluate those functions again. Static content stays put.',
    ),
    code(
      'counter.tsx',
      "import { update } from 'radi';\n\nfunction Counter() {\n  let count = 0;\n  const view = (\n    <button onclick={() => { count++; update(view as HTMLElement); }}>\n      Count: {() => count}\n    </button>\n  );\n  return view;\n}",
    ),
    h(
      'p',
      null,
      'The HTMLElement assertion narrows Radi’s broad JSX return type for a known HTML element. It does not convert the value. Components run once; destructuring props or returning count without a function captures only the initial value.',
    ),
  ),
  section(
    'lifecycle',
    'Lifecycle',
    h(
      'p',
      null,
      'Elements receive connect and disconnect events. Tie subscriptions to the component lifecycle with an abort signal.',
    ),
    code(
      'Lifecycle',
      "import { createAbortSignal } from 'radi';\n\nfunction Panel(this: HTMLElement) {\n  const signal = createAbortSignal(this);\n  window.addEventListener('resize', () => {\n    // Respond to the new viewport.\n  }, { signal });\n  return <div>Ready when you are.</div>;\n}",
    ),
  ),
];

const publishingSections = [
  section(
    'routing',
    'Client routing',
    h(
      'p',
      null,
      'Use radi/router for SPA navigation without replacing the document. Keep shared layout outside a route outlet. Routes can load code lazily, read server data through loaders, and mutate it through actions followed by revalidation.',
    ),
    code(
      'router.ts',
      `import { createElement as h, createRoot } from 'radi';
import { createRouter, fetchRouteData } from 'radi/router';

const root = createRoot(document.getElementById('outlet')!);
const router = createRouter({
  routes: [{
    path: '/pages/:id',
    loader: ({ params, signal }) => fetchRouteData(
      '/api/pages/' + encodeURIComponent(params.id), { signal },
    ),
  }],
});
router.subscribe((state) => {
  if (state.status !== 'idle') return;
  if (state.error) root.render(h('p', null, 'Could not load this page.'));
  else root.render(h('pre', null, JSON.stringify(state.data, null, 2)));
});
router.attach();
await router.ready;
// Dispose when the application is removed: router.dispose();`,
    ),
    h(
      'p',
      null,
      'Serve the application shell for direct visits to these URLs. The example expects a JSON endpoint implemented by your server. Authorization and persistence remain on the server; fresh data can still require a request.',
    ),
    h(
      'p',
      null,
      'The optional initialData setting reuses data serialized by your server. Rendering an outlet replaces its existing DOM; it does not hydrate it. Routes are flat, with static paths, :parameters, and a final * wildcard. This is not Remix API compatibility.',
    ),
    h(
      'p',
      null,
      'Caching is disabled by default. Enable staleTime and a bounded cacheSize to reuse prefetched data. Invalidate on account changes. New navigation aborts obsolete loads, but aborting an action cannot undo a server mutation.',
    ),
    h('h3', null, 'Save through a route action'),
    code(
      'Add to the /pages/:id route',
      `action: ({ params, formData, method, signal }) => fetchRouteData(
  '/api/pages/' + encodeURIComponent(params.id),
  { method, body: formData, signal },
),`,
    ),
    code(
      'Explicit form submission',
      `<form onsubmit={(event: SubmitEvent) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  void router.submit(location.pathname, new FormData(form), 'POST');
}}>
  <label>Title <input name="title" required /></label>
  <button type="submit">Save</button>
</form>`,
    ),
    h(
      'p',
      null,
      'submit navigates and reloads the destination loader. Show submitting and error states from router.subscribe. Use a component-owned createFetcher for local changes that must preserve the route and its drafts; it runs only the action, so apply its returned data or explicitly reload. Dispose it on disconnect.',
    ),
    h(
      'p',
      null,
      "For code splitting, add lazy: () => import('./settings') to a route. That module exports loader, action and optionally view. Your subscriber calls root.render(state.module.view(state)) when idle; the router never renders it for you. Provide error/retry UI, focus management and any custom scroll restoration.",
    ),
    h(
      'p',
      null,
      'For Go integration, serve JSON endpoints beside the HTML handler and share authorized data functions between them. Safely serialize initial data into HTML and pass it as initialData. Authenticate, validate and enforce CSRF protection in the server endpoints; never expose the V8 operation registry as an API.',
    ),
  ),
  section(
    'server',
    'Server rendering',
    h(
      'p',
      null,
      'Use the separate server entry to render HTML without a browser. Choose synchronous rendering, resolved async HTML, or ordered streaming. For JSX on the server, set jsxImportSource to radi/server.',
    ),
    code(
      'server.ts',
      "import { createElement as h, renderToString } from 'radi/server';\n\nconst html = renderToString(h('h1', null, 'Hello from the server.'));",
    ),
    h('a', {
      href: '#server-api',
    }, 'radi/server →'),
  ),
  section(
    'go-server',
    'Go + embedded V8',
    h(
      'p',
      null,
      'Keep application components in TypeScript/TSX while Go owns HTTP, authorization, and Flop access. The Go adapter embeds V8 in the server process and streams ordered HTML. It uses neither a Node/Deno serving process nor a persisted bytecode cache.',
    ),
    code(
      'app.tsx',
      "import { data, defineApp } from 'radi/go';\n\nasync function Title() {\n  const row = await data<{ title: string }>('page', { id: 'home' });\n  return <h1>{row.title}</h1>;\n}\n\nexport const app = defineApp(() => (\n  <main><p>Loading your page…</p><Title /></main>\n));",
    ),
    h(
      'p',
      null,
      'Register the page operation in Go and return its Flop result. data() resolves that result as a Promise. Bundle the TSX with radi-build, embed the JavaScript source with go:embed, and pass it to radi.New from github.com/Marcisbee/radi/go. The checked-in example includes the complete Go host and database setup.',
    ),
    code(
      'Build the Flop example',
      'export CC=clang-21 CXX=clang++-21 CGO_CXXFLAGS=-nostdinc++\ngo generate ./examples/go-server\ngo build -trimpath -o radi-go-server ./examples/go-server\nRADI_ADDR=127.0.0.1:8080 RADI_DATA_DIR=./data ./radi-go-server',
      'bash',
    ),
    h(
      'p',
      null,
      'Run these commands from a Radi checkout with Go 1.26.10 and Clang 21. Linux amd64 is the qualified target. The Go-based bundler needs no JavaScript runtime at build time. Each request gets fresh JavaScript state; the default single worker reuses its V8 instance and compiled source.',
    ),
    h(
      'p',
      null,
      'The adapter bounds queued work, data calls, response bytes, and execution time. Slow readers apply backpressure; disconnects cancel operations. Use trusted application code, external memory limits and a restart policy: the V8 heap setting is not a hard memory sandbox. Go operations must respect cancellation. Pair the adapter with radi/router for client navigation and route data handling through Go HTTP endpoints.',
    ),
    h(
      'p',
      null,
      h('a', { href: '#go-api' }, 'radi/go API'),
      ' · ',
      h('a', { href: '#go-setup' }, 'Go host setup'),
    ),
    h('h3', { id: 'go-setup' }, 'Use your own Go host'),
    h(
      'p',
      null,
      'Use matching Radi release tags for Go and npm, or one source checkout for both. From the Go application module, bundle the app.tsx above with the following command. Replace VERSION with your pinned release tag; use -radi PATH to resolve a source checkout instead of the installed npm package.',
    ),
    code(
      'Bundle',
      'go run github.com/Marcisbee/radi/cmd/radi-build@VERSION -entry app.tsx -out app.js',
      'bash',
    ),
    h(
      'p',
      null,
      'Place this host beside app.js. The page operation returns public demo data; replace it with an authorized, validated database read. Add the matching github.com/Marcisbee/radi module version to go.mod.',
    ),
    code(
      'main.go',
      `package main

import (
  "context"
  _ "embed"
  "encoding/json"
  "log"
  "net/http"
  "time"

  radi "github.com/Marcisbee/radi/go"
)

//go:embed app.js
var source string

func main() {
  handler, err := radi.New(radi.Config{
    Source: source,
    Operations: map[string]radi.Operation{
      "page": func(ctx context.Context, input json.RawMessage) (any, error) {
        return map[string]string{"title": "Hello from Go"}, ctx.Err()
      },
    },
  })
  if err != nil { log.Print(err); return }
  defer handler.Close(context.Background())
  server := &http.Server{
    Addr: "127.0.0.1:8080", Handler: handler,
    ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second,
  }
  log.Print(server.ListenAndServe())
}`,
      'go',
    ),
    h(
      'p',
      null,
      'Build with CGO enabled on Linux amd64/glibc using the Clang environment above, then run the binary. V8 has no fetch, timers, Node modules, DOM or Web Streams globals; use data() for I/O. Go operations may run concurrently and must bound their own work and honor context cancellation.',
    ),
    h('h3', null, 'Limits and deployment'),
    code(
      'Config defaults',
      `radi.Config{
  Source: source,                  // required bundled source
  Workers: 1, Queue: 0,            // excess requests receive 503
  Timeout: 10 * time.Second,       // includes queue time
  WriteTimeout: 5 * time.Second,   // per response write
  MaxHeapBytes: 64 << 20,          // best effort, not an RSS cap
  MaxResponseBytes: 16 << 20,
  MaxDataBytes: 1 << 20,           // each input/result and request metadata
  MaxDataCalls: 32,               // per request
  OnError: func(r *http.Request, err error) { log.Print(err) },
}`,
      'go',
    ),
    h(
      'p',
      null,
      'Zero selects defaults except Queue, where it means no waiting capacity. Negative limits are rejected. One worker handles one response at a time, including slow readers; more workers cost memory. Data calls also have a global bound of Workers × MaxDataCalls.',
    ),
    h(
      'p',
      null,
      'The handler accepts GET only. Put mutations and authentication in separate HTTP handlers. Before streaming starts, failures return 500 or 504; after it starts, failure truncates the response. Component failures can render ERROR:ComponentName, so handle expected errors in the application. Keep diagnostics private with OnError.',
    ),
    h(
      'p',
      null,
      'Serve behind TLS, disable proxy buffering for early chunks, and preserve HTTP flush/write-deadline support in middleware. For shutdown, drain http.Server first, then Close the Radi handler with a deadline and close the database. Monitor errors, latency and process memory. Rebuild the bundle and binary together when upgrading; keep the previous binary for rollback.',
    ),
  ),
  section(
    'static',
    'Static sites',
    h(
      'p',
      null,
      'This guide is built with Radi’s static site generator. Routes become complete HTML files. Your build owns the filesystem writer, asset bundling, and deployment; no Radi server runs in production.',
    ),
    code(
      'build.ts',
      "import { generateStaticSite } from 'radi/static';\nimport { createElement as h } from 'radi/server';\nimport { mkdir, writeFile } from 'node:fs/promises';\nimport { dirname, join } from 'node:path';\n\nawait generateStaticSite([{\n  path: '/',\n  title: 'My site',\n  render: () => h('h1', null, 'Made with Radi.'),\n}], async (path, html) => {\n  const file = join('dist', path);\n  await mkdir(dirname(file), { recursive: true });\n  await writeFile(file, html);\n});",
    ),
    h('a', {
      href: '#static-api',
    }, 'radi/static →'),
  ),
  section(
    'islands',
    'Interactive islands',
    h(
      'p',
      null,
      'Add explicit resumable boundaries to static HTML. Their handlers update existing DOM without rendering the whole page again. This example includes its handler in the initial script, so the first click needs no additional download.',
    ),
    resumable(
      { count: 0 },
      h(
        'div',
        { class: 'demo' },
        h(
          'div',
          null,
          h('span', { class: 'demo-label' }, 'Live example'),
          h('p', null, 'A counter on a static page'),
        ),
        h(
          'div',
          { class: 'counter' },
          h('output', { 'aria-live': 'polite', 'aria-label': 'Count' }, '0'),
          h(
            'button',
            { type: 'button', ...resumeClick('increment') },
            'Add one +',
          ),
        ),
        h(
          'p',
          { class: 'demo-note', role: 'status' },
          'Click to increment the counter.',
        ),
      ),
    ),
    code(
      'Server boundary',
      "import { createElement as h, resumable, resumeClick } from 'radi/server';\n\nconst counter = resumable({ count: 0 }, [\n  h('button', { type: 'button', ...resumeClick('increment') }, 'Add one'),\n  h('output', null, '0'),\n]);",
    ),
    code(
      'client.ts',
      "import { resume } from 'radi/resume';\nimport { increment } from './handler';\n\nresume(document, {\n  increment: () => Promise.resolve(increment),\n});",
    ),
    code(
      'handler.ts',
      "import type { ResumeContext } from 'radi/resume';\n\nexport function increment({ state, boundary }: ResumeContext) {\n  const counter = state as { count: number };\n  boundary.querySelector('output')!.textContent = String(++counter.count);\n}",
    ),
    h(
      'p',
      { class: 'callout' },
      'Bundle the client entry as a classic script and pass its public URL as the static page’s bootstrap. Dynamic imports are optional: use them for larger, rarely used interactions when the download delay is acceptable.',
    ),
    h(
      'p',
      null,
      'This is explicit resumption: arbitrary closures are not serialized. Use native links and forms for navigation. The current island API supports registered clicks.',
    ),
    h(
      'p',
      null,
      'Keep the initial markup and JSON state consistent. State changes persist in memory, not in the HTML attribute. Preserve the boundary’s final template marker: streamed clicks wait for it. Keep ordinary client roots outside islands, since their first render replaces existing HTML. Configure CSP to allow your bootstrap and any lazy handler modules.',
    ),
    h('h3', { id: 'automatic-islands' }, 'Why are islands explicit?'),
    h(
      'p',
      null,
      'Function children identify dynamic output, but do not identify a browser module or preserve a closure’s captured state. Radi currently has no compiler to extract those functions. A wrapper could generate registry entries for explicit module references, but could not automatically resume arbitrary components.',
    ),
    h('a', {
      href: '#resume-api',
    }, 'radi/resume →'),
  ),
];

export function page() {
  return [
    h('a', { class: 'skip', href: '#content' }, 'Skip to content'),
    h(
      'div',
      { class: 'mobile-menu' },
      sidebarBrand(),
    ),
    h('button', {
      class: 'menu-toggle',
      type: 'button',
      hidden: true,
      'aria-label': 'Open navigation',
      'aria-controls': 'mobile-navigation',
      'aria-haspopup': 'dialog',
    }, h('span', { class: 'burger-icon', 'aria-hidden': 'true' }, h('span'))),
    h(
      'dialog',
      { id: 'mobile-navigation', 'aria-label': 'Documentation menu' },
      h(
        'div',
        { class: 'sheet-heading' },
        h('strong', null, 'On this page'),
        h('button', {
          type: 'button',
          'data-close-menu': '',
          'aria-label': 'Close navigation',
        }, h('span', { class: 'close-icon', 'aria-hidden': 'true' })),
      ),
      navigation('Mobile documentation'),
      githubLink(),
    ),
    h(
      'div',
      { class: 'layout' },
      h(
        'aside',
        { class: 'sidebar' },
        sidebarBrand(),
        navigation('Documentation'),
        githubLink(),
      ),
      h(
        'main',
        { id: 'content' },
        introduction(),
        ...basicSections,
        ...recipes,
        ...publishingSections,
        ...references,
        h(
          'footer',
          null,
          h('span', null, 'Radi · MIT licensed'),
          h('a', { href: '#' }, 'Back to top ↑'),
        ),
      ),
    ),
  ];
}
