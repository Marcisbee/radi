/// <reference lib="deno.unstable" />

import path from "node:path";
import { parseArgs } from "node:util";
import { startBrowser } from "./browser.ts";
import { directory } from "./files.ts";
import { sourceMapSupport } from "./sourcemap.ts";

const { values, positionals } = parseArgs({
  args: Deno.args,
  options: {
    ui: { type: "boolean", default: false },
  },
  strict: true,
  allowPositionals: true,
});

const root = path.resolve(positionals[0] || "./");
const entrypoints: string[] = [];
directory([path.resolve(positionals[0] || "./")], (filePath) => {
  const relativePath = filePath.replace(
    new RegExp(`^${Deno.cwd().replace(/\//g, "/")}\/`),
    "",
  );

  // console.log(`Found "${relativePath}"`);
  entrypoints.push(relativePath);
}, { include: [/\.bench\.tsx?/] });

if (!entrypoints.length) {
  console.error("No .bench.ts / .bench.tsx files found in", root);
  Deno.exit(1);
}

/* ------------------------------- Bundling --------------------------------- */
interface ModuleRecord {
  entrypoint: string;
  moduleName: string;
  encoded: string;
  rawCode: string;
}

const modules: ModuleRecord[] = [];
const allOutputFiles: { text(): string }[] = [];

for (let i = 0; i < entrypoints.length; i++) {
  const ep = entrypoints[i];
  let bundle;
  try {
    bundle = await Deno.bundle({
      entrypoints: [ep],
      outputDir: ".",
      platform: "browser",
      minify: true,
      sourcemap: "inline",
      write: false,
      format: "esm",
      codeSplitting: false,
    });
  } catch (e) {
    console.error(`Bundling failed for ${ep}:`, e);
    Deno.exit(1);
  }

  if (!bundle.success) {
    for (const err of bundle.errors) {
      console.error(`[bundle error] ${ep}: ${err.text}`);
    }
    Deno.exit(1);
  }

  const file = bundle.outputFiles?.[0];
  if (!file) {
    console.error(`No output file produced for ${ep}`);
    Deno.exit(1);
  }

  allOutputFiles.push(file);
  const code = file.text();
  const encoded = encodeURIComponent(code);
  const moduleName = `module${i}`;
  modules.push({ entrypoint: ep, moduleName, encoded, rawCode: code });
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Bench Runner</title>
</head>
<body>
<script type="module">${await sourceMapSupport()}</script>
<script type="module">
const modules = ${
  JSON.stringify(
    modules.map((m) => ({
      entrypoint: m.entrypoint,
      path: `data:application/javascript,${m.encoded}`,
    })),
  )
};

for (const { entrypoint, path } of modules) {
  console.log("");
  console.log("%c" + entrypoint, "text-decoration:underline;");
  await import(path);
  await new Promise((r) => setTimeout(r, 50));
}

(window.__done)?.(0);
</script>
</body>
</html>`;

await startBrowser(html, /*watch*/ false, {
  headless: !values.ui,
});
