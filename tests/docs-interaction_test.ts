import { strict as assert } from 'node:assert';
import { chromium } from 'npm:playwright@1.56.1';

Deno.test('the generated guide supports keyboard search and first-click interaction offline', async () => {
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
    const search = page.getByRole('button', { name: 'Search docs' });
    await search.click();
    const input = page.getByRole('searchbox', { name: 'Search documentation' });
    assert.ok(
      await input.evaluate((element) => element === document.activeElement),
    );
    await input.fill('createAbortSignal');
    const results = page.getByRole('navigation', { name: 'Search results' });
    assert.equal(await results.getByRole('link').count(), 2);
    await results.getByRole('link', { name: /^Lifecycle/ }).focus();
    await page.keyboard.press('Enter');
    assert.ok(page.url().endsWith('#lifecycle'));
    assert.equal(await page.getByRole('dialog').count(), 0);
    await search.focus();
    await page.keyboard.press('Control+k');
    await input.fill('no-such-api-xyz');
    assert.equal(await results.getByRole('link').count(), 0);
    assert.ok(
      await page.getByText('No matching topics.', { exact: false }).isVisible(),
    );
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.ok(
      await search.evaluate((element) => element === document.activeElement),
    );
    assert.deepEqual(requests, []);
  } finally {
    await browser.close();
    await server.shutdown();
  }
});
