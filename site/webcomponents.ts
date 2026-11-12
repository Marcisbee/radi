import { createElement as h } from '../src/server.ts';
import { code, section } from './ui.ts';

export const webcomponents = section(
  'web-components',
  'Web Components',
  h(
    'p',
    null,
    'Use radi/webcomponent to register an existing Radi component as a native custom element. Components keep their typed props and callbacks; the adapter handles HTML attribute conversion, JavaScript properties, and custom events.',
  ),
  code(
    'Register a counter',
    `import { update } from 'radi';
import { webcomponent } from 'radi/webcomponent';

type Props = {
  label?: string;
  initialCount?: number;
  onChange?: (count: number) => void;
};

function Counter(this: HTMLElement, props: () => Props) {
  let count = props().initialCount ?? 0;
  return <button onclick={() => {
    count++;
    props().onChange?.(count);
    update(this);
  }}>
    {() => (props().label ?? 'Count') + ': ' + count}
  </button>;
}

const RadiCounter = webcomponent(Counter, {
  attributes: { label: String, initialCount: Number },
  events: { onChange: 'count-change' },
});
customElements.define('radi-counter', RadiCounter);`,
  ),
  code(
    'Use from HTML',
    `<radi-counter label="Clicks" initial-count="5"></radi-counter>
<script>
  const counter = document.querySelector('radi-counter');
  counter.addEventListener('count-change', event => {
    console.log(event.detail); // 6 on the first click
  });
  counter.setAttribute('label', 'Total');
</script>`,
    'html',
  ),
  h(
    'p',
    null,
    'Register once in the browser before your application renders the element. The component runs once per connection. Read changing props inside reactive functions. In this example initialCount initializes local state; changing it later does not reset the count.',
  ),
  h('h3', null, 'Convert attributes at the boundary'),
  code(
    'Converter map',
    `attributes: {
  label: String,
  initialCount: Number,
  disabled: Boolean,
  configuration: JSON.parse,
  path: (value: string) => value.split('.'),
}`,
  ),
  h(
    'p',
    null,
    'CamelCase prop names map to kebab-case attributes: initialCount reads initial-count. Converters run once per attribute change. Missing attributes yield undefined without calling the converter, except Boolean, which uses presence: even disabled="false" means true; removing it means false. Number follows JavaScript conversion rules, including empty string to 0 and invalid text to NaN. A throwing converter leaves the last valid prop intact and the browser reports the error; a later valid attribute change recovers.',
  ),
  h('h3', null, 'Pass JavaScript values directly'),
  code(
    'Typed properties',
    `const counter = new RadiCounter();
counter.initialCount = 10;
counter.label = 'Total';
counter.onChange = count => console.log(count);
document.body.append(counter);

// Replace all JavaScript overrides together:
counter.props = { label: 'Updated' };
counter.props = {}; // Return to converted attribute values`,
  ),
  h(
    'p',
    null,
    'Names declared in attributes or events expose typed DOM properties. Assignments preserve objects and callbacks without serialization, update the shared props object, and override attributes. Getters return the override when present, otherwise the converted attribute value. Assigning undefined is an explicit override; omit its key from a replacement props object to restore the attribute fallback. Mutating an object in place does not trigger an update. No values are reflected back into HTML attributes.',
  ),
  h(
    'p',
    null,
    'Properties assigned before registration survive upgrade, including detached elements upgraded through customElements.upgrade(). Individual properties win over the props object during upgrade. Supply required values before connecting or provide component defaults. Names that collide with native element APIs or adapter lifecycle methods are rejected; use the props object for those component inputs.',
  ),
  h('h3', null, 'Expose callbacks as DOM events'),
  h(
    'p',
    null,
    'An explicit events map connects a callback prop to an exact event name. Calling onChange(6) emits count-change with detail: 6. Multiple arguments become a detail array; no arguments produce null. Events bubble, cross shadow boundaries, and are non-cancelable. A supplied JavaScript callback also runs after dispatch and its return value reaches the component. Without that callback the bridge returns undefined. Native DOM events continue to bubble normally.',
  ),
  h('h3', null, 'Use with other frameworks'),
  code(
    'React 19',
    `<radi-counter initialCount={5}
  oncount-change={event => console.log(event.detail)} />`,
  ),
  code(
    'Vue 3',
    `<radi-counter :initial-count="5" @count-change="handleChange" />`,
    'html',
  ),
  code(
    'Angular',
    `<radi-counter [initialCount]="5" (count-change)="handleChange($event)" />`,
    'html',
  ),
  h(
    'p',
    null,
    'Configure Vue compilerOptions.isCustomElement to recognize your tag, or CUSTOM_ELEMENTS_SCHEMA on the consuming Angular component/module. Register before framework rendering so property detection preserves non-string values. JSX/template type checking may require application-side element and event types. The handler receives a CustomEvent; read detail for the payload.',
  ),
  h(
    'p',
    null,
    'Integration tests exercise React 19.2.0, Vue 3.5.45, and Angular 22.2.5 in Chromium: typed number, boolean, and object bindings, events, state-preserving updates, and unmount cleanup.',
  ),
  h('h3', null, 'Lifecycle and limits'),
  h(
    'p',
    null,
    'Give the custom element an empty host: rendering uses light DOM and replaces existing children. Page styles apply; there is no shadow-root, slot, or form-association API. Disconnect runs cleanup; reconnect creates a fresh component while retaining props and attributes. Framework moves that disconnect/reconnect therefore reset local state. The component’s this remains its Radi host.',
  ),
  h(
    'p',
    null,
    'SSR/hydration, cross-document adoption, Firefox, and WebKit are not verified. This is tested client-side integration, not a general standards certification. The existing Radi renderer still uses its internal <host> wrapper. Importing radi/webcomponent itself does not require a DOM or register any elements.',
  ),
);
