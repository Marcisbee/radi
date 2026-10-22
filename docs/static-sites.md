# Static sites

`radi/static` generates complete HTML documents with the existing server
renderer. Routes map to directory indexes: `/` becomes `index.html` and
`/guide/` becomes `guide/index.html`. Deploy these files to any static host that
serves directory indexes. No Radi server is needed in production.

```ts
import { generateStaticSite } from 'radi/static';
import { createElement as h } from 'radi/server';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

await generateStaticSite([
  {
    path: '/',
    title: 'Documentation',
    render: () => h('h1', null, 'Welcome'),
  },
  {
    path: '/guide/',
    title: 'Guide',
    render: async () => h('p', null, 'Content loaded at build time'),
  },
], async (path, html) => {
  const file = join('dist', path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
});
```

Use the server JSX runtime (`jsxImportSource: "radi/server"`) for JSX pages.
`render` returns body content; `head` accepts additional server nodes such as
stylesheets and metadata, and `lang` defaults to `en`. Titles, attributes, and
content use the server renderer's escaping. Async content is fully resolved
before each document is written. Reactive functions are sampled at build time.

The writer receives a validated relative path and HTML string, and is awaited
before rendering the next page. All routes are validated before any rendering or
writes. Duplicate routes (including `/guide` and `/guide/`), dot segments,
encoded paths, queries, and fragments are rejected. Routes are literal decoded
paths; link to the trailing-slash URL. Unicode slugs are supported. Returned
paths list the generated documents. The writer owns filesystem permissions, safe
output-directory selection, cleanup, and deployment. Build into a fresh
directory for deployment: failures stop generation but do not roll back prior
writes, and removed routes are not deleted from an existing directory. Server
component failures retain the renderer's `ERROR:ComponentName` fallback.

## Interactive islands

Use `resumable` and `resumeClick` from `radi/server` inside page content, and
set that page's `bootstrap` to the public URL of a bundled classic script that
calls `resume(document, registry)` from `radi/resume`. The generator places this
blocking script in the head, before interactive HTML. Serve the bootstrap and
lazy handler bundles alongside the HTML. Pages without `bootstrap` have no
generated script. Asset paths are public URLs; use the correct prefix when
deploying under a subdirectory. Bundling and copying other assets remain the
build script's responsibility.

Each resumable boundary owns its JSON state. A click loads its registered
handler and updates existing DOM; static content and other islands remain
untouched. See [resumption](resumption.md) for the handler API, supported click
behavior, state restrictions, and failure handling.

Native function children identify dynamic locations, but cannot supply their
client module identity or captured state. Their `<!--$-->` markers alone cannot
reconstruct closures in a browser. This API therefore uses explicit resumable
islands; it does not automatically turn arbitrary functions or `onclick`
closures into client code. Such automation would need a compiler or explicit
module/state metadata. Do not use an ordinary client root to hydrate these
pages: it replaces its initial contents.

## Complete example

```sh
deno run -A examples/static-site.ts
# Deploy dist/static-site, or preview the exact generated files:
deno run -A examples/static-site.ts --serve
```

Open `http://127.0.0.1:4319/`. The home page has no JavaScript. The guide has
two independent counters that reuse the resumption example's lazy handler. The
preview serves files only; it does no request-time rendering.

Run `deno task test:static` to verify generation and both islands in Chromium.
Install Chromium first with `npx playwright@1.56.1 install chromium`.
