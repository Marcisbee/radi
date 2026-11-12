import { assert, test } from 'jsr:@marcisbee/rion@0.5/test';
import { createAbortSignal, createElement, update } from '../src/client.ts';
import { webcomponent } from '../src/webcomponent.ts';

test('custom elements render HTML attributes and reactive JavaScript props without losing local state', () => {
  function Counter(this: HTMLElement, props: () => { label?: string | null }) {
    let count = 0;
    return createElement('button', {
      onclick: () => {
        count++;
        update(this);
      },
    }, () => `${props().label ?? 'Count'}: ${count}`);
  }
  const Element = webcomponent(Counter, { attributes: { label: String } });
  customElements.define('radi-test-counter', Element);
  const container = document.createElement('div');
  container.innerHTML =
    '<radi-test-counter label="Clicks"></radi-test-counter>';
  document.body.append(container);
  const element = container.firstElementChild as InstanceType<typeof Element>;
  try {
    const button = element.querySelector('button')!;
    assert.equal(button.textContent, 'Clicks: 0');
    button.click();
    element.setAttribute('label', 'Total');
    assert.equal(button.textContent, 'Total: 1');
    element.props = { label: 'JS' };
    assert.equal(button.textContent, 'JS: 1');
    element.props = {};
    element.removeAttribute('label');
    assert.equal(button.textContent, 'Count: 1');
    assert.equal(element.querySelector('button'), button);
  } finally {
    container.remove();
  }
});

test('upgrades pre-definition props, cleans up on removal and mounts fresh on reconnection', () => {
  const element = document.createElement('radi-test-upgrade') as HTMLElement & {
    props: { value: { name: string } };
  };
  element.props = { value: { name: 'Before definition' } };
  document.body.append(element);
  const signals: AbortSignal[] = [];
  customElements.define(
    'radi-test-upgrade',
    webcomponent(function (
      this: HTMLElement,
      props: () => { value?: { name: string } },
    ) {
      signals.push(createAbortSignal(this));
      return () => props().value?.name;
    }),
  );
  assert.equal(element.textContent, 'Before definition');
  element.remove();
  assert.equal(signals[0].aborted, true);
  element.props = { value: { name: 'Reconnected' } };
  document.body.append(element);
  try {
    assert.equal(element.textContent, 'Reconnected');
    assert.equal(signals.length, 2);
    assert.equal(signals[1].aborted, false);
  } finally {
    element.remove();
  }
  assert.equal(signals[1].aborted, true);
});

test('converts attributes once per change and preserves valid props after parser errors', () => {
  type Props = {
    initialCount?: number;
    enabled?: boolean;
    config?: { title: string };
    path?: string[];
  };
  let reads = 0;
  let current: Props = {};
  const Element = webcomponent(function (props: () => Props) {
    return () => {
      current = props();
      return `${
        current.initialCount ?? 'default'
      }:${current.enabled}:${current.config?.title}:${current.path?.join('/')}`;
    };
  }, {
    attributes: {
      initialCount: Number,
      enabled: Boolean,
      config: JSON.parse,
      path: (value) => {
        reads++;
        return value.split('.');
      },
    },
  });
  customElements.define('radi-test-converters', Element);
  const element = new Element();
  element.setAttribute('initial-count', '4');
  element.setAttribute('enabled', 'false');
  element.setAttribute('config', '{"title":"Hello"}');
  element.setAttribute('path', 'a.b');
  document.body.append(element);
  try {
    assert.equal(element.textContent, '4:true:Hello:a/b');
    const path = current.path;
    element.setAttribute('initial-count', '5');
    assert.equal(current.path, path);
    assert.equal(reads, 1);
    let errors = 0;
    const onError = (event: ErrorEvent) => {
      errors++;
      event.preventDefault();
    };
    window.addEventListener('error', onError);
    try {
      element.setAttribute('config', '{broken');
    } finally {
      window.removeEventListener('error', onError);
    }
    assert.equal(errors, 1);
    assert.equal(current.config?.title, 'Hello');
    element.setAttribute('config', '{"title":"Recovered"}');
    element.removeAttribute('initial-count');
    element.removeAttribute('enabled');
    element.removeAttribute('path');
    assert.equal(element.textContent, 'default:false:Recovered:undefined');
    assert.equal(reads, 1);
    element.props = { initialCount: 9, config: { title: 'JS' } };
    assert.equal(element.textContent, '9:false:JS:undefined');
    element.remove();
    document.body.append(element);
    assert.equal(element.textContent, '9:false:JS:undefined');
  } finally {
    element.remove();
  }
});

