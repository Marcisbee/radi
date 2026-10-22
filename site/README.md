# Documentation site

Build with `deno task docs:build`. The deployable artifact is `dist/docs`,
including the `radi.js.org` CNAME. Publish that directory at the domain root on
a static host. Do not publish the repository source directory.

Run `deno task docs:preview` to build and serve the same files at
http://127.0.0.1:4320. Restart after edits. The preview binds only to loopback.

`page.ts` owns content and `style.css` owns layout. Radi's `generateStaticSite`
renders the guide at build time. The counter uses `radi/resume`; its handler
loads on demand. Navigation and documentation work without JavaScript.

Deployment is intentionally manual until the design is approved. No workflow in
this change replaces the existing public site.
