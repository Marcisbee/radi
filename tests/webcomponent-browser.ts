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
  const Element = webcomponent(Counter, { attributes: ['label'] });
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

Object.assign(globalThis, { webcomponentTestResult: await test.run() });
