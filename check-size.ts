import * as esbuild from "npm:esbuild";

await esbuild.build({
  entryPoints: ["src/client.ts", "src/server.ts"],
  "sourcemap": false,
  write: false,
  outdir: "out",
  "target": [
    "esnext",
  ],
  "format": "esm",
  "bundle": true,
  "minify": true,
  "treeShaking": true,
  "platform": "browser",
  "color": true,
  "globalName": "BundledCode",
  "logLevel": "info",
});
