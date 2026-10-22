/** Build: deno run -A examples/static-site.ts [--serve] */
import { dirname, join } from 'node:path';
import { build, stop } from 'npm:esbuild';
import { generateStaticSite } from '../src/static.ts';
import { createElement as h, resumable, resumeClick } from '../src/server.ts';

function counter(count: number) {
  return resumable({ count }, [
    h('button', { type: 'button', ...resumeClick('increment') }, 'Increment'),
    h('p', null, 'Count: ', h('output', null, String(count))),
    h('p', { role: 'status' }, 'Handler loads on the first click.'),
  ]);
}

export async function buildStaticExample(outDir: string): Promise<void> {
  await Deno.mkdir(outDir, { recursive: true });
  try {
    for (const name of ['resumption-client', 'resumption-handler']) {
      await build({
        entryPoints: [new URL(`./${name}.ts`, import.meta.url).pathname],
        outfile: join(outDir, `${name}.js`),
        bundle: true,
        minify: true,
        format: name.endsWith('client') ? 'iife' : 'esm',
        external: ['./resumption-handler.js'],
      });
    }
  } finally {
    stop();
  }
  await generateStaticSite([
    {
      path: '/',
      title: 'Radi static site',
      render: () => [
        h('h1', null, 'Radi static site'),
        h('p', null, 'Development example. This page needs no JavaScript.'),
        h('a', { href: '/guide/' }, 'Interactive guide'),
      ],
    },
    {
      path: '/guide/',
      title: 'Interactive guide',
      bootstrap: '/resumption-client.js',
      render: async () => [
        h('h1', null, 'Interactive guide'),
        h('p', { id: 'static-content' }, 'Built once. Served as static files.'),
        counter(0),
        counter(10),
        h('a', { href: '/' }, 'Home'),
      ],
    },
  ], async (path, html) => {
    const file = join(outDir, path);
    await Deno.mkdir(dirname(file), { recursive: true });
    await Deno.writeTextFile(file, html);
  });
}

/** Example file server; rendering and bundling have already finished. */
export function serveStaticExample(outDir: string, port = 4319) {
  const files: Record<string, string> = {
    '/': 'index.html',
    '/guide/': 'guide/index.html',
    '/resumption-client.js': 'resumption-client.js',
    '/resumption-handler.js': 'resumption-handler.js',
  };
  return Deno.serve({ hostname: '127.0.0.1', port }, async (request) => {
    const file = files[new URL(request.url).pathname];
    if (!file) return new Response('Not found', { status: 404 });
    return new Response(await Deno.readFile(join(outDir, file)), {
      headers: {
        'content-type': file.endsWith('.js')
          ? 'text/javascript; charset=utf-8'
          : 'text/html; charset=utf-8',
      },
    });
  });
}

if (import.meta.main) {
  const outDir = new URL('../dist/static-site/', import.meta.url).pathname;
  await buildStaticExample(outDir);
  console.log(`Static files written to ${outDir}`);
  if (Deno.args.includes('--serve')) serveStaticExample(outDir);
}
