/// <reference lib="deno.unstable" />  // (For future bundler APIs if needed)

import path from "node:path";
import { parseArgs } from "node:util";
import { startBrowser } from "./browser.ts";
import { directory } from "./files.ts";

const { values, positionals } = parseArgs({
  args: Deno.args,
  options: {
    ui: {
      type: "boolean",
      default: false,
    },
    watch: {
      type: "boolean",
      default: false,
    },
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
}, { include: [/\.test\.tsx?/] });

if (!entrypoints?.length) {
  throw new Error("No entrypoints found in " + root);
}

const result = await Deno.bundle({
  entrypoints,
  outputDir: ".tests",
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

const html =
  `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>BoltWatch</title></head><body>${
    result.outputFiles?.map((file, i) =>
      `<script type="module">console.log("");console.group("%c${
        entrypoints[i]
      }", "text-decoration:underline;");${file.text()};console.groupEnd();</script>`
    ).concat(
      `<script type="module">window.showReport();(window.__done)?.(window.__test_failing)</script>`,
    ).join("\n")
  }</body></html>`;

if (values.ui) {
  const server = Deno.serve({ port: 8000 }, () => (
    new Response(
      html,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      },
    )
  ));

  await server.finished;
}

await startBrowser(html, values.watch);
