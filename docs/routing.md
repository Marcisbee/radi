# Client routing and route data

`radi/router` is an optional browser module. It changes the URL and loads route
code/data without replacing the document. Keep shared layouts outside your route
outlet; Radi's existing `createRoot` renders the outlet. The core client entry
point does not import the router.

This is a small explicit router, not Remix API compatibility. Routes are flat
absolute patterns: `/`, `/pages/:id`, and `/files/*`. Static segments take
precedence over parameters, then wildcards. Parameters are decoded once; query
parameters are available through `context.url.searchParams`. A trailing slash is
optional. There is no filesystem convention, nested loader hierarchy, automatic
form interception, or automatic SSR hydration.

## Define routes

```ts
import { createRouter, fetchRouteData } from 'radi/router';

const router = createRouter({
  routes: [
    { path: '/', loader: () => ({ title: 'Home' }) },
    {
      path: '/pages/:id',
      loader: ({ params, signal }) =>
        fetchRouteData(`/api/pages/${encodeURIComponent(params.id)}`, {
          signal,
        }),
      action: ({ params, formData, method, signal }) =>
        fetchRouteData(`/api/pages/${encodeURIComponent(params.id)}`, {
          method,
          body: formData,
          signal,
        }),
    },
    { path: '/settings', lazy: () => import('./settings.js') },
  ],
});

router.subscribe((state) => {
  // status: idle | loading | submitting. Existing data stays visible while busy.
  // On idle, render state.data or state.error in your outlet.
});
router.attach(document);
await router.ready;
```

Lazy modules export `loader`, `action`, and optionally `view`. `view(state)` is
an application rendering convention returning a DOM node or array; the router
never calls it. Render it with `root.render(state.module.view(state))` when
idle. Bundlers can split dynamic imports. Successful module loads are shared for
the router's lifetime; failures can be retried. Put server-only code in Go,
never in these browser modules.

`subscribe` invokes its callback immediately and returns an unsubscribe
function. It exposes `url`, `match` (route and params), `module`, `data`,
`actionData`, `error`, and `status`. Loader/action errors become idle error
state at the target URL. Unmatched programmatic navigation produces
`RouteError(404, ...)`; a missing action produces 405. Render your own
error/retry UI. Errors from your rendering callbacks are application errors; do
not throw from subscribers.

## Navigation and mutations

- `navigate(url, { replace?: boolean })` awaits navigation. URLs must share the
  current origin. Back/forward loads the route for the browser's current URL.
- `attach(target)` intercepts ordinary clicks on matching internal links. It
  preserves modified clicks, downloads, external links, explicit targets, and
  `data-radi-reload` links. It returns a detach function. Other links stay
  native.
- `submit(url, formData, method = 'POST')` runs a route action and reloads that
  destination's loader. Methods are POST, PUT, PATCH, and DELETE. Intercept
  forms explicitly, or use `navigate` with search parameters for GET forms.
- `revalidate()` invalidates cached data and reloads the current browser URL.
- `dispose()` aborts active navigation/prefetch, removes installed listeners,
  and clears cached data. Use one router per window and dispose before replacing
  it.

New navigation aborts obsolete work and prevents its result from committing even
if a loader ignores its signal. Pass the signal to fetch. Aborting an action
does **not** undo a mutation already accepted by the server; reconcile with a
fresh read. Actions invalidate cached data, including prefetches started before
them.

Use `throw new RouteError(status, data)` for application failures.
`redirect(path)` throws a redirect from a loader/action. Redirect chains are
capped at ten hops; external destinations must be handled explicitly with
ordinary browser navigation. `fetchRouteData` accepts JSON or 204 responses and
preserves non-success status and response data in `RouteError`. A successful
response with `X-Radi-Location` redirects to that URL. This avoids fetch
silently following an HTTP redirect to an HTML page. Ordinary HTTP redirect
responses are not a route navigation API.

New push/replace navigation scrolls to the top or the URL's fragment. Hash-only
navigation avoids the loader. Back/forward leaves scrolling to the browser;
custom scroll restoration and focus management belong to the application.

## Prefetch and caching

`prefetch(url)` loads a route module and its data without navigating. It rejects
on failure, so speculative callers should catch errors. It does not follow
redirects. Data caching is disabled by default; module loading still benefits
from JavaScript's module cache.

Set `staleTime` in milliseconds to enable data caching and `cacheSize` to bound
entries (default 20). Keys are pathname plus search, excluding fragment. Entries
expire from their load time; reading does not extend freshness. Eviction removes
the oldest saved entry. `invalidate()` clears data without navigating. Dispose
or invalidate on logout/account changes. HTTP cache headers remain the server's
responsibility. Do not prefetch mutations or cache personalized data across
users.

## Go and embedded V8 example

`examples/router` uses the [Go and embedded V8 adapter](go-server.md).
The router itself and `deno task test:router` also work independently of it.

With the adapter and its documented Clang/CGO toolchain available:

```sh
export CC=clang-21 CXX=clang++-21 CGO_CXXFLAGS=-nostdinc++
go generate ./examples/router
go build -o radi-router ./examples/router
RADI_ADDR=127.0.0.1:4321 ./radi-router
# In another terminal:
deno task test:router:go
```

The build bundles both server TSX and split browser modules using Go esbuild.
Serving uses only the Go binary with embedded V8; no Node/Deno serving process
is needed. Browser checks use Deno and Playwright as development tools.

The first request streams HTML through V8 and calls an allowlisted Go `page`
operation. Initial data is safely escaped into a `data-initial` attribute on the
outlet. The browser parses that attribute and passes `initialData` to the
router, skipping the initial loader. It renders a fresh interactive outlet; it
does not hydrate or resume the server DOM. The header and shared note stay
mounted.

Subsequent loads use Go's `/api/pages/{id}` JSON handler. POST actions update
the server's demonstration in-memory data, then the router revalidates.
Refreshing a deep route renders the same data through V8. Use the same
authorized service function for SSR operations and JSON handlers in a real
application, including Flop reads/writes; never expose the adapter's operation
registry directly as a public API. Apply authentication, authorization,
validation, and CSRF protection in Go for every endpoint. The demo has no
accounts or persistent storage and is explicitly non-production.

The browser integration check makes three warm Home/About round trips and
asserts zero additional document requests and zero additional data reads after
prefetch. It also verifies initial SSR data reuse, preserved shared input,
back/forward, action revalidation, and persistence of the mutation after
refresh. This verifies request elimination, not a universal latency improvement.
