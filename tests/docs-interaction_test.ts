import { strict as assert } from 'node:assert';
import { chromium } from 'npm:playwright@1.56.1';

Deno.test('the generated docs counter works on its first click without another download', async () => {
  const build = await new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', 'site/build.ts'],
    cwd: new URL('../', import.meta.url),
    stdout: 'null',
  }).output();
  assert.equal(build.code, 0);
  const assets = new URL('../dist/docs/', import.meta.url);
  const types: Record<string, string> = {
    js: 'text/javascript',
    css: 'text/css',
    woff2: 'font/woff2',
    html: 'text/html',
  };
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0 },
    async (request) => {
      const path = new URL(request.url).pathname;
      const file = path === '/' ? 'index.html' : path.slice(1);
      try {
        return new Response(await Deno.readFile(new URL(file, assets)), {
          headers: {
            'content-type': types[file.split('.').at(-1)!] ?? 'text/plain',
          },
        });
      } catch {
        return new Response('Not found', { status: 404 });
      }
    },
  );
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${server.addr.port}`);
    await context.setOffline(true);
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    const output = page.locator('output');
    assert.equal(await output.textContent(), '0');
    await page.getByRole('button', { name: 'Add one +' }).click();
    await page.waitForFunction(
      () => document.querySelector('output')?.textContent === '1',
      null,
      { timeout: 3000 },
    );
    await page.getByRole('button', { name: 'Add one +' }).press('Enter');
    await page.waitForFunction(
      () => document.querySelector('output')?.textContent === '2',
      null,
      { timeout: 3000 },
    );
    assert.deepEqual(requests, []);
  } finally {
    await browser.close();
    await server.shutdown();
  }
});
