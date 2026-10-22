import { createElement as h, resumable, resumeClick } from "../src/server.ts";

const sections = [
  ["start", "Getting started"],
  ["components", "Components"],
  ["reactivity", "Reactivity"],
  ["lifecycle", "Lifecycle"],
  ["server", "Server rendering"],
  ["static", "Static sites"],
  ["islands", "Interactive islands"],
  ["reference", "API reference"],
] as const;

function code(label: string, source: string) {
  return h(
    "figure",
    { class: "code" },
    h("figcaption", null, label),
    h("pre", null, h("code", null, source)),
  );
}

function section(
  id: string,
  title: string,
  ...content: Parameters<typeof h>[2][]
) {
  return h("section", { id }, h("h2", null, title), ...content);
}

function introduction() {
  return h(
    "header",
    { class: "hero" },
    h("span", { class: "eyebrow" }, "SMALL RUNTIME. DIRECT CONNECTION."),
    h("h1", null, "A little Radi.", h("br", null), "A lot of possibility."),
    h(
      "p",
      { class: "lead" },
      "Reactive interfaces, written as plain functions. JSX, local state, and the DOM — with less in between.",
    ),
    h(
      "div",
      { class: "hero-links" },
      h("a", { class: "primary", href: "#start" }, "Start building ", "↗"),
      h(
        "a",
        { href: "https://github.com/Marcisbee/radi" },
        "Explore the source ↗",
      ),
    ),
    h(
      "div",
      { class: "facts" },
      "No virtual DOM",
      h("span", null, "·"),
      "TypeScript + JSX",
      h("span", null, "·"),
      "MIT licensed",
    ),
  );
}

function basics() {
  return [
    section(
      "start",
      "Getting started",
      h(
        "p",
        null,
        "Install Radi, then configure your bundler to use its automatic JSX runtime.",
      ),
      code("Terminal", "npm install radi"),
      code(
        "tsconfig.json",
        '{\n  "compilerOptions": {\n    "jsx": "react-jsx",\n    "jsxImportSource": "radi"\n  }\n}',
      ),
      h(
        "p",
        null,
        'Add an element with id="app" to your HTML and load your bundled entry script.',
      ),
      code(
        "main.tsx",
        "import { createRoot } from 'radi';\n\nfunction App() {\n  return <h1>Hello, Radi.</h1>;\n}\n\nconst root = createRoot(document.getElementById('app')!);\nroot.render(<App />);",
      ),
    ),
    section(
      "components",
      "Functions, with a home.",
      h(
        "p",
        null,
        "A component runs once when it mounts. Keep state in its closure. Props arrive as a getter; call it inside a reactive expression to read the latest value.",
      ),
      code(
        "greeting.tsx",
        "function Greeting(props: () => { name: string }) {\n  return <h1>Hello, {() => props().name}!</h1>;\n}",
      ),
    ),
    section(
      "reactivity",
      "Make the changing parts explicit.",
      h(
        "p",
        null,
        "Wrap dynamic children or attributes in functions. Call update on their ancestor to evaluate those functions again. Static content stays put.",
      ),
      code(
        "counter.tsx",
        "import { update } from 'radi';\n\nfunction Counter() {\n  let count = 0;\n  const view = (\n    <button onclick={() => { count++; update(view); }}>\n      Count: {() => count}\n    </button>\n  );\n  return view;\n}",
      ),
    ),
    section(
      "lifecycle",
      "Clean up as you go.",
      h(
        "p",
        null,
        "Elements receive connect and disconnect events. Tie subscriptions to the component lifecycle with an abort signal.",
      ),
      code(
        "Lifecycle",
        "import { createAbortSignal } from 'radi';\n\nfunction Panel(this: HTMLElement) {\n  const signal = createAbortSignal(this);\n  window.addEventListener('resize', () => {\n    // Respond to the new viewport.\n  }, { signal });\n  return <div>Ready when you are.</div>;\n}",
      ),
    ),
  ];
}

