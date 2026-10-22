import { join } from 'node:path';
import { build, stop } from 'npm:esbuild';
import { generateStaticSite } from '../src/static.ts';
import { createElement as h } from '../src/server.ts';
import { page } from './page.ts';
import { writeAgentDocs } from './agent-docs.ts';

const outDir = new URL('../dist/docs/', import.meta.url).pathname;
await Deno.mkdir(outDir, { recursive: true });
try {
  await build({
    entryPoints: [new URL('./client.ts', import.meta.url).pathname],
    outfile: join(outDir, 'client.js'),
    bundle: true,
    minify: true,
    format: 'iife',
  });
} finally {
  stop();
}
for (
  const asset of [
    'style.css',
    'radi-logo.png',
    'inter.woff2',
    'ibm-plex-serif.woff2',
    'jetbrains-mono.woff2',
    'inter-license.txt',
    'ibm-plex-serif-license.txt',
    'jetbrains-mono-license.txt',
  ]
) {
  await Deno.copyFile(
    new URL(`./${asset}`, import.meta.url),
    join(outDir, asset),
  );
}
await Deno.copyFile(
  new URL('../CNAME', import.meta.url),
  join(outDir, 'CNAME'),
);
await generateStaticSite([{
  path: '/',
  title: 'Radi | A small runtime for reactive interfaces',
  bootstrap: '/client.js',
  head: [
    h('link', { rel: 'stylesheet', href: '/style.css' }),
    h('link', { rel: 'icon', href: '/radi-logo.png', type: 'image/png' }),
    h('link', { rel: 'canonical', href: 'https://radi.js.org/' }),
    h('link', { rel: 'alternate', type: 'text/markdown', href: '/index.md' }),
    h('link', { rel: 'describedby', href: '/llms.txt' }),
    h('meta', {
      name: 'description',
      content:
        'Learn Radi: plain-function components, explicit reactivity, server rendering, and static sites with interactive islands.',
    }),
  ],
  render: page,
}], (path, html) => Deno.writeTextFile(join(outDir, path), html));
await writeAgentDocs(
  outDir,
  await Deno.readTextFile(join(outDir, 'index.html')),
);
console.log(`Documentation built in ${outDir}`);

if (Deno.args.includes('--serve')) {
  const files: Record<string, string> = {
    '/': 'index.html',
    '/style.css': 'style.css',
    '/client.js': 'client.js',
    '/radi-logo.png': 'radi-logo.png',
    '/inter.woff2': 'inter.woff2',
    '/ibm-plex-serif.woff2': 'ibm-plex-serif.woff2',
    '/jetbrains-mono.woff2': 'jetbrains-mono.woff2',
    '/inter-license.txt': 'inter-license.txt',
    '/ibm-plex-serif-license.txt': 'ibm-plex-serif-license.txt',
    '/jetbrains-mono-license.txt': 'jetbrains-mono-license.txt',
    '/index.md': 'index.md',
    '/llms.txt': 'llms.txt',
    '/docs/server-rendering.md': 'docs/server-rendering.md',
    '/docs/go-server.md': 'docs/go-server.md',
    '/docs/resumption.md': 'docs/resumption.md',
    '/docs/static-sites.md': 'docs/static-sites.md',
    '/docs/routing.md': 'docs/routing.md',
  };
  Deno.serve({ hostname: '127.0.0.1', port: 4320 }, async (request) => {
    const file = files[new URL(request.url).pathname];
    if (!file) return new Response('Not found', { status: 404 });
    const type = file.endsWith('.woff2')
      ? 'font/woff2'
      : file.endsWith('.png')
      ? 'image/png'
      : file.endsWith('.txt')
      ? 'text/plain'
      : file.endsWith('.md')
      ? 'text/markdown'
      : file.endsWith('.js')
      ? 'text/javascript'
      : file.endsWith('.css')
      ? 'text/css'
      : 'text/html';
    return new Response(await Deno.readFile(join(outDir, file)), {
      headers: { 'content-type': `${type}; charset=utf-8` },
    });
  });
}
