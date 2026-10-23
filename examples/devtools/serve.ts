import { build, stop } from 'npm:esbuild';

const result = await build({
  entryPoints: [new URL('./app.ts', import.meta.url).pathname],
  bundle: true,
  write: false,
  format: 'iife',
});
stop();
const html = await Deno.readTextFile(new URL('./index.html', import.meta.url));
Deno.serve({
  hostname: '127.0.0.1',
  port: Number(Deno.env.get('PORT') || 8174),
}, (request) => {
  const path = new URL(request.url).pathname;
  if (path === '/') {
    return new Response(html, { headers: { 'content-type': 'text/html' } });
  }
  if (path === '/app.js') {
    return new Response(result.outputFiles[0].contents, {
      headers: { 'content-type': 'text/javascript' },
    });
  }
  return new Response('Not found', { status: 404 });
});
