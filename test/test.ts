/// <reference lib="deno.unstable" />  // Potential future bundler APIs

import path from "node:path";
import { statSync } from "node:fs";
import { parseArgs } from "node:util";
import { startBrowser } from "./browser.ts";
import { directory } from "./files.ts";
import { sourceMapSupport } from "./sourcemap.ts";

const { values, positionals } = parseArgs({
  args: Deno.args,
  options: {
    ui: { type: "boolean", default: false },
    watch: { type: "boolean", default: false },
    includes: { type: "string", multiple: true },
  },
  strict: true,
  allowPositionals: true,
});

const entrypoints: string[] = [];
const includeDirs: string[] = (values.includes || []).map((p) =>
  path.resolve(p)
);

// If positionals are provided, treat them strictly as explicit test files.
// Directories must be passed via --includes.
if (positionals.length) {
  for (const p of positionals) {
    const abs = path.resolve(p);
    let stats;
    try {
      stats = statSync(abs);
    } catch {
      throw new Error(`Path not found: ${p}`);
    }
    if (stats.isDirectory()) {
      throw new Error(`"${p}" is a directory. Use --includes "${p}" instead.`);
    }
    if (!/\.test\.tsx?$/.test(abs)) {
      throw new Error(`"${p}" is not a .test.ts or .test.tsx file`);
    }
    const relativePath = abs.replace(
      new RegExp(`^${Deno.cwd().replace(/\//g, "/")}\/`),
      "",
    );
    entrypoints.push(relativePath);
  }
} else {
  // Fallback to scanning include directories (or current working directory if none specified).
  const roots = includeDirs.length ? includeDirs : [path.resolve("./")];
  directory(roots, (filePath) => {
    const relativePath = filePath.replace(
      new RegExp(`^${Deno.cwd().replace(/\//g, "/")}\/`),
      "",
    );
    entrypoints.push(relativePath);
  }, { include: [/\.test\.tsx?$/] });
}

if (!entrypoints.length) {
  throw new Error("No test entrypoints found");
}

// Internal bundling step (no code splitting)
async function bundle(): Promise<{ html: string }> {
  const result = await Deno.bundle({
    entrypoints,
    outputDir: "./",
    platform: "browser",
    minify: false,
    sourcemap: "inline",
    write: false,
    format: "esm",
    codeSplitting: false,
  });

  if (!result.success) {
    for (const error of result.errors) {
      console.error(error.text);
    }
    throw new Error("Bundling failed");
  }

  const importEntries: string[] = [];
  const moduleNames: [string, string][] = [];

  result.outputFiles?.forEach((file, i) => {
    const moduleName = `test_module_${i}`;
    moduleNames.push([entrypoints[i], moduleName]);
    const decorated = [file.text()].join("\n");
    const encoded = encodeURIComponent(decorated);
    importEntries.push(
      `"${moduleName}": "data:application/javascript,${encoded}"`,
    );
  });

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Radi Test Runner</title>
    <script type="module">${await sourceMapSupport()}</script>
    <script type="importmap">
    {
      "imports": {
        ${importEntries.join(",\n        ")}
      }
    }
    </script>
    <script type="module">
    const modules = ${JSON.stringify(moduleNames)};
    for (const [e, m] of modules) {
      console.log("");
      console.group(\`%c\${e}\`, "text-decoration:underline;");
      await import(m);
      console.groupEnd();
    }
    window.showReport?.();
    window.__done?.(window.__test_failing);
    </script>
  </head>
  <body></body>
</html>`;
  return { html };
}

if (!values.watch) {
  const { html } = await bundle();
  await startBrowser(html, false, { headless: !values.ui });
} else {
  // Watch mode using Deno.watchFs (no global --watch flag required)
  const rootsToWatch = includeDirs.length ? includeDirs : [path.resolve("./")];

  async function runSuite() {
    console.log("[run] bundling & executing tests...");
    const { html } = await bundle();
    // Use watch=true so process does not exit after tests finish; headless browser will close itself.
    await startBrowser(html, true, { headless: !values.ui });
  }

  await runSuite();

  console.log("[watch] watching for changes in:", rootsToWatch.join(", "));

  const watcher = Deno.watchFs(rootsToWatch, { recursive: true });
  let pending = false;
  const debounceMs = 150;
  let lastTrigger = 0;

  for await (const event of watcher) {
    // Only react to modifies/add/remove involving .ts/.tsx files
    if (!event.paths.some((p) => /\.tsx?$/.test(p))) {
      continue;
    }
    const nowTs = Date.now();
    if (pending && nowTs - lastTrigger < debounceMs) {
      lastTrigger = nowTs;
      continue;
    }
    pending = true;
    lastTrigger = nowTs;
    setTimeout(async () => {
      pending = false;
      console.clear();
      console.log(
        "[watch] change detected:",
        event.paths.map((p) => path.relative(Deno.cwd(), p)).join(", "),
      );
      try {
        await runSuite();
      } catch (e) {
        console.error("[watch] rebuild failed:", e);
      }
    }, debounceMs);
  }
}