test('bridges callback payloads to host events while preserving JS callbacks and native bubbling', () => {
  type Props = {
    onChange?: (value: number) => string | undefined;
    onPair?: (a: string, b: number) => void;
    onReady?: () => void;
  };
  let result: string | undefined;
  const Element = webcomponent(function (props: () => Props) {
    return createElement('button', {
      onclick: () => {
        result = props().onChange?.(7);
        props().onPair?.('value', 8);
        props().onReady?.();
      },
    }, 'Emit');
  }, {
    events: { onChange: 'value-change', onPair: 'pair', onReady: 'ready' },
  });
  customElements.define('radi-test-events', Element);
  const container = document.createElement('div');
  const element = new Element();
  const payloads: unknown[] = [];
  let clicks = 0;
  let callbacks = 0;
  element.onChange = (value) => {
    callbacks += value;
    return 'returned';
  };
  for (const name of ['value-change', 'pair', 'ready']) {
    container.addEventListener(name, (event) => {
      assert.equal(event.target, element);
      assert.equal(event.composed, true);
      payloads.push((event as CustomEvent).detail);
    });
  }
  container.addEventListener('click', () => clicks++);
  container.append(element);
  document.body.append(container);
  try {
    element.querySelector('button')!.click();
    assert.equal(JSON.stringify(payloads), '[7,["value",8],null]');
    assert.equal(result, 'returned');
    assert.equal(callbacks, 7);
    assert.equal(clicks, 1);
    element.remove();
    element.props = {};
    container.append(element);
    element.querySelector('button')!.click();
    assert.equal(payloads.length, 6);
    assert.equal(callbacks, 7);
    assert.equal(result, undefined);
  } finally {
    container.remove();
  }
});

test('individual properties survive upgrade and update typed props without attribute serialization', () => {
  type Props = { initialCount?: number; configuration?: { title: string } };
  const element = Object.assign(
    document.createElement('radi-test-properties'),
    {
      initialCount: 4,
      configuration: { title: 'Before definition' },
    },
  );
  const detached = Object.assign(
    document.createElement('radi-test-properties'),
    {
      initialCount: 6,
      configuration: { title: 'Detached' },
    },
  );
  element.setAttribute('initial-count', '2');
  document.body.append(element);
  const Element = webcomponent(
    (props: () => Props) => () =>
      `${props().initialCount}:${props().configuration?.title}`,
    {
      attributes: { initialCount: Number, configuration: JSON.parse },
    },
  );
  customElements.define('radi-test-properties', Element);
  customElements.upgrade(detached);
  detached.initialCount = 7;
  document.body.append(detached);
  try {
    assert.equal(detached.textContent, '7:Detached');
    assert.equal(element.textContent, '4:Before definition');
    element.initialCount = 8;
    element.configuration = { title: 'Updated' };
    assert.equal(element.textContent, '8:Updated');
    assert.equal(element.getAttribute('initial-count'), '2');
    assert.equal(element.hasAttribute('configuration'), false);
    (element as InstanceType<typeof Element>).props = {};
    assert.equal(element.initialCount, 2);
    assert.equal(element.textContent, '2:undefined');
  } finally {
    element.remove();
    detached.remove();
  }
});

test('rejects property declarations that would overwrite element APIs', () => {
  for (const prop of ['props', 'remove', 'connectedCallback', 'constructor']) {
    let rejected = false;
    try {
      webcomponent(() => '', { attributes: { [prop]: String } });
    } catch (error) {
      rejected = error instanceof TypeError;
    }
    assert.equal(rejected, true);
  }
});

Object.assign(globalThis, { webcomponentTestResult: await test.run() });
