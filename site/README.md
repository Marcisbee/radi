# Documentation site

Build with `deno task docs:build`. The deployable artifact is `dist/docs`,
including the `radi.js.org` CNAME. Publish that directory at the domain root on
a static host. Do not publish the repository source directory.

Run `deno task docs:preview` to build and serve the same files at
http://127.0.0.1:4320. Restart after edits. The preview binds only to loopback.

`page.ts` owns content, `ui.ts` owns shared markup, and `style.css` owns layout.
Radi's `generateStaticSite` renders the guide at build time. Shiki highlights
examples at build time and sends no highlighting JavaScript to the browser. The
counter uses `radi/resume` with its tiny handler bundled into the initial
script. Clicks need no extra network request. Navigation and documentation work
without JavaScript; code copying and the current-section indicator are
enhancements. Search (Ctrl/Cmd K) searches the guide locally, including code
examples. Search uses a native dialog for keyboard focus containment and Escape
dismissal.

Run `deno task test:docs` to check the first counter interaction with the
network disabled after the page loads. Install Chromium with Playwright first,
as for the repository's static-site tests.

The Radi swirl logo is the original favicon from the repository’s `gh-pages`
branch (`c6a8e7e90d1a53d6bcc0bb22ba5b6345.png`). The page uses its purple
palette and system fonts.

Deployment is intentionally manual until the design is approved. No workflow in
this change replaces the existing public site.
