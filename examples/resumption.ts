/** Run: deno run -A examples/resumption.ts */
import { build, stop } from 'npm:esbuild';
import {
  createElement as h,
  renderToReadableStream,
  resumable,
  resumeClick,
} from '../src/server.ts';

const assets = new Map<string, string>();
for (const name of ['resumption-client', 'resumption-handler']) {
  const result = await build({
    entryPoints: [new URL(`./${name}.ts`, import.meta.url).pathname],
    bundle: true,
    minify: true,
    format: name.endsWith('client') ? 'iife' : 'esm',
    external: ['./resumption-handler.js'],
    write: false,
  });
  assets.set(`/${name}.js`, result.outputFiles![0].text);
}
stop();

Deno.serve({ hostname: '127.0.0.1', port: 4318 }, async (request) => {
  const path = new URL(request.url).pathname;
  if (path === '/health') return new Response('ok');
  if (assets.has(path)) {
    if (path.endsWith('handler.js')) {
      await new Promise((done) => setTimeout(done, 2000));
    }
    return new Response(assets.get(path), {
      headers: { 'content-type': 'text/javascript' },
    });
  }
  if (path !== '/') return new Response('Not found', { status: 404 });
  const page = h(
    'html',
    { lang: 'en' },
    h(
      'head',
      null,
      h('meta', { charset: 'utf-8' }),
      h('meta', {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      }),
      h('title', null, 'Radi resumption'),
      // A blocking bootstrap precedes interactive markup, including streamed HTML.
      h('script', { src: '/resumption-client.js' }),
    ),
    h(
      'body',
      null,
      h('h1', null, 'Radi resumption'),
      h(
        'p',
        null,
        'Development example. Click several times while the handler loads (2 seconds).',
      ),
      resumable({ count: 0 }, [
        h(
          'button',
          { type: 'button', ...resumeClick('increment') },
          'Increment',
        ),
        h('p', null, 'Count: ', h('output', null, '0')),
        h(
          'p',
          { role: 'status' },
          'Server HTML is visible. Handler code has not loaded.',
        ),
        new Promise((done) =>
          setTimeout(() => done(h('p', null, 'Stream complete.')), 1000)
        ),
      ]),
    ),
  );
  return new Response(renderToReadableStream(page), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
});
