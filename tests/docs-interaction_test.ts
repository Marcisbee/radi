import { strict as assert } from 'node:assert';
import { chromium } from 'npm:playwright@1.64.1';

Deno.test('the generated guide supports agent readers, system themes, and first-click interaction offline', async () => {
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
    const agent = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await agent.newPage();
    await staticPage.goto(`http://127.0.0.1:${server.addr.port}`);
    const links = await staticPage.locator('a').evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href') ?? '')
    );
    assert.ok(
      !links.some((href) => /\.md(?:#|$)|llms\.txt/.test(href)),
      'Readers must not be sent to raw documentation files',
    );
    for (
      const href of links.filter((href) =>
        href.startsWith('#') && href.length > 1
      )
    ) {
      assert.equal(
        await staticPage.locator(`[id="${href.slice(1)}"]`).count(),
        1,
        `On-page destination ${href} must exist exactly once`,
      );
    }
    const markdownPath = await staticPage.locator(
      'link[rel="alternate"][type="text/markdown"]',
    ).getAttribute('href');
    const indexPath = await staticPage.locator('link[rel="describedby"]')
      .getAttribute('href');
    assert.ok(markdownPath && indexPath);
    const base = `http://127.0.0.1:${server.addr.port}`;
    const markdownResponse = await agent.request.get(base + markdownPath);
    assert.equal(markdownResponse.status(), 200);
    const markdown = await markdownResponse.text();
    for (
      const code of await staticPage.locator('main pre code').allTextContents()
    ) {
      assert.ok(
        markdown.includes(code),
        'Markdown must preserve each complete code example',
      );
    }
    for (
      const heading of await staticPage.locator('main h1, main h2, main h3')
        .allTextContents()
    ) {
      assert.ok(
        markdown.includes(heading.replace(/#$/, '')),
        'Markdown must retain every guide topic',
      );
    }
    const index = await agent.request.get(base + indexPath);
    assert.equal(index.status(), 200);
    for (
      const match of (await index.text()).matchAll(
        /\]\(https:\/\/radi\.js\.org([^)]*)\)/g,
      )
    ) {
      const response = await agent.request.get(base + match[1]);
      assert.equal(
        response.status(),
        200,
        `Agent index target ${match[1]} must exist`,
      );
      assert.ok((await response.text()).startsWith('#'));
    }
    const background = () =>
      staticPage.evaluate(() => getComputedStyle(document.body).color);
    await staticPage.emulateMedia({ colorScheme: 'light' });
    const lightText = await background();
    const token = staticPage.locator('pre code span').first();
    const lightCode = await token.evaluate((node) =>
      getComputedStyle(node).color
    );
    await staticPage.emulateMedia({ colorScheme: 'dark' });
    assert.notEqual(
      await background(),
      lightText,
      'System dark mode must work without JavaScript',
    );
    assert.notEqual(
      await token.evaluate((node) => getComputedStyle(node).color),
      lightCode,
      'Code highlighting must adapt too',
    );
    await staticPage.emulateMedia({ colorScheme: 'light' });
    assert.equal(await background(), lightText);
    await agent.close();
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
