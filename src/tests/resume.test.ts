import { assert, test } from '@marcisbee/rion/test';
import {
  createElement as h,
  renderToString,
  resumable,
  resumeClick,
} from '../server.ts';
import { resume } from '../resume.ts';
import type { ResumeHandler } from '../resume.ts';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
function fixture(state = { count: 0 }) {
  const root = document.createElement('div');
  root.innerHTML = renderToString(resumable(state, [
    h(
      'button',
      { type: 'button', ...resumeClick('increment') },
      h('b', null, 'Increment'),
    ),
    h('output', null, String(state.count)),
  ]));
  document.body.append(root);
  return root;
}
const increment: ResumeHandler = ({ state, boundary }) => {
  const counter = state as { count: number };
  boundary.querySelector('output')!.firstChild!.nodeValue = String(
    ++counter.count,
  );
};

test('early clicks load once, run in order and retain server DOM and state', async () => {
  const root = fixture({ count: 7 });
  const button = root.querySelector('button')!;
  const output = root.querySelector('output')!;
  const text = output.firstChild;
  let resolve!: (handler: ResumeHandler) => void;
  let loads = 0;
  const stop = resume(root, {
    increment: () => {
      loads++;
      return new Promise((done) => {
        resolve = done;
      });
    },
  });
  try {
    assert.equal(loads, 0);
    root.querySelector('b')!.click();
    button.click();
    await tick();
    assert.equal(output.textContent, '7');
    resolve(increment);
    await tick();
    assert.equal(output.textContent, '9');
    assert.equal(loads, 1);
    assert.equal(root.querySelector('button'), button);
    assert.equal(root.querySelector('output')!.firstChild, text);
    button.click();
    await tick();
    assert.equal(output.textContent, '10');
  } finally {
    stop();
    root.remove();
  }
});

test('waits for streamed boundary completion and isolates boundary state', async () => {
  const root = fixture();
  const second = fixture({ count: 10 });
  root.append(second);
  const marker = root.querySelector('template')!;
  marker.remove();
  const stop = resume(root, { increment: async () => increment });
  try {
    root.querySelector('button')!.click();
    second.querySelector('button')!.click();
    await tick();
    assert.equal(root.querySelector('output')!.textContent, '0');
    assert.equal(second.querySelector('output')!.textContent, '11');
    root.firstElementChild!.append(marker);
    await tick();
    assert.equal(root.querySelector('output')!.textContent, '1');
  } finally {
    stop();
    root.remove();
  }
});

test('caps pending clicks, reports load failure, retries and cancels on disposal', async () => {
  const root = fixture();
  const errors: unknown[] = [];
  let reject!: (error: Error) => void;
  let loads = 0;
  const stop = resume(root, {
    increment: () => {
      loads++;
      return loads === 1
        ? new Promise((_done, fail) => {
          reject = fail;
        })
        : Promise.resolve(increment);
    },
  }, {
    maxPending: 1,
    onError: (error) => {
      errors.push(error);
    },
  });
  try {
    root.querySelector('button')!.click();
    root.querySelector('button')!.click();
    await tick();
    assert.equal(errors.length, 1);
    reject(new Error('offline'));
    await tick();
    assert.equal(errors.length, 2);
    root.querySelector('button')!.click();
    await tick();
    assert.equal(root.querySelector('output')!.textContent, '1');
    stop();
    root.querySelector('button')!.click();
    await tick();
    assert.equal(root.querySelector('output')!.textContent, '1');
  } finally {
    stop();
    root.remove();
  }
});

test('disposal and detached targets prevent queued delivery', async () => {
  for (const dispose of [true, false]) {
    const root = fixture();
    let resolve!: (handler: ResumeHandler) => void;
    let calls = 0;
    const stop = resume(root, {
      increment: () =>
        new Promise((done) => {
          resolve = done;
        }),
    });
    root.querySelector('button')!.click();
    await tick();
    if (dispose) stop();
    else root.querySelector('button')!.remove();
    resolve(() => {
      calls++;
    });
    await tick();
    assert.equal(calls, 0);
    stop();
    root.remove();
  }
});

test('unregistered keys keep native behavior and state cannot create executable markup', async () => {
  const root = fixture();
  root.innerHTML = renderToString(
    resumable(
      { text: '"><script>throw 1</script>&' },
      h('a', { href: '#native', ...resumeClick('toString') }, 'Link'),
    ),
  );
  const stop = resume(root, {});
  try {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    root.querySelector('a')!.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
    assert.equal(root.querySelector('script'), null);
    assert.equal(
      JSON.parse(root.firstElementChild!.getAttribute('data-radi-state')!).text,
      '"><script>throw 1</script>&',
    );
  } finally {
    stop();
    root.remove();
  }
});

test('stream timeout and malformed state report errors without executing a handler', async () => {
  for (const invalidState of [true, false]) {
    const root = fixture();
    if (invalidState) {
      root.firstElementChild!.setAttribute('data-radi-state', '{');
    } else root.querySelector('template')!.remove();
    let calls = 0;
    let reported!: () => void;
    const error = new Promise<void>((resolve) => {
      reported = resolve;
    });
    const stop = resume(root, {
      increment: async () => () => {
        calls++;
      },
    }, {
      timeout: 10,
      onError: reported,
    });
    try {
      root.querySelector('button')!.click();
      await error;
      assert.equal(calls, 0);
    } finally {
      stop();
      root.remove();
    }
  }
});

test('queued async handlers see replacement state and preserve event information', async () => {
  const root = fixture();
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  const seen: number[] = [];
  const stop = resume(root, {
    increment: async () => async (context) => {
      const state = context.state as { count: number };
      seen.push(state.count);
      assert.equal(context.event.shiftKey, true);
      assert.equal(context.element, root.querySelector('button'));
      if (state.count === 0) await waiting;
      context.state = { count: state.count + 1 };
    },
  });
  try {
    for (const _ of [1, 2]) {
      root.querySelector('button')!.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          shiftKey: true,
        }),
      );
    }
    await tick();
    assert.equal(seen.length, 1);
    release();
    await tick();
    assert.equal(seen.join(','), '0,1');
  } finally {
    release();
    stop();
    root.remove();
  }
});

test('disposer stays idempotent after a new runtime is installed on the same root', async () => {
  const root = fixture();
  const first = resume(root, {});
  first();
  const second = resume(root, { increment: async () => increment });
  try {
    first();
    let rejected = false;
    try {
      resume(root, {});
    } catch {
      rejected = true;
    }
    assert.equal(rejected, true);
    root.querySelector('button')!.click();
    await tick();
    assert.equal(root.querySelector('output')!.textContent, '1');
  } finally {
    second();
    root.remove();
  }
});

await test.run();
