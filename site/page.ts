import { references } from './reference.ts';
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
    h(
      'p',
      null,
      'Install Radi, then configure your bundler to use its automatic JSX runtime.',
    ),
    h('h3', { id: 'install-package' }, 'Add the package'),
    code('Terminal', 'npm install radi', 'bash'),
    h('h3', { id: 'configure-jsx' }, 'Configure JSX'),
    h(
      'p',
      null,
      'Set the automatic JSX runtime in your TypeScript configuration.',
    ),
    code(
      'tsconfig.json',
      '{\n  "compilerOptions": {\n    "jsx": "react-jsx",\n    "jsxImportSource": "radi"\n  }\n}',
      'json',
    ),
    h('h3', { id: 'first-component' }, 'Mount your first component'),
    h(
      'p',
      null,
      'Add an element with id="app" to your HTML and load your bundled entry script.',
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
      "import { update } from 'radi';\n\nfunction Counter() {\n  let count = 0;\n  const view = (\n    <button onclick={() => { count++; update(view); }}>\n      Count: {() => count}\n    </button>\n  );\n  return view;\n}",
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
    h(
      'a',
      { href: '/docs/routing.md' },
      'Routing guide, action examples, and Go/V8 integration requirements →',
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
      'The adapter bounds queued work, data calls, response bytes, and execution time. Slow readers apply backpressure; disconnects cancel operations. Use trusted application code, external memory limits and a restart policy: the V8 heap setting is not a hard memory sandbox. Go operations must respect cancellation. This adapter does not include a client router or SPA data layer.',
    ),
    h(
      'p',
      null,
      h('a', { href: '#go-api' }, 'radi/go API'),
      ' · ',
      h(
        'a',
        { href: '/docs/go-server.md' },
        'Complete Go setup, configuration, and deployment guide',
      ),
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
        ...publishingSections,
        ...references,
        h(
          'footer',
          null,
          h('span', null, 'Radi · MIT licensed'),
          h('a', { href: '/index.md' }, 'Markdown'),
          h('a', { href: '/llms.txt' }, 'llms.txt'),
          h('a', { href: '#' }, 'Back to top ↑'),
        ),
      ),
    ),
  ];
}
