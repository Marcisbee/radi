export async function sourceMapSupport() {
  const utilsBundle = await Deno.bundle({
    entrypoints: ["./test/sourcemap.client.ts"],
    outputDir: ".",
    platform: "browser",
    minify: true,
    sourcemap: "inline",
    write: false,
    format: "esm",
    codeSplitting: false,
  });

  return utilsBundle.outputFiles?.[0].text();
}
