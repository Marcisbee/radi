import { createElement as h, renderToReadableStream } from '../src/server.ts';

async function Content() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return h('p', null, 'Async content has arrived.');
}

Deno.serve({ hostname: '127.0.0.1', port: 8080 }, (request) => {
  if (new URL(request.url).pathname === '/health') return new Response('ok');
  return new Response(
    renderToReadableStream(
      h(
        'html',
        { lang: 'en' },
        h(
          'head',
          null,
          h('meta', { charset: 'utf-8' }),
          h('title', null, 'Radi streaming'),
        ),
        h(
          'body',
          null,
          h('h1', null, 'Radi server rendering'),
          h(Content, null),
        ),
      ),
    ),
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
});
