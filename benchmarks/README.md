# Browser framework comparison

This suite compares the checked-out Radi source with pinned React, Preact, Vue,
and vanilla JavaScript implementations in real Chromium. It complements the
older `deno task bench` microbenchmarks; those are not used for this comparison.
Benchmark dependencies are isolated here and do not ship with Radi.

## Run

Requires Node 22 or later and a machine that can run Playwright Chromium.

```sh
cd benchmarks
npm ci
npx playwright install chromium
npm run smoke
npm run bench
# More repetitions:
npm run bench -- --samples=30 --warmup=5
```

On Linux, install the browser's system dependencies if Playwright requests them
(`npx playwright install-deps chromium`). The runner builds production bundles,
serves them on an ephemeral loopback port, launches headless Chromium, and closes
the server and browser on completion or failure. No hosted service is needed.
An incorrect DOM result or browser error fails the command; no new report is
written for a failed run. Existing results must be checked by their timestamp.

Outputs are `results/results.json` (all samples and metadata) and
`results/report.md` (a comparison table). They are ignored by Git because they
are machine-specific. Save both elsewhere before another run overwrites them.
The smoke command validates functionality; one sample is not a performance claim.

## What is measured

| Dimension | Measurement |
| --- | --- |
| Delivery size | Minified application bundle bytes, gzip bytes, Brotli bytes |
| Startup | Navigation start to imported runtime and committed empty table, in a fresh browser context |
| Rendering and scale | Create 1,000 and 10,000 rows; replace 1,000 rows with new keys |
| Updates | Update every tenth label; update all 1,000 labels |
| Keyed reconciliation | Append 1,000 rows; swap distant rows; reverse; remove one row |
| Events | Dispatch a button click and commit its selected row state |
| Cleanup | Clear 1,000 rows; unmount a populated root |
| Frame latency | Operation start through forced layout and two animation frames |
| Memory | Post-GC JavaScript heap for empty, 10,000-row, and ten mount/unmount-cycle states |

Timing results include the median, nearest-rank p95, min/max, and raw samples.
The default is three discarded warmups and ten recorded samples per operation.
Startup and memory each have ten recorded samples without discarded warmups.
There is no pass/fail speed target: this is a comparative baseline, not an
optimization or a performance gate. Correctness is the pass/fail criterion.

## Fairness and interpretation

- Every implementation renders the same table, cells, buttons, labels, selection
  classes, and CSS. Deterministic input arrays are prepared before timing.
  Runtime-specific bookkeeping is timed. Input data generation is not.
- All lists use stable row IDs. Every sample checks every row's ID, text, order,
  selection, and retained DOM identity. Unmount must remove all root content.
  Setup and validation run outside measured intervals.
- The adapters use public rendering APIs: React `createRoot` (waiting for a
  layout effect), Preact `render`, Vue's runtime `render` with VNodes, Radi's
  `createRoot`/`createList`/`update`, and a handwritten keyed DOM reconciler.
  React is not forced through `flushSync`. Vue uses render functions rather than
  compiled templates. These are equivalent rendering workloads, not equivalent
  scheduler implementations or each framework's most optimized application.
  Commit time is wall-clock latency, including React's scheduling delay and
  promise continuations; it must not be interpreted as pure CPU execution time.
- Radi keeps a lookup map so retained keyed row closures read the latest immutable
  data. Its construction cost is included. No adapter uses virtualization,
  memoized row components, or framework-specific compiler optimizations.
- Click latency uses a synthetic DOM click, including each framework's handler.
  It excludes physical input dispatch. Frame latency includes refresh pacing and
  forced layout; it is neither actual paint completion nor Core Web Vitals INP.
- Production bundle sizes include the adapter and shared benchmark harness,
  not just library code. Each framework is bundled separately with the same
  esbuild configuration. Compression is calculated offline.
- Startup uses local uncompressed HTTP and fresh contexts with no-store responses.
  It excludes browser process launch and does not simulate a slow network or
  fully cold OS/browser code caches. It is not LCP or a real-site load metric.
- Memory is Chromium's `Runtime.getHeapUsage.usedSize` after explicit GC. It
  includes the harness and is not total process RAM or native DOM memory. The
  cycle measurement is a retention signal, not proof of absence of leaks.
- Frameworks run sequentially. A timestamp-based rotation varies their order;
  the exact order is recorded. Run several complete comparisons on an idle
  machine to check order, thermal, JIT, GC, and background-load effects. Do not
  infer meaningful differences from tiny or overlapping ranges.
- Metadata records the Radi Git revision and dirty state, package versions,
  browser version, CPU, OS, Node, viewport, and repetition counts. The lockfile
  fixes transitive dependencies. Run from a clean checkout for published results.

This measures client runtime costs shared by all five implementations. It does
not claim to exhaust every possible performance dimension. SSR, hydration,
networked applications, mobile hardware, other browsers, compiler strategies,
and application-specific deep component trees need separate workloads. Vanilla
is a reference implementation, not a theoretical lower bound.

Rendering semantics: [React DOM commit timing](https://react.dev/learn/manipulating-the-dom-with-refs),
[Preact rendering](https://preactjs.com/guide/v10/api-reference/#render), and
[Vue render functions](https://vuejs.org/api/render-function.html).
