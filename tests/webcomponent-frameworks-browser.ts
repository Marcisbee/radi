import { createElement as reactElement } from 'npm:react@19.2.0';
import { createRoot as reactRoot } from 'npm:react-dom@19.2.0/client';
import { flushSync } from 'npm:react-dom@19.2.0';
import { createApp, nextTick } from 'npm:vue@3.5.45/dist/vue.esm-browser.js';
import 'npm:@angular/compiler@22.2.5';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from 'npm:@angular/core@22.2.5';
import { bootstrapApplication } from 'npm:@angular/platform-browser@22.2.5';
import { createAbortSignal, createElement, update } from '../src/client.ts';
import { webcomponent } from '../src/webcomponent.ts';

type Configuration = { title: string };
type Detail = { count: number; configuration?: Configuration };
type Props = {
  initialCount?: number;
  configuration?: Configuration;
  disabled?: boolean;
  onChange?: (detail: Detail) => void;
};

function equal(actual: unknown, expected: unknown) {
  if (!Object.is(actual, expected)) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function fixture(name: string) {
  const signals: AbortSignal[] = [];
  customElements.define(
    name,
    webcomponent(function (this: HTMLElement, props: () => Props) {
      signals.push(createAbortSignal(this));
      let count = 0;
      return createElement(
        'button',
        {
          onclick: () => {
            props().onChange?.({
              count: ++count,
              configuration: props().configuration,
            });
            update(this);
          },
        },
        () =>
          `${props().initialCount}:${props().configuration?.title}:${props().disabled}:${count}`,
      );
    }, {
      attributes: {
        initialCount: Number,
        configuration: JSON.parse,
        disabled: Boolean,
      },
      events: { onChange: 'count-change' },
    }),
  );
  const container = document.createElement('div');
  document.body.append(container);
  return { container, signals };
}

function checkInitial(
  container: HTMLElement,
  payloads: Detail[],
  configuration: Configuration,
) {
  const button = container.querySelector('button')!;
  equal(button.textContent, '3:One:true:0');
  button.click();
  equal(payloads.length, 1);
  equal(payloads[0].count, 1);
  equal(payloads[0].configuration, configuration);
  return button;
}

function checkUpdate(
  container: HTMLElement,
  button: HTMLButtonElement,
  signals: AbortSignal[],
) {
  equal(container.querySelector('button'), button);
  equal(button.textContent, '9:Two:false:1');
  equal(signals.length, 1);
  equal(signals[0].aborted, false);
}

function checkUnmount(container: HTMLElement, signals: AbortSignal[]) {
  equal(container.querySelector('button'), null);
  equal(signals[0].aborted, true);
}

function react() {
  const { container, signals } = fixture('radi-react-probe');
  const root = reactRoot(container);
  const configuration = { title: 'One' };
  const payloads: Detail[] = [];
  const receive = (event: CustomEvent<Detail>) => payloads.push(event.detail);
  try {
    flushSync(() =>
      root.render(reactElement('radi-react-probe', {
        initialCount: 3,
        configuration,
        disabled: true,
        'oncount-change': receive,
      }))
    );
    const button = checkInitial(container, payloads, configuration);
    flushSync(() =>
      root.render(reactElement('radi-react-probe', {
        initialCount: 9,
        configuration: { title: 'Two' },
        disabled: false,
        'oncount-change': receive,
      }))
    );
    checkUpdate(container, button, signals);
    root.unmount();
    checkUnmount(container, signals);
  } finally {
    container.remove();
  }
}

async function vue() {
  const { container, signals } = fixture('radi-vue-probe');
  const payloads: Detail[] = [];
  const app = createApp({
    data: () => ({ count: 3, configuration: { title: 'One' }, disabled: true }),
    methods: {
      receive: (event: CustomEvent<Detail>) => payloads.push(event.detail),
    },
    template:
      '<radi-vue-probe :initial-count="count" :configuration="configuration" :disabled="disabled" @count-change="receive" />',
  });
  app.config.compilerOptions.isCustomElement = (tag: string) =>
    tag.startsWith('radi-');
  const state = app.mount(container);
  try {
    const button = checkInitial(container, payloads, state.configuration);
    state.count = 9;
    state.configuration = { title: 'Two' };
    state.disabled = false;
    await nextTick();
    checkUpdate(container, button, signals);
    app.unmount();
    checkUnmount(container, signals);
  } finally {
    container.remove();
  }
}

async function angular() {
  const { container, signals } = fixture('radi-angular-probe');
  const payloads: Detail[] = [];
  class Harness {
    count = 3;
    configuration = { title: 'One' };
    disabled = true;
    receive(event: CustomEvent<Detail>) {
      payloads.push(event.detail);
    }
  }
  Component({
    selector: 'angular-harness',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template:
      '<radi-angular-probe [initialCount]="count" [configuration]="configuration" [disabled]="disabled" (count-change)="receive($event)" />',
  })(Harness);
  container.append(document.createElement('angular-harness'));
  const app = await bootstrapApplication(Harness);
  const component = app.components[0];
  const state = component.instance as Harness;
  try {
    const button = checkInitial(container, payloads, state.configuration);
    state.count = 9;
    state.configuration = { title: 'Two' };
    state.disabled = false;
    component.changeDetectorRef.detectChanges();
    checkUpdate(container, button, signals);
    app.destroy();
    checkUnmount(container, signals);
  } finally {
    container.remove();
  }
}

react();
await vue();
await angular();
Object.assign(globalThis, { webcomponentTestResult: { total: 3, failed: 0 } });
