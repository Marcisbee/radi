import { strict as assert } from 'node:assert';
import { chromium } from 'npm:playwright@1.64.1';
import type {} from '../src/devtools.ts';

type Target = { url: string; webSocketDebuggerUrl: string };
type Reply = { id: number; error?: unknown; result: Record<string, unknown> };

async function until<T>(
  read: () => Promise<T>,
  accept: (value: T) => boolean,
): Promise<T> {
  const deadline = Date.now() + 10000;
  while (true) {
    const value = await read();
    if (accept(value)) return value;
    if (Date.now() > deadline) {
      throw new Error(
        `Timed out waiting for browser state: ${JSON.stringify(value)}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function freePort() {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const port = listener.addr.port;
  listener.close();
  return port;
}

async function connect(url: string) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map<number, (reply: Reply) => void>();
  socket.onmessage = (event) => {
    const reply: Reply = JSON.parse(event.data);
    pending.get(reply.id)?.(reply);
    pending.delete(reply.id);
  };
  async function send(method: string, params = {}) {
    const id = ++nextId;
    const reply = new Promise<Reply>((resolve) => pending.set(id, resolve));
    socket.send(JSON.stringify({ id, method, params }));
    const result = await reply;
    assert.equal(result.error, undefined);
    return result.result;
  }
  return {
    send,
    close: () => socket.close(),
    evaluate: async (expression: string) => {
      const result = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      assert.equal(
        result.exceptionDetails,
        undefined,
        JSON.stringify(result.exceptionDetails),
      );
      return (result.result as { value: unknown }).value;
    },
  };
}

const clickTab = (label: string) =>
  `(function walk(root) {
  for (const el of root.querySelectorAll('*')) {
    if (el.getAttribute('role') === 'tab' && el.getAttribute('aria-label') === ${
    JSON.stringify(label)
  }) {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); el.click(); return true;
    }
    if (el.shadowRoot && walk(el.shadowRoot)) return true;
  }
  return false;
})(document)`;

Deno.test('unpacked Chrome panel inspects and profiles a real Radi app across lifecycle changes', async () => {
  const port = freePort();
  const debugPort = freePort();
  const process = new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', 'examples/devtools/serve.ts'],
    env: { PORT: String(port) },
    stdout: 'null',
    stderr: 'null',
  }).spawn();
  const url = `http://127.0.0.1:${port}`;
  const extension = new URL('../extensions/chrome', import.meta.url).pathname;
  const connections: Awaited<ReturnType<typeof connect>>[] = [];
  await Deno.mkdir('dist', { recursive: true });
  const profile = await Deno.makeTempDir({ dir: 'dist', prefix: 'devtools-' });
  let context;
  try {
    await until(async () => {
      try {
        const response = await fetch(url);
        await response.body?.cancel();
        return response.ok;
      } catch {
        return false;
      }
    }, Boolean);
    context = await chromium.launchPersistentContext(profile, {
      headless: false,
      channel: 'chromium',
      viewport: { width: 1440, height: 900 },
      args: [
        `--remote-debugging-port=${debugPort}`,
        '--auto-open-devtools-for-tabs',
        `--disable-extensions-except=${extension}`,
        `--load-extension=${extension}`,
      ],
    });
    const page = context.pages()[0];
    await page.goto(url);
    const targets = async (): Promise<Target[]> =>
      await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    const all = await until(
      targets,
      (items) => items.some((item) => item.url.startsWith('devtools://')),
    );
    const frontend = await connect(
      all.find((item) => item.url.startsWith('devtools://'))!
        .webSocketDebuggerUrl,
    );
    connections.push(frontend);
    await until(() => frontend.evaluate(clickTab('Elements')), Boolean);
    // Playwright omits DevTools pages; use CDP to dock the real browser UI and select its tab.
    await frontend.evaluate(`(async () => {
      const UI = await import('./ui/legacy/legacy.js');
      UI.DockController.DockController.instance().setDockSide('bottom');
    })()`);
    await until(() => frontend.evaluate(clickTab('Radi')), Boolean);
    const panels = await until(
      targets,
      (items) => items.some((item) => item.url.endsWith('/panel.html')),
    );
    const panel = await connect(
      panels.find((item) => item.url.endsWith('/panel.html'))!
        .webSocketDebuggerUrl,
    );
    connections.push(panel);
    const text = (id: string) =>
      panel.evaluate(
        `document.getElementById(${JSON.stringify(id)}).textContent`,
      );
    const click = (selector: string) =>
      panel.evaluate(
        `document.querySelector(${JSON.stringify(selector)}).click()`,
      );
    await until(() => text('status'), (value) => value === 'Connected');
    assert.match(String(await text('tree')), /App.*Counter/s);
    await click('[aria-label="Collapse App"]');
    assert.doesNotMatch(String(await text('tree')), /Counter/);
    await panel.evaluate(
      `document.getElementById('filter').value = 'Counter'; document.getElementById('filter').dispatchEvent(new Event('input'))`,
    );
    assert.match(String(await text('tree')), /Counter/);
    await panel.evaluate(
      `document.getElementById('filter').value = ''; document.getElementById('filter').dispatchEvent(new Event('input'))`,
    );
    await click('[aria-label="Expand App"]');
    await panel.evaluate(
      `[...document.querySelectorAll('.node')].find(e => e.textContent.startsWith('Counter')).click()`,
    );
    await until(
      () => text('details'),
      (value) => String(value).includes('label'),
    );
    assert.match(String(await text('details')), /"Counter"/);
    await click('#highlight');
    await page.waitForFunction(() =>
      [...document.documentElement.children].some((el) =>
        (el as HTMLElement).style.zIndex === '2147483647'
      )
    );
    await page.getByRole('button', { name: 'Increment', exact: true }).click({
      timeout: 1000,
    });
    assert.equal(await page.locator('#count').textContent(), 'Count: 1');
    await click('[data-view="layers"]');
    await panel.evaluate(
      `[...document.querySelectorAll('.node')].find(e => e.textContent.startsWith('Counter')).click()`,
    );
    await until(() => text('selection'), (value) => value === 'Counter');
    assert.match(String(await text('tree')), /Reactive expression/);
    await panel.evaluate(
      `document.getElementById('filter').value = 'section'; document.getElementById('filter').dispatchEvent(new Event('input'))`,
    );
    assert.match(String(await text('tree')), /^section/);
    await panel.evaluate(
      `document.getElementById('filter').value = ''; document.getElementById('filter').dispatchEvent(new Event('input'))`,
    );
    await click('#record');
    await until(() => text('status'), (value) => value === 'Recording renders');
    await page.getByRole('button', { name: 'Increment', exact: true }).click();
    assert.equal(await page.locator('#count').textContent(), 'Count: 2');
    await click('[data-view="performance"]');
    await until(
      () => text('tree'),
      (value) => String(value).includes('update'),
    );
    await page.getByRole('button', { name: 'Remount', exact: true }).click();
    await until(
      () => text('tree'),
      (value) => /Counter\s*mount/.test(String(value)),
    );
    const screenshot = Deno.env.get('DEVTOOLS_SCREENSHOT');
    if (screenshot) {
      await panel.evaluate(
        `[...document.querySelectorAll('.node')].find(e => e.textContent.startsWith('Counter')).click()`,
      );
      await until(() => text('selection'), (value) => value === 'Counter');
      await frontend.evaluate(
        `(async () => { const UI = await import('./ui/legacy/legacy.js'); UI.DockController.DockController.instance().setDockSide('undocked'); })()`,
      );
      await frontend.send('Emulation.setDeviceMetricsOverride', {
        width: 1100,
        height: 720,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
      const result = await frontend.send('Page.captureScreenshot', {
        format: 'png',
      });
      await Deno.writeFile(
        screenshot,
        Uint8Array.from(
          atob(String(result.data)),
          (char) => char.charCodeAt(0),
        ),
      );
    }
    await click('[data-view="layers"]');
    await panel.evaluate(
      `document.querySelector('#breadcrumbs button').click()`,
    );
    await until(() => text('selection'), (value) => value === 'App');
    await panel.evaluate(
      `[...document.querySelectorAll('.node')].find(e => e.textContent.startsWith('Counter')).click()`,
    );
    await until(() => text('selection'), (value) => value === 'Counter');
    const lightBackground = await panel.evaluate(
      'getComputedStyle(document.body).backgroundColor',
    );
    await frontend.evaluate(
      `(async () => { const Common = await import('./core/common/common.js'); Common.Settings.Settings.instance().moduleSetting('ui-theme').set('dark'); })()`,
    );
    await until(
      () => panel.evaluate('getComputedStyle(document.body).backgroundColor'),
      (value) => value !== lightBackground,
    );
    if (screenshot) {
      const layers = await frontend.send('Page.captureScreenshot', {
        format: 'png',
      });
      await Deno.writeFile(
        `${screenshot}.layers.png`,
        Uint8Array.from(
          atob(String(layers.data)),
          (char) => char.charCodeAt(0),
        ),
      );
    }
    await click('[data-view="performance"]');
    if (await text('status') !== 'Recording renders') await click('#record');
    await until(() => text('status'), (value) => value === 'Recording renders');
    await page.evaluate(() => {
      for (let index = 0; index < 600; index++) {
        document.querySelector<HTMLButtonElement>('.counter button')!.click();
      }
    });
    await until(
      () => text('metrics'),
      (value) => String(value).startsWith('500 recorded'),
    );
    assert.match(
      String(await text('notice')),
      /[1-9]\d* older calls discarded/,
    );
    await click('#clear');
    await until(
      () => text('metrics'),
      (value) => String(value).startsWith('0 recorded'),
    );
    await frontend.evaluate(clickTab('Elements'));
    await page.waitForFunction(() =>
      !window.__RADI_DEVTOOLS__!.snapshot().recording
    );
    await until(() => frontend.evaluate(clickTab('Radi')), Boolean);
    await click('[data-view="components"]');
    await page.getByRole('button', { name: 'Unmount', exact: true }).click();
    await until(
      () => text('metrics'),
      (value) => String(value).startsWith('0 components'),
    );
    await page.getByRole('button', { name: 'Disable bridge', exact: true })
      .click();
    await until(
      () => text('status'),
      (value) => value === 'Radi bridge not detected',
    );
    await page.getByRole('button', { name: 'Enable bridge', exact: true })
      .click();
    await page.getByRole('button', { name: 'Remount', exact: true }).click();
    await until(
      () => text('tree'),
      (value) => String(value).includes('Counter'),
    );
    await page.reload();
    await until(() => text('status'), (value) => value === 'Connected');
    await until(
      () => text('tree'),
      (value) => String(value).includes('Counter'),
    );
    assert.equal(await text('selection'), 'Select a component');
  } finally {
    for (const connection of connections) connection.close();
    await context?.close();
    process.kill('SIGTERM');
    await process.status;
    await Deno.remove(profile, { recursive: true });
  }
});
