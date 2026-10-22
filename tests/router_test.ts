/// <reference lib="deno.unstable" />
import { chromium } from 'npm:playwright@1.56.1';

Deno.test('browser routing contracts on a real HTTP origin', async () => {
  const bundle = await Deno.bundle({
    entrypoints: ['tests/router-browser.ts'],
    platform: 'browser',
    write: false,
  });
  if (!bundle.success) throw new Error(JSON.stringify(bundle.errors));
  const source = bundle.outputFiles![0].text();
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen() {} },
    (request) => {
      const path = new URL(request.url).pathname;
      if (path === '/data') return Response.json({ title: 'From HTTP' });
      if (path === '/failure') {
        return new Response('Unavailable', { status: 503 });
      }
      if (path === '/redirect-data') {
        return new Response(null, {
          status: 204,
          headers: { 'X-Radi-Location': '/' },
        });
      }
      return path === '/tests.js'
        ? new Response(source, {
          headers: { 'Content-Type': 'text/javascript' },
        })
        : new Response('<script type="module" src="/tests.js"></script>', {
          headers: { 'Content-Type': 'text/html' },
        });
    },
  );
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.clock.install();
    page.on('console', (message) => console.log(message.text()));
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.addr.port}/`);
    await page.waitForFunction(() => 'routerTestResult' in globalThis);
    const result = await page.evaluate<{ failed: number; total: number }>(
      'globalThis.routerTestResult',
    );
    if (result.failed || !result.total || errors.length) {
      throw new Error(JSON.stringify({ result, errors }));
    }
  } finally {
    await browser.close();
    await server.shutdown();
  }
});
