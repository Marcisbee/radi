import { join } from "node:path";
import { build, stop } from "npm:esbuild";
import { generateStaticSite } from "../src/static.ts";
import { createElement as h } from "../src/server.ts";
import { page } from "./page.ts";

const outDir = new URL("../dist/docs/", import.meta.url).pathname;
await Deno.mkdir(outDir, { recursive: true });
try {
  for (const name of ["client", "handler"]) {
    await build({
      entryPoints: [new URL(`./${name}.ts`, import.meta.url).pathname],
      outfile: join(outDir, `${name}.js`),
      bundle: true,
      minify: true,
      format: name === "client" ? "iife" : "esm",
      external: ["./handler.js"],
    });
  }
} finally {
  stop();
}
await Deno.copyFile(
  new URL("./style.css", import.meta.url),
  join(outDir, "style.css"),
);
await Deno.copyFile(
  new URL("../CNAME", import.meta.url),
  join(outDir, "CNAME"),
);
await generateStaticSite([{
  path: "/",
  title: "Radi — A small runtime for reactive interfaces",
  bootstrap: "/client.js",
  head: [
    h("link", { rel: "stylesheet", href: "/style.css" }),
    h("link", { rel: "canonical", href: "https://radi.js.org/" }),
    h("meta", {
      name: "description",
      content:
        "Learn Radi: plain-function components, explicit reactivity, server rendering, and static sites with interactive islands.",
    }),
  ],
  render: page,
}], (path, html) => Deno.writeTextFile(join(outDir, path), html));
console.log(`Documentation built in ${outDir}`);

if (Deno.args.includes("--serve")) {
  const files: Record<string, string> = {
    "/": "index.html",
    "/style.css": "style.css",
    "/client.js": "client.js",
    "/handler.js": "handler.js",
  };
  Deno.serve({ hostname: "127.0.0.1", port: 4320 }, async (request) => {
    const file = files[new URL(request.url).pathname];
    if (!file) return new Response("Not found", { status: 404 });
    const type = file.endsWith(".js")
      ? "text/javascript"
      : file.endsWith(".css")
      ? "text/css"
      : "text/html";
    return new Response(await Deno.readFile(join(outDir, file)), {
      headers: { "content-type": `${type}; charset=utf-8` },
    });
  });
}
