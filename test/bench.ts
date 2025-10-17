/// <reference lib="deno.unstable" />

import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { startBrowser } from "./browser.ts";

const { values, positionals } = parseArgs({
  args: Deno.args,
  options: {
    ui: { type: "boolean", default: false },
  },
  strict: true,
  allowPositionals: true,
});

function* walkSync(dir: string): IterableIterator<string> {
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    yield dir;
    return;
  }
  const entries = fs.readdirSync(dir, "utf-8");
  for (const e of entries) {
    const p = path.join(dir, e);
    let isDir = false;
    try {
      isDir = fs.statSync(p).isDirectory();
    } catch {
      // ignore
    }
    if (isDir) {
      yield* walkSync(p);
    } else {
      yield p;
    }
  }
}

const excludeDefaults: RegExp[] = [/node_modules(\/|\\)/, /dist(\/|\\)/];

function inAny(pathStr: string, rules: RegExp[]) {
  return rules.some((r) => r.test(pathStr));
}

function collectBenchEntrypoints(root: string): string[] {
  const out: string[] = [];
  for (const file of walkSync(root)) {
    if (inAny(file, excludeDefaults)) continue;
    if (/\.bench\.tsx?$/.test(file)) {
      const rel = file.replace(
        new RegExp(
          "^" + escapeForRegExp(Deno.cwd().replace(/\\/g, "/")) + "/?",
        ),
        "",
      );
      out.push(rel);
    }
  }
  return out;
}

function escapeForRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const root = path.resolve(positionals[0] || "./");
const entrypoints = collectBenchEntrypoints(root);

if (!entrypoints.length) {
  console.error("No .bench.ts / .bench.tsx files found in", root);
  Deno.exit(1);
}

// Bundle benchmarks
const bundleResult = await Deno.bundle({
  entrypoints,
  outputDir: ".bench",
  platform: "browser",
  minify: false,
  sourcemap: "inline",
  write: false,
  format: "esm",
  codeSplitting: false,
});

if (!bundleResult.success) {
  console.error("Bundling failed:");
  for (const e of bundleResult.errors) {
    console.error(e.text);
  }
  Deno.exit(1);
}

// Wrap each bundled file in its own grouped script similar to test runner
const scripts = bundleResult.outputFiles?.map((file, i) => {
  const entry = entrypoints[i];
  return `<script type="module">console.log("");console.group("%c${entry}","text-decoration:underline;");${file.text()};console.groupEnd();</script>`;
}) || [];

// Final script to show summary and signal done
const footer = `
<script type=\"module\">
setTimeout(() => {
  (window.__done)?.( (window.__bench_errors||[]).length ? 1 : 0 );
  }, 10);
</script>
`;

// Compose HTML
const html = `<!DOCTYPE html>
<html lang=\"en\">
  <head><meta charset=\"UTF-8\"/><title>Bench Runner</title></head>
  <body>
    ${scripts.join("\n")}
    ${footer}
  </body>
</html>`;

// UI mode server (optional)
if (values.ui) {
  const server = Deno.serve({ port: 8100 }, () =>
    new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }));
  await server.finished;
  // Don't await server.finished here because we still also launch headless
}

// Always run headless browser to produce results (no watch mode)
await startBrowser(html, /*watch*/ false);
