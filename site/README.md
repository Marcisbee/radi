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
enhancements. Use the browser’s Find command (Ctrl/Cmd F) to search the full guide.

Agent readers can discover `/index.md` and `/llms.txt` from HTML link relations
or footer links. Markdown is generated from the guide at build time, preserving
code examples without navigation or interactive controls. The index also links
to copies of the repository's detailed server, resumption, and static-site docs
under `/docs/`. These are static files and require no JavaScript or
authentication. The docs test checks discovery, complete code examples, and
index destinations.

Run `deno task test:docs` to check the first counter interaction with the
network disabled after the page loads. Install Chromium with Playwright first,
as for the repository's static-site tests.

The Radi swirl logo is the original favicon from the repository’s `gh-pages`
branch (`c6a8e7e90d1a53d6bcc0bb22ba5b6345.png`). The page uses its purple
palette. Typography follows Railpack’s installation page: Inter for body and
navigation, IBM Plex Serif for the page title, and JetBrains Mono for code. The
Latin font files are self-hosted with their licenses alongside them.

Deployment is manual. No workflow in this change replaces the existing public
site.