function publishing() {
  return [
    section(
      "server",
      "Start with HTML.",
      h(
        "p",
        null,
        "Use the separate server entry to render HTML without a browser. Choose synchronous rendering, resolved async HTML, or ordered streaming. For JSX on the server, set jsxImportSource to radi/server.",
      ),
      code(
        "server.ts",
        "import { createElement as h, renderToString } from 'radi/server';\n\nconst html = renderToString(h('h1', null, 'Hello from the server.'));",
      ),
      h("a", {
        href:
          "https://github.com/Marcisbee/radi/blob/master/docs/server-rendering.md",
      }, "Read the server rendering guide ↗"),
    ),
    section(
      "static",
      "Build once. Serve anywhere.",
      h(
        "p",
        null,
        "This guide is built with Radi’s static site generator. Routes become complete HTML files. Your build owns the filesystem writer, asset bundling, and deployment; no Radi server runs in production.",
      ),
      code(
        "build.ts",
        "import { generateStaticSite } from 'radi/static';\nimport { createElement as h } from 'radi/server';\nimport { mkdir, writeFile } from 'node:fs/promises';\nimport { dirname, join } from 'node:path';\n\nawait generateStaticSite([{\n  path: '/',\n  title: 'My site',\n  render: () => h('h1', null, 'Made with Radi.'),\n}], async (path, html) => {\n  const file = join('dist', path);\n  await mkdir(dirname(file), { recursive: true });\n  await writeFile(file, html);\n});",
      ),
      h("a", {
        href:
          "https://github.com/Marcisbee/radi/blob/master/docs/static-sites.md",
      }, "Read the static site guide ↗"),
    ),
    section(
      "islands",
      "A little interaction, on demand.",
      h(
        "p",
        null,
        "Keep the page static and add explicit resumable boundaries where you need them. A small bootstrap captures clicks; the named handler loads on the first interaction and updates the existing DOM.",
      ),
      resumable(
        { count: 0 },
        h(
          "div",
          { class: "demo" },
          h(
            "div",
            null,
            h("span", { class: "eyebrow" }, "TRY A LIVE ISLAND"),
            h("p", null, "One click. One small update."),
          ),
          h(
            "div",
            { class: "counter" },
            h("output", { "aria-live": "polite", "aria-label": "Count" }, "0"),
            h(
              "button",
              { type: "button", ...resumeClick("increment") },
              "Add one +",
            ),
          ),
          h(
            "p",
            { class: "demo-note", role: "status" },
            "The handler loads when you click.",
          ),
        ),
      ),
      code(
        "Server boundary",
        "import { createElement as h, resumable, resumeClick } from 'radi/server';\n\nconst counter = resumable({ count: 0 }, [\n  h('button', { type: 'button', ...resumeClick('increment') }, 'Add one'),\n  h('output', null, '0'),\n]);",
      ),
      h(
        "p",
        null,
        "This is explicit resumption: arbitrary closures are not serialized. Use native links and forms for navigation. The current island API supports registered clicks.",
      ),
      h("a", {
        href:
          "https://github.com/Marcisbee/radi/blob/master/docs/resumption.md",
      }, "Wire the bootstrap and lazy handler ↗"),
    ),
  ];
}

function reference() {
  const groups = [
    ["Rendering", "createRoot · root.render · root.unmount"],
    ["Reactivity", "update · memo"],
    ["Keyed lists", "createList · createKey"],
    ["Lifecycle", "createAbortSignal · createAbortSignalOnUpdate"],
    ["Async UI", "Suspense · suspend · unsuspend"],
  ];
  return section(
    "reference",
    "Keep these close.",
    h("p", null, "The core client APIs, grouped by what you want to do."),
    h(
      "dl",
      null,
      groups.map(([name, apis]) =>
        h("div", null, h("dt", null, name), h("dd", null, apis))
      ),
    ),
    h(
      "a",
      { href: "https://github.com/Marcisbee/radi#api-reference" },
      "Full API and examples ↗",
    ),
  );
}

export function page() {
  return [
    h("a", { class: "skip", href: "#content" }, "Skip to content"),
    h(
      "aside",
      null,
      h(
        "a",
        { class: "brand", href: "#", "aria-label": "Radi home" },
        h("span", { class: "brand-mark", "aria-hidden": "true" }, "✳"),
        "radi",
        h("span", { class: "brand-note" }, " / docs"),
      ),
      h(
        "nav",
        { "aria-label": "Documentation" },
        h("p", { class: "nav-label" }, "THE GUIDE"),
        sections.map(([id, title], index) =>
          h(
            "a",
            { href: `#${id}` },
            h("span", null, String(index + 1).padStart(2, "0")),
            title,
          )
        ),
      ),
      h("a", {
        class: "source-link",
        href: "https://github.com/Marcisbee/radi",
      }, "GitHub ↗"),
    ),
    h(
      "main",
      { id: "content" },
      introduction(),
      ...basics(),
      ...publishing(),
      reference(),
      h(
        "footer",
        null,
        h("span", null, "Made with Radi. Including this page."),
        h("a", { href: "#" }, "Back to top ↑"),
      ),
    ),
  ];
}
