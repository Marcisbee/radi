import { strict as assert } from 'node:assert';
import { chromium } from 'npm:playwright@1.56.1';

// Run against the compiled examples/router Go server (see docs/routing.md).
Deno.test('Go/V8 SSR, client navigation, history and action revalidation', async () => {
  const base = Deno.env.get('RADI_ROUTER_URL') ?? 'http://127.0.0.1:4321';
  const initial = await fetch(`${base}/pages/about`);
  assert.equal(initial.status, 200);
  assert.match(await initial.text(), /<h1>About<\/h1>/);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const documents: string[] = [];
    const reads: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'document') documents.push(request.url());
      if (request.method() === 'GET' && request.url().includes('/api/')) {
        reads.push(request.url());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base);
    await page.getByRole('button', { name: 'Add visit' }).waitFor();
    assert.equal(
      reads.length,
      0,
      'SSR bootstrap must avoid an initial data fetch',
    );
    await page.locator('#note').fill('Keep this shared state');
    const note = await page.locator('#note').elementHandle();
    const about = page.getByRole('link', { name: 'About', exact: true });
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().endsWith('/api/pages/about')
      ),
      about.hover(),
    ]);
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().endsWith('/api/pages/home')
      ),
      page.getByRole('link', { name: 'Home', exact: true }).focus(),
    ]);
    const prefetchedReads = reads.length;
    for (const _ of [1, 2, 3]) {
      await about.click();
      await page.getByRole('heading', { name: 'About', exact: true }).waitFor();
      await page.getByRole('link', { name: 'Home', exact: true }).click();
      await page.getByRole('heading', { name: 'Home', exact: true }).waitFor();
    }
    assert.equal(
      reads.length,
      prefetchedReads,
      'Warm navigation must reuse prefetched data',
    );
    assert.equal(
      documents.length,
      1,
      'SPA navigation must not fetch another document',
    );
    assert.equal(await note!.evaluate((node) => node.isConnected), true);
    assert.equal(
      await page.locator('#note').inputValue(),
      'Keep this shared state',
    );
    await page.goBack();
    await page.getByRole('heading', { name: 'About', exact: true }).waitFor();
    await page.goForward();
    await page.getByRole('heading', { name: 'Home', exact: true }).waitFor();
    const before = Number(await page.locator('output').textContent());
    await page.getByRole('button', { name: 'Add visit' }).click();
    await page.waitForFunction(
      (value) =>
        document.querySelector('output')?.textContent === String(value),
      before + 1,
    );
    assert.equal(documents.length, 1, 'Actions must not reload the document');
    await page.reload();
    await page.getByRole('button', { name: 'Add visit' }).waitFor();
    assert.equal(
      Number(await page.locator('output').textContent()),
      before + 1,
    );
    assert.deepEqual(errors, []);
    console.log(
      'Three warm round trips: zero document requests, zero additional data reads; history and mutation persisted.',
    );
  } finally {
    await browser.close();
  }
});
