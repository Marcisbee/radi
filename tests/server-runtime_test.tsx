/** @jsxImportSource radi/server */
import { strict as assert } from 'node:assert';
import {
  createComment,
  createElement as h,
  Fragment,
  renderToReadableStream,
  renderToString,
  renderToStringAsync,
} from '../src/server.ts';
import { jsxDEV } from '../src/server/jsx-runtime.ts';
import { createRenderer, createServerStringAdapter } from '../src/server.ts';

Deno.test('custom universal server adapters still render roots and dispose subscriptions without DOM globals', () => {
  const renderer = createRenderer(createServerStringAdapter());
  let cleaned = false;
  const tree = renderer.createElement('p', null, {
    subscribe(emit: (value: string) => void) {
      emit('value');
      return () => {
        cleaned = true;
      };
    },
  });
  assert.equal(renderer.renderToString!(tree), '<p><!--$-->value</p>');
  assert.equal(renderer.renderToString!('root'), 'root');
  assert.equal(cleaned, true);
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

Deno.test('server imports and renders roots, JSX, props and escaped HTML without DOM globals', () => {
  assert.equal(
    renderToString(['<&"', 0, true, null]),
    '&lt;&amp;&quot;0<!--true--><!--null-->',
  );
  const Child = (props: () => { label: string }) => <b>{props().label}</b>;
  const tree = (
    <section>
      {[
        <Child label='ok' />,
        h(
          Fragment,
          null,
          jsxDEV(
            'input',
            { disabled: true, onClick: 'unsafe', key: 'x' },
            undefined,
            false,
          ),
        ),
        h(
          'p',
          { className: 'a', title: '<&"', style: { fontSize: '12px' } },
          'text',
        ),
      ]}
    </section>
  );
  assert.equal(
    renderToString(tree),
    '<section><host><b>ok</b></host><input disabled=""><p class="a" title="&lt;&amp;&quot;" style="font-size: 12px;">text</p></section>',
  );
  assert.equal(
    renderToString(createComment('--><script>')),
    '<!--&#45;&#45;&gt;&lt;script&gt;-->',
  );
  assert.throws(
    () => renderToString(h('div><script', null)),
    /Invalid HTML tag/,
  );
  assert.throws(
    () => renderToString(h('div', { 'x" onclick': 'bad' })),
    /Invalid HTML attribute/,
  );
});

Deno.test('samples first subscription value and cleans up both supported cleanup forms', async () => {
  for (const objectCleanup of [false, true]) {
    let cleaned = 0;
    const source = {
      subscribe(emit: (value: string) => void) {
        emit('first');
        emit('second');
        const cleanup = () => {
          cleaned++;
        };
        return objectCleanup ? { unsubscribe: cleanup } : cleanup;
      },
    };
    assert.equal(
      await renderToStringAsync(h('p', null, source)),
      '<p><!--$-->first</p>',
    );
    assert.equal(cleaned, 1);
  }
  let cleaned = false;
  assert.equal(
    renderToString({
      subscribe() {
        return () => {
          cleaned = true;
        };
      },
    }),
    '<!--$--><!--null-->',
  );
  assert.equal(cleaned, true);
});

Deno.test('async components preserve order, children and error fallback; sync API rejects async input', async () => {
  const Async = async (props: () => Record<string, unknown>) =>
    h('b', null, props().children as string[]);
  const Broken = async () => {
    throw new Error('failure');
  };
  assert.equal(
    await renderToStringAsync(
      h('main', null, h(Async, null, 'A'), h(Broken, null), 'Z'),
    ),
    '<main><host><b>A</b></host><host>ERROR:Broken</host>Z</main>',
  );
  assert.throws(
    () => renderToString(Promise.resolve('later')),
    /Async content requires/,
  );
  await assert.rejects(
    renderToStringAsync(Promise.reject(new Error('rejected child'))),
    /rejected child/,
  );
});

Deno.test('stream applies backpressure and cancellation stops unevaluated siblings', async () => {
  let evaluated = 0;
  const waiting = deferred<string>();
  const stream = renderToReadableStream(
    h(
      'main',
      null,
      waiting.promise,
      h(() => {
        evaluated++;
        return 'tail';
      }, null),
    ),
  );
  const reader = stream.getReader();
  assert.equal(evaluated, 0);
  assert.equal(new TextDecoder().decode((await reader.read()).value), '<main>');
  const pendingRead = reader.read();
  await reader.cancel();
  await pendingRead;
  waiting.resolve('late');
  await Promise.resolve();
  assert.equal(evaluated, 0);
});

Deno.test('large streaming text preserves Unicode across chunks without evaluating the whole page', async () => {
  let evaluated = 0;
  const text = 'a'.repeat(16383) + '😀'.repeat(20000);
  const reader = renderToReadableStream(h(
    'main',
    null,
    text,
    h(() => {
      evaluated++;
      return 'tail';
    }, null),
  )).getReader();
  const decoder = new TextDecoder();
  const first = await reader.read();
  assert.equal(evaluated, 0);
  let html = decoder.decode(first.value, { stream: true });
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    html += decoder.decode(next.value, { stream: true });
  }
  html += decoder.decode();
  assert.equal(html, `<main>${text}<host>tail</host></main>`);
  assert.equal(evaluated, 1);
});

Deno.test('HTTP response sends shell before async content settles and completes valid ordered HTML', async () => {
  const waiting = deferred<string>();
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen() {} },
    () =>
      new Response(
        renderToReadableStream(
          h('main', null, 'shell', waiting.promise, h('footer', null, 'end')),
        ),
        { headers: { 'content-type': 'text/html; charset=utf-8' } },
      ),
  );
  try {
    const response = await fetch(`http://127.0.0.1:${server.addr.port}`, {
      signal: AbortSignal.timeout(3000),
    });
    const reader = response.body!.getReader();
    const first = new TextDecoder().decode((await reader.read()).value);
    assert.equal(first, '<main>shell');
    waiting.resolve('async <value>');
    let rest = '';
    const decoder = new TextDecoder();
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      rest += decoder.decode(next.value, { stream: true });
    }
    assert.equal(
      first + rest,
      '<main>shellasync &lt;value&gt;<footer>end</footer></main>',
    );
  } finally {
    waiting.resolve('done');
    await server.shutdown();
  }
});
