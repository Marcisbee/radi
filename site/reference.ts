import { createElement as h } from '../src/server.ts';
import { code, section } from './ui.ts';

type Entry = [string, string, string, string?];
function reference(id: string, title: string, entry: string, entries: Entry[]) {
  return section(
    id,
    title,
    h('p', null, `Import from ${entry}.`),
    ...entries.map(([name, signature, description, label]) =>
      h(
        'article',
        { class: 'api-entry', id: `${id}-${name}` },
        h(
          'h3',
          null,
          h('a', { href: `#${id}-${name}`, class: 'heading-link' }, name),
        ),
        code(label ?? 'Signature', signature),
        h('p', null, description),
      )
    ),
  );
}

export const references = [
  reference('reference', 'Client API', 'radi or radi/client', [
    [
      'createRoot',
      'const root = createRoot(target: HTMLElement);\nroot.render(element);\nroot.root; // current node, or null\nroot.unmount();',
      'Creates a DOM render root. The first render clears existing children; this is not hydration. Rendering the same component type and key reuses its host and updates props. Unmount disconnects the rendered tree and runs cleanup.',
    ],
    [
      'createElement',
      "import { createElement as h, createRoot, Fragment } from 'radi';\n\nconst target = document.body.appendChild(document.createElement('div'));\nconst view = h('main', { className: 'greeting' },\n  h(Fragment, null,\n    h('h1', null, 'Hello, Radi'),\n    h('p', null, 'These siblings share no extra wrapper.'),\n  ),\n);\n\ncreateRoot(target).render(view);",
      'Creates DOM elements or component hosts. Components receive a props getter and run once on mount. Function children and attributes are reactive; Fragment groups children without an element wrapper. Use JSX for normal authoring.',
      'Example',
    ],
    [
      'update',
      'update(target: Node): boolean',
      'Synchronously reevaluates reactive expressions on the target and its descendants. Returns the dispatch result. Update the ancestor containing the expressions that read your changed state.',
    ],
    [
      'memo',
      'memo(render: (anchor: Node) => unknown, shouldMemo: () => boolean)',
      'Returns a reactive function. The first evaluation computes its value; later updates retain it when shouldMemo returns true. Return false when dependencies change.',
    ],
    [
      'createList',
      'createList(key => items.map(item =>\n  key(() => <Row item={item} />, item.id)\n))',
      'Returns a keyed-list descriptor for use inside a reactive child function. Use stable, unique keys. Updates reuse keyed content and reconcile its order; removed items are disconnected.',
    ],
    [
      'createKey',
      'createKey(render: () => unknown, keyValue: unknown)',
      'Returns a single keyed descriptor. Inside a reactive child, the same key preserves the rendered instance; a changed key remounts it.',
    ],
    [
      'createAbortSignal',
      'createAbortSignal(target: Node): AbortSignal',
      'Aborts on the target’s disconnect event. Use it to tie event listeners or async work to the component lifetime.',
    ],
    [
      'createAbortSignalOnUpdate',
      'createAbortSignalOnUpdate(target: Node): AbortSignal',
      'Aborts on the next update or disconnect. Create a new signal for each new unit of work.',
    ],
    [
      'Suspense',
      '<Suspense fallback={() => <p>Loading…</p>}>\n  <AsyncComponent />\n</Suspense>',
      'Displays its fallback while descendants are suspended. Overlapping suspensions are counted. Async components participate automatically; manual work must balance suspend and unsuspend.',
    ],
    [
      'suspend',
      'suspend(target: Node): boolean\nunsuspend(target: Node): boolean',
      'Dispatch bubbling, cancelable suspend/unsuspend events. Return the dispatch result. Call unsuspend when each manual operation finishes, including failure paths.',
    ],
    [
      'ComponentNode',
      'function Component(this: ComponentNode, props: () => Props) {\n  // this is the component host\n}',
      'Type for the DOM component host. Lifecycle events are connect, disconnect, and update. Props are read by calling their getter, including inside reactive expressions.',
    ],
  ]),
  reference('server-api', 'Server API', 'radi/server', [
    [
      'createElement',
      'createElement(type, props, ...children): ServerNode\ncreateTextNode(text: string): ServerChild\ncreateComment(text: string): ServerNode\nFragment(children: ServerChild[]): ServerNode',
      'Creates lazy server nodes, text, comments, and fragments. These are separate from client DOM and legacy adapter nodes. Components and function children execute during rendering. Text and attributes are escaped; no raw-HTML API is exposed.',
    ],
    [
      'renderToString',
      'renderToString(child: ServerChild): string\nrenderToStringRoot(child: ServerChild): string\nssr(entry: () => ServerChild): string',
      'Synchronous rendering; promises are rejected. renderToStringRoot is an alias. ssr calls the supplied entry and renders its result. Component errors produce an ERROR:ComponentName fallback; invalid children and reactive errors fail the render.',
    ],
    [
      'renderToStringAsync',
      'renderToStringAsync(child: ServerChild): Promise<string>',
      'Collects fully resolved async output. Components, promises, and siblings are evaluated in document order.',
    ],
    [
      'renderToReadableStream',
      'renderToReadableStream(child: ServerChild): ReadableStream<Uint8Array>',
      'Streams ordered UTF-8 HTML with backpressure. Available HTML flushes before awaiting a promise; later siblings wait. Cancellation stops future traversal, but cannot cancel application promises already running. No out-of-order replacement scripts are emitted.',
    ],
    [
      'ServerChild',
      'type ServerComponent<P> = (props: () => P) => ServerChild;\n// ServerNode: lazy server element representation\n// ServerChild: nodes, primitives, arrays, functions,\n// promises, and subscribable values',
      'ServerChild, ServerComponent, and ServerNode are exported types. Subscribables supply their first synchronous value and are immediately unsubscribed. DOM lifecycle events do not run. Event, key, ref, and function attributes are omitted. Use explicit CSS units.',
    ],
    [
      'resumable',
      "resumable(state: ResumeState, children: ServerChild, tag = 'div'): ServerNode\nresumeClick(handler: string): { 'data-radi-click': string }",
      'Creates an explicit island boundary and binds a click to a client registry key. See Resumption API for state, event, and delivery constraints. Legacy createRenderer, createDomAdapter, createServerStringAdapter, and SERVER_RENDERER are also re-exported; use them with adapter nodes only.',
    ],
  ]),
  reference(
    'resume-api',
    'Resumption API',
    'radi/resume (client) and radi/server (boundaries)',
    [
      [
        'resume',
        'const dispose = resume(root: Document | Element, loaders: ResumeLoaders, options?: ResumeOptions);\ndispose();',
        'Install once per root before interactive HTML is parsed. Avoid overlapping roots. Returns an idempotent disposer that removes capture, aborts pending delivery, and releases cached loaders. It does not mount or rerender the page.',
      ],
      [
        'ResumeLoaders',
        "const loaders = {\n  increment: () => import('./handler').then(m => m.increment),\n};\n// Or bundle the handler up front:\n// increment: () => Promise.resolve(increment)",
        'A record of trusted handler keys to asynchronous loader functions. Loaded handlers are cached; a failed load can retry on a later click. Lazy imports are optional and can delay the first interaction.',
      ],
      [
        'ResumeHandler',
        'type ResumeHandler = (context: ResumeContext) => void | Promise<void>;\n// context: boundary, element, event, state, signal',
        'boundary is the island element; element carries the click binding; event is the original MouseEvent (currentTarget is no longer valid). Read or replace state and mutate existing DOM. Honor signal for asynchronous work. Handlers run serially within a boundary. Removed targets are skipped.',
      ],
      [
        'ResumeOptions',
        'resume(document, loaders, {\n  maxPending: 64,\n  timeout: 30000,\n  onError: error => console.error(error),\n});',
        'Defaults are 64 queued/running clicks per root and a 30,000 ms wait for handler loading and streamed HTML readiness. Overflow is dropped and reported. The timeout does not forcibly stop application handler code.',
      ],
      [
        'ResumeState',
        'type ResumeState = null | boolean | number | string\n  | ResumeState[] | { [key: string]: ResumeState };',
        'Exported by radi/server and radi/resume. State is public HTML: never include secrets. Only finite numbers and JSON values in arrays/plain objects are accepted. Cycles, functions, undefined, BigInt, and class instances are rejected.',
      ],
      [
        'resumeClick',
        "resumeClick('increment')\nresumable({ count: 0 }, children, 'section')",
        'Handler keys must be nonempty and at most 256 characters. Supported boundary tags: div, section, article, main, aside, nav, span, li, td. Registered clicks suppress native defaults and propagation, then deliver once to the handler. Use type="button". Navigation, forms, input/change, gestures, and privileged user-activation actions are not replayed.',
      ],
    ],
  ),
  reference('static-api', 'Static generation API', 'radi/static', [
    [
      'generateStaticSite',
      'generateStaticSite(pages: readonly StaticPage[], write: StaticWriter): Promise<string[]>',
      'Validates all routes first, then renders and awaits each write sequentially. Returns generated relative paths. / maps to index.html; /guide/ maps to guide/index.html. Duplicate routes, dot segments, encoded paths, queries, and fragments are rejected. Unicode slugs are supported.',
    ],
    [
      'StaticPage',
      "const page: StaticPage = {\n  path: '/guide/',\n  title: 'Guide',\n  render: () => h('h1', null, 'Guide'),\n  lang: 'en',\n  head: h('link', { rel: 'stylesheet', href: '/style.css' }),\n  bootstrap: '/client.js',\n};",
      'path, title, and render are required. render returns ServerChild, including promises. lang defaults to en; head and bootstrap are optional. bootstrap is a public URL for a bundled classic script, placed in the head before interactive content. Without it, no script is generated.',
    ],
    [
      'StaticWriter',
      'type StaticWriter = (path: string, html: string) => void | Promise<void>;',
      'Owns filesystem writes, asset bundling/copying, cleanup, and deployment. Build into a fresh output directory: failures do not roll back earlier writes, and removed routes are not deleted. Deploy directory indexes; use the correct asset URL prefix for subdirectories.',
    ],
  ]),
  reference(
    'state-api',
    'Signals and channels',
    'radi/signal and radi/channel respectively',
    [
      [
        'createSignal',
        'const count = createSignal(0);\ncount(); // read\ncount(1); // write\nconst label = count(value => `Count: ${value}`);',
        'Creates a callable signal. Writes notify connected subscriber nodes through update. A mapper call creates a reactive child function; it is not a functional setter. Subscribers attach through Radi connect/disconnect events. The current overload types do not fully express the mapper’s returned function.',
      ],
      [
        'createChannel',
        "const theme = createChannel('light');\nconst provider = theme.provide(element, 'dark');\nconst value = theme.use(descendant);\nvalue();\nprovider.set(previous => previous === 'dark' ? 'light' : 'dark');",
        'Creates a DOM-scoped channel with a default value and unique key. provide attaches a value to an element; use resolves the nearest live provider after connection. Before resolution it reads the default, and writes are ignored.',
      ],
      [
        'ChannelAccessor',
        'value();\nvalue.set(nextValueOrUpdater);\nvalue.update();\nvalue.provider;\nvalue.resolved;',
        'Accessors read the current value. set changes it and updates the provider subtree; update forces a refresh after in-place mutation. provider is an Element or null, and resolved indicates provider discovery. Channel accessor types are inferred, not separately exported.',
      ],
    ],
  ),
  reference('renderer-api', 'Custom renderer API', 'radi/renderer', [
    [
      'createRenderer',
      'const renderer = createRenderer(adapter: RendererAdapter);\nrenderer.createElement(type, props, ...children);\nrenderer.createTextNode(text);\nrenderer.createComment(text);\nrenderer.fragment(children);\nrenderer.render(root, child);\nrenderer.renderToString?.(child);',
      'Legacy universal renderer for custom targets. render appends children to a UniversalNode root. renderToString exists only if the adapter supplies serialize. This is a one-shot abstraction, not full client reactivity or the lazy server streaming API.',
    ],
    [
      'adapters',
      'createDomAdapter(document?)\ncreateServerStringAdapter()\nDOM_RENDERER\nSERVER_RENDERER',
      'Adapter factories target DOM or virtual string nodes. DOM_RENDERER and SERVER_RENDERER are prebuilt renderer instances. Keep creation and rendering within the same API; client DOM nodes, lazy server nodes, and UniversalNode wrappers are not interchangeable.',
    ],
    [
      'RendererAdapter',
      'interface RendererAdapter {\n  createElement(tag); createTextNode(text); createComment(text);\n  setProperty(node, name, value);\n  insertNode(parent, node, anchor?); removeNode(parent, node);\n  getParentNode(node); getFirstChild(node); getNextSibling(node);\n  isTextNode(node); isCommentNode?(node); serialize?(root);\n}',
      'Implement node creation, mutation, navigation, and text detection. isCommentNode and serialize are optional. Exported types include RendererAdapter, Renderer, UniversalNode, and ComponentType. UniversalNode wraps a platform node with optional children, text, comment, tag, props, and key metadata.',
    ],
  ]),
  reference(
    'jsx-api',
    'JSX and shared types',
    'radi/jsx-runtime, radi/jsx-dev-runtime, radi/server/jsx-runtime, radi/server/jsx-dev-runtime, radi/types, radi/symbols',
    [
      [
        'JSX',
        "import { createRoot } from 'radi';\nimport { jsx, jsxs, Fragment } from 'radi/jsx-runtime';\nimport { jsxDEV } from 'radi/jsx-dev-runtime';\n\nconst target = document.body.appendChild(document.createElement('div'));\nconst view = jsxs('main', {\n  children: [\n    jsx('h1', { children: 'Hello, Radi' }),\n    jsxs(Fragment, {\n      children: [\n        jsx('p', { children: 'First sibling' }),\n        jsx('p', { children: 'Second sibling' }),\n      ],\n    }),\n    jsxDEV('p', { children: 'Development output' },\n      undefined, false, { fileName: 'main.ts', lineNumber: 16 }),\n  ],\n});\n\ncreateRoot(target).render(view);",
        'Compiler-facing JSX factories. Set jsxImportSource to radi for DOM or radi/server for server nodes. Development entries re-export the runtime; jsxDEV accepts source metadata. The example shows calls normally generated by the JSX compiler: children live in props; jsx takes one child and jsxs takes multiple. The optional third argument is the key. jsxDEV also takes the static-children flag and optional source/self metadata. Server JSX exposes its own JSX namespace, including Element, ElementType, LibraryManagedAttributes, ElementChildrenAttribute, and IntrinsicElements.',
        'Example',
      ],
      [
        'shared-types',
        'isSubscribable(value): value is Subscribable<unknown>\nisReactiveGenerator(value): value is ReactiveGenerator\ntoChildArray(child): Child[]',
        'radi/types exports Child, ReactiveGenerator, and Subscribable<T>. Subscribable.subscribe(listener) may return void, a cleanup function, or an unsubscribe object. The guards test for a subscribe method or a function respectively. toChildArray wraps a single child; it does not flatten nested arrays.',
      ],
      [
        'symbols',
        'COMPONENT, REACTIVE_CHILDREN, TAIL, RENDER_ID, RENDER, MEMO,\nREACTIVE_ATTRIBUTES, TYPE, PROPS, INSTANCE, UPDATE_ID, CLEANUP,\nSINGLE_KEYED, KEY, NODE, KEY_MAP, ATTRS, KEYED',
        'radi/symbols exposes runtime bookkeeping symbols for low-level integrations. Ordinary application code should use the public rendering and state APIs rather than mutate these fields.',
      ],
    ],
  ),
];
