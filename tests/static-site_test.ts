import { strict as assert } from 'node:assert';
import { chromium } from 'npm:playwright@1.56.1';
import { generateStaticSite } from '../src/static.ts';
import { createElement as h } from '../src/server.ts';
import {
  buildStaticExample,
  serveStaticExample,
} from '../examples/static-site.ts';

Deno.test('static generation resolves content, escapes metadata and awaits storage', async () => {
  const writes = new Map<string, string>();
  let stored = false;
  const paths = await generateStaticSite([
    {
      path: '/',
      title: '<Docs>',
      render: async () => h('h1', null, 'Welcome'),
    },
    {
      path: '/guide/ā/',
      title: 'Guide',
      lang: 'lv',
      head: h('link', { rel: 'stylesheet', href: '/style.css' }),
      bootstrap: '/client.js',
      render: () => {
        assert.equal(stored, true);
        return h('p', null, () => 'Build-time value');
      },
    },
  ], async (path, html) => {
    await Promise.resolve();
    writes.set(path, html);
    stored = true;
  });
  assert.deepEqual(paths, ['index.html', 'guide/ā/index.html']);
  const home = writes.get('index.html')!;
  assert.ok(home.startsWith('<!doctype html><html lang="en">'));
  assert.ok(home.includes('<title>&lt;Docs&gt;</title>'));
  assert.ok(home.includes('<body><h1>Welcome</h1></body>'));
  assert.ok(!home.includes('<script'));
  const guide = writes.get('guide/ā/index.html')!;
  assert.ok(guide.includes('lang="lv"'));
  assert.ok(guide.includes('<link rel="stylesheet" href="/style.css">'));
  assert.ok(guide.includes('<script src="/client.js"></script></head><body>'));
  assert.ok(guide.includes('Build-time value'));
});

Deno.test('invalid or colliding routes fail before rendering or writing', async () => {
  for (
    const routes of [
      ['/', '/../escape'],
      ['/', '/a/../../escape'],
      ['/', '//host'],
      ['/', '/a\\b'],
      ['/', '/a\u0000b'],
      ['/', '/%2e%2e'],
      ['/', '/a?x'],
      ['/', '/a#x'],
      ['/', 'relative'],
      ['/guide', '/guide/'],
      ['/', '/a//b'],
    ]
  ) {
    let touched = false;
    await assert.rejects(() =>
      generateStaticSite(
        routes.map((path) => ({
          path,
          title: 'Page',
          render: () => {
            touched = true;
            return 'content';
          },
        })),
        () => {
          touched = true;
        },
      ), TypeError);
    assert.equal(touched, false);
  }
});

Deno.test('storage failures stop generation and reach the build caller', async () => {
  const failure = new Error('Storage unavailable');
  let secondRendered = false;
  await assert.rejects(() =>
    generateStaticSite([
      { path: '/', title: 'First', render: () => 'first' },
      {
        path: '/next',
        title: 'Next',
        render: () => {
          secondRendered = true;
          return 'next';
        },
      },
    ], () => Promise.reject(failure)), (error) => error === failure);
  assert.equal(secondRendered, false);
});

Deno.test('generated files serve readable pages and independently resumable islands', async () => {
  const outDir = await Deno.makeTempDir();
  let server: ReturnType<typeof serveStaticExample> | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let release = () => {};
  try {
    await buildStaticExample(outDir);
    server = serveStaticExample(outDir, 0);
    const address = `http://127.0.0.1:${server.addr.port}`;
    browser = await chromium.launch({ headless: true });
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const readable = await noScript.newPage();
    await readable.goto(`${address}/guide/`);
    assert.equal(
      await readable.locator('h1').textContent(),
      'Interactive guide',
    );
    assert.deepEqual(await readable.locator('output').allTextContents(), [
      '0',
      '10',
    ]);
    await noScript.close();

    const page = await browser.newPage();
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(address);
    assert.ok(!requests.some((url) => url.endsWith('.js')));
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/resumption-handler.js', async (route) => {
      await gate;
      await route.continue();
    });
    await page.getByRole('link', { name: 'Interactive guide' }).click();
    assert.ok(!requests.some((url) => url.endsWith('resumption-handler.js')));
    const original = await page.locator('#static-content, button, output')
      .elementHandles();
    const loading = page.waitForRequest('**/resumption-handler.js');
    await page.getByRole('button').nth(0).click();
    await loading;
    await page.getByRole('button').nth(0).click();
    await page.getByRole('button').nth(1).click();
    assert.deepEqual(await page.locator('output').allTextContents(), [
      '0',
      '10',
    ]);
    release();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('output')].map((node) => node.textContent)
        .join(',') === '2,11'
    );
    for (const node of original) {
      assert.equal(await node.evaluate((node) => node.isConnected), true);
    }
    await page.reload();
    assert.deepEqual(await page.locator('output').allTextContents(), [
      '0',
      '10',
    ]);
  } finally {
    release();
    await browser?.close();
    await server?.shutdown();
    await Deno.remove(outDir, { recursive: true });
  }
});
