import { createElement as h, resumable, resumeClick } from '../src/server.ts';
import { code, header, navigation, section } from './ui.ts';

function introduction() {
  return h(
    'section',
    { class: 'intro', id: 'overview' },
    h('p', { class: 'eyebrow' }, 'GETTING STARTED'),
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
        'How reactivity works ↗',
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
    code('Terminal', 'npm install radi', 'bash'),
    h('h3', null, 'Configure JSX'),
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
    h('h3', null, 'Mount your first component'),
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
      href:
        'https://github.com/Marcisbee/radi/blob/master/docs/server-rendering.md',
    }, 'Read the server rendering guide ↗'),
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
      href:
        'https://github.com/Marcisbee/radi/blob/master/docs/static-sites.md',
    }, 'Read the static site guide ↗'),
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
    h('a', {
      href: 'https://github.com/Marcisbee/radi/blob/master/docs/resumption.md',
    }, 'Wire the bootstrap and lazy handler ↗'),
  ),
];

function reference() {
  const groups = [
    ['Rendering', 'createRoot · root.render · root.unmount'],
    ['Reactivity', 'update · memo'],
    ['Keyed lists', 'createList · createKey'],
    ['Lifecycle', 'createAbortSignal · createAbortSignalOnUpdate'],
    ['Async UI', 'Suspense · suspend · unsuspend'],
  ];
  return section(
    'reference',
    'Client API',
    h('p', null, 'The core client APIs, grouped by what you want to do.'),
    h(
      'dl',
      null,
      groups.map(([name, apis]) =>
        h('div', null, h('dt', null, name), h('dd', null, apis))
      ),
    ),
    h(
      'a',
      { href: 'https://github.com/Marcisbee/radi#api-reference' },
      'Full API and examples ↗',
    ),
  );
}

export function page() {
  return [
    h('a', { class: 'skip', href: '#content' }, 'Skip to content'),
    header(),
    h(
      'details',
      { class: 'mobile-contents' },
      h('summary', null, 'On this page'),
      navigation('Mobile documentation'),
    ),
    h(
      'div',
      { class: 'layout' },
      h(
        'aside',
        { class: 'sidebar' },
        navigation('Documentation'),
        h(
          'div',
          { class: 'sidebar-note' },
          h('span', { class: 'note-dot', 'aria-hidden': 'true' }),
          'Built with Radi SSG',
        ),
      ),
      h(
        'main',
        { id: 'content' },
        introduction(),
        ...basicSections,
        ...publishingSections,
        reference(),
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
