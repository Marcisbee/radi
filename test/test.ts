/// <reference lib="deno.unstable" />  // Potential future bundler APIs

import path from "node:path";
import { parseArgs } from "node:util";
import { startBrowser } from "./browser.ts";
import { directory } from "./files.ts";
import { sourceMapSupport } from "./sourcemap.ts";

const { values, positionals } = parseArgs({
  args: Deno.args,
  options: {
    ui: { type: "boolean", default: false },
    watch: { type: "boolean", default: false },
  },
  strict: true,
  allowPositionals: true,
});

const root = path.resolve(positionals[0] || "./");
const entrypoints: string[] = [];

// Discover test entrypoints (*.test.ts / *.test.tsx)
directory([root], (filePath) => {
  const relativePath = filePath.replace(
    new RegExp(`^${Deno.cwd().replace(/\//g, "/")}\/`),
    "",
  );
  entrypoints.push(relativePath);
}, { include: [/\.test\.tsx?$/] });

if (!entrypoints.length) {
  throw new Error("No test entrypoints found in " + root);
}

// Bundle all test entrypoints into ESM (no code splitting)
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

// Build importmap where each bundled file is a data: URI module.
// We wrap each module's code with console.group decorations for readability.
const importEntries: string[] = [];
const moduleNames: [string, string][] = [];

result.outputFiles?.forEach((file, i) => {
  const moduleName = `test_module_${i}`;
  moduleNames.push([entrypoints[i], moduleName]);

  const decorated = [
    file.text(),
  ].join("\n");

  const encoded = encodeURIComponent(decorated);
  importEntries.push(
    `"${moduleName}": "data:application/javascript,${encoded}"`,
  );
});

// Compose final HTML with a single importmap and one loader module script
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

// Launch browser (headless by default unless watch controls otherwise)
await startBrowser(html, values.watch, { headless: !values.ui });
