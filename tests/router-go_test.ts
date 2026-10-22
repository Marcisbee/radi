import { strict as assert } from 'node:assert';
import { chromium } from 'npm:playwright@1.64.1';

// Run against the compiled examples/router Go server (see docs/routing.md).
Deno.test('Go/V8 SSR, client navigation, history and action revalidation', async () => {
  const base = Deno.env.get('RADI_ROUTER_URL') ?? 'http://127.0.0.1:4321';
  const initial = await fetch(`${base}/pages/about`);
  assert.equal(initial.status, 200);
  assert.match(await initial.text(), /<h1>About<\/h1>/);
  const browser = await chromium.launch({
    headless: true,
    channel: Deno.env.get('RADI_BROWSER_CHANNEL'),
  });
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
    await page.locator('#draft').fill('Do not lose my comment');
    await page.evaluate(() => {
      const frame = document.querySelector<HTMLIFrameElement>('#embed')!;
      Object.assign(globalThis, {
        preserved: {
          draft: document.querySelector('#draft'),
          section: document.querySelector('#outlet section'),
          frame,
          document: frame.contentDocument,
          history: history.length,
          outsideChanges: 0,
        },
      });
      const saved = (globalThis as unknown as {
        preserved: { outsideChanges: number; observer?: MutationObserver };
      }).preserved;
      saved.observer = new MutationObserver((records) => {
        saved.outsideChanges += records.filter((record) =>
          !document.querySelector('#reaction')!.contains(record.target)
        ).length;
      });
      saved.observer.observe(document.querySelector('#outlet')!, {
        subtree: true,
        attributes: true,
        childList: true,
        characterData: true,
      });
    });
    const reactionReads = reads.length;
    for (const _ of [1, 2, 3]) {
      await page.getByRole('button', { name: 'Add reaction', exact: true })
        .click();
      await page.getByText('1 reaction', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Remove reaction', exact: true })
        .click();
      await page.getByText('0 reactions', { exact: true }).waitFor();
    }
    assert.equal(
      reads.length,
      reactionReads,
      'Reaction receipts need no route reload',
    );
    assert.equal(
      await page.locator('#draft').inputValue(),
      'Do not lose my comment',
    );
    assert.equal(
      await page.evaluate(`(() => {
      const saved = globalThis.preserved;
      return saved.draft === document.querySelector('#draft') &&
        saved.section === document.querySelector('#outlet section') &&
        saved.frame === document.querySelector('#embed') &&
        saved.document === saved.frame.contentDocument &&
        saved.history === history.length && saved.outsideChanges === 0;
    })()`),
      true,
      'Reactions preserve the route subtree, embedded document and history',
    );
    await page.evaluate('globalThis.preserved.observer.disconnect()');
    await page.getByRole('button', { name: 'Add reaction', exact: true })
      .click();
    await page.getByText('1 reaction', { exact: true }).waitFor();
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
    await page.getByRole('button', { name: 'Remove reaction', exact: true })
      .waitFor();
    await page.getByRole('button', { name: 'Remove reaction', exact: true })
      .click();
    await page.getByText('0 reactions', { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(
      'Three warm round trips reuse data. Reactions preserve draft, embedded document and history without route reads; writes survive refresh.',
    );
  } finally {
    await browser.close();
  }
});
