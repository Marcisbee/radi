import { startBrowser } from "./browser.ts";
import { sourceMapSupport } from "./sourcemap.ts";

const result = await Deno.bundle({
  entrypoints: ["./test/prototype/entry1.ts"],
  outputDir: ".",
  platform: "browser",
  minify: true,
  sourcemap: "inline",
  write: false,
  format: "esm",
  codeSplitting: false,
});

const html = `
<script type="module">${await sourceMapSupport()}</script>
<script type="importmap">
{
  "imports": {
    ${
  result.outputFiles?.map((file, i) => {
    const name = `module${i}`;
    const code = encodeURIComponent(file.text());
    return `"${name}": "data:application/javascript,${code}"`;
  }).join(",\n    ")
}
  }
}
</script>
<script type="module">
  await import('module0');
</script>
`;

await startBrowser(html, false, { headless: false });
