import * as dnt from "jsr:@deno/dnt";
import denojson from "./deno.json" with { type: "json" };

async function start() {
  await dnt.emptyDir("./npm");

  await dnt.build({
    skipSourceOutput: true,
    entryPoints: [
      "./src/main.ts",
      {
        name: "./jsx-runtime",
        path: "./src/jsx-runtime.ts",
      },
      {
        name: "./jsx-dev-runtime",
        path: "./src/jsx-dev-runtime.ts",
      },
    ],
    outDir: "./npm",
    shims: {},
    esModule: true,
    scriptModule: false,
    typeCheck: false,
    test: false,
    compilerOptions: {
      importHelpers: false,
      target: "ES2021",
    },
    package: {
      name: "radi",
      version: denojson.version,
      // description: "...",
      // license: "MIT",
      repository: {
        type: "git",
        url: "git+https://github.com/Marcisbee/radi.git",
      },
      bugs: {
        url: "https://github.com/Marcisbee/radi/issues",
      },
    },
    declaration: "separate",

    async postBuild() {
      await Deno.copyFile("src/jsx.d.ts", "npm/jsx.d.ts");
      // await Deno.copyFile("LICENSE", "npm/LICENSE");
      await Deno.copyFile("README.md", "npm/README.md");
    },
  });
}

start();
