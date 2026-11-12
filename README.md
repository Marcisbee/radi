# Radi

Radi is a lightweight reactive JSX runtime that lets you write components as
plain functions with direct DOM manipulation — no virtual DOM required.

## Start a project

With Node.js 22+ installed, choose a starter:

```sh
npm create radi@latest -- my-app --template spa
npm create radi@latest -- my-server --template ssr
npm create radi@latest -- my-site --template ssg
npm create radi@latest -- my-go-app --template go
```

Then enter the generated directory, run `npm install`, and run `npm run dev`.
Open `http://127.0.0.1:3000`. The generator refuses nonempty directories and
never installs dependencies automatically. Use `npm create radi@latest -- --help` for syntax.

| Template | Result | Production build |
| --- | --- | --- |
| `spa` | Browser-rendered app with a reactive counter | Static `dist/` |
| `ssr` | Node HTTP server rendering HTML per request | `dist/` plus npm dependencies |
| `ssg` | Two pages generated at build time | Static `dist/` |
| `go` | Go HTTP server rendering TSX in embedded V8 | Standalone `server` binary |

The Go starter additionally requires Linux amd64 with glibc, Go 1.26.10,
Clang 21, and CGO. Follow its generated README before building.
All starters include `npm run build` and `npm start`; their READMEs explain
editing, previewing, and deployment. The generator and templates ship inside
the `create-radi` npm package, published alongside the matching Radi release.

Radi also supports synchronous server rendering and ordered async HTML streaming.
See [server rendering](docs/server-rendering.md) for APIs, runtime examples,
limitations, and reproducible performance measurements.

For a Go HTTP server with embedded V8, async Flop access and TSX components,
see [the Go adapter](docs/go-server.md).

For lazy interactions on existing server DOM, see [resumption](docs/resumption.md).
Explicit boundaries carry JSON state and load named handlers on the first click.

For documentation and other static sites with interactive islands, see
[static site generation](docs/static-sites.md).

For SPA navigation, lazy route modules, loaders, and actions, see
[client routing and route data](docs/routing.md).

## Web Components

Import `webcomponent` from `radi/webcomponent` to turn a Radi component into
a native custom-element class:

```tsx
import { update } from 'radi';
import { webcomponent } from 'radi/webcomponent';

function Counter(this: HTMLElement, props: () => {
  label?: string;
  initialCount?: number;
  onChange?: (value: number) => void;
}) {
  let count = props().initialCount ?? 0;
  return (
    <button onclick={() => { count++; props().onChange?.(count); update(this); }}>
      {() => `${props().label ?? 'Count'}: ${count}`}
    </button>
  );
}

const RadiCounter = webcomponent(Counter, {
  attributes: { label: String, initialCount: Number },
  events: { onChange: 'count-change' },
});
customElements.define('radi-counter', RadiCounter);
```

Use `<radi-counter label="Clicks" initial-count="5"></radi-counter>` in HTML, or create an
instance with `new RadiCounter()` and append it to the document. Listed
prop names map to kebab-case HTML attributes (`initialCount` → `initial-count`).
The adapter converts strings before passing them to the component. Converters
run once per attribute change, preserving object identity between changes.
The map accepts `String`, `Number`, `Boolean`, `JSON.parse`, or custom functions:

```ts
attributes: {
  label: String,
  initialCount: Number,
  disabled: Boolean,
  someConfiguration: JSON.parse,
  someStructure: (value: string) => value.split('.'),
}
```

Missing or removed attributes yield `undefined` without invoking the converter,
so component defaults still work. `Boolean` is special: presence means `true`
(even `disabled="false"`), absence means `false`. `Number` uses JavaScript's
conversion rules, including empty string → `0` and invalid text → `NaN`.
Use a custom converter for validation or different semantics. If a converter
throws, the browser reports the callback error and the last successfully
converted prop is retained (or `undefined` before any success). The DOM attribute
still contains the invalid text; a subsequent valid change recovers normally.
Omitted `attributes` means no attribute props are observed. Conversion is one-way;
JavaScript props are not serialized back to attributes.

Assign `element.props = { label: 'Total' }` for JavaScript values, including
objects and callbacks. These props override attributes. Assign a new object
to update them; mutating the existing object does not trigger an update.
Use `element.props = {}` to return to attribute values. Props assigned before
registration are preserved when the browser upgrades the element. Supply
required props before connecting the element, or provide component defaults.

Every name declared in `attributes` or `events` also gets a typed DOM property:

```ts
const element = new RadiCounter();
element.initialCount = 5;
element.label = 'Total';
element.onChange = (count) => console.log(count);
document.body.append(element);
```

Property assignments preserve JavaScript values and update the shared `props`
object. Getters return a JavaScript override when present, otherwise the converted
attribute value. Replacing `element.props` also replaces overrides made through
individual properties. Assigning `undefined` is an explicit override; omit that
key from a new `props` object to restore the attribute fallback. Neither property
assignments nor `props` assignments reflect into HTML attributes. Properties set
before registration survive upgrade, including explicit `customElements.upgrade()`
on detached elements. If both an individual property and `props` were assigned
before upgrade, the individual property wins. Names that conflict with native
element APIs or adapter lifecycle methods are rejected; pass such component props
through the `props` object instead of declaring them as attributes or events.

Map component callback props to DOM event names with `events`. For example,
calling `props().onChange?.(count)` above emits `count-change` on the custom element:

```js
element.addEventListener('count-change', (event) => console.log(event.detail));
```

These are bubbling, composed, non-cancelable `CustomEvent`s. One callback argument
becomes `detail`; multiple arguments become an array; no arguments produce `null`
(the platform default). Event names are used exactly as supplied. A JavaScript
callback supplied through `element.props` is also called with the original
arguments, after event dispatch, and its return value is returned to the component.
Without a JavaScript callback, the bridge returns `undefined`. No callback names
are guessed, and native DOM events continue bubbling normally. To cancel an
operation, use the component's existing callback contract through JavaScript props;
`preventDefault()` on a bridged event does not cancel the callback.

The component runs once per connection. Read props inside reactive functions,
as with ordinary Radi components. Attribute and prop updates preserve local
component state. Removal runs Radi disconnect cleanup; reconnection creates a
fresh component instance while retaining the element's props and attributes.

Rendering uses light DOM and replaces the element's existing children. Page
styles apply normally; this adapter does not create a shadow root or slots.
The component's `this` remains its ordinary Radi host. Native bubbling events
reach the custom element. Register each name once, in a browser; importing the
module itself does not require a DOM and does not register any elements.

### Framework interoperability

Register the element before the framework renders it so property detection can
preserve objects and other non-string values. Use an empty custom-element host;
do not give it children owned by the surrounding framework.

| Framework | Property and event binding |
| --- | --- |
| React 19 | `<radi-counter initialCount={5} oncount-change={e => console.log(e.detail)} />` |
| Vue 3 | `<radi-counter :initial-count="5" @count-change="handleChange" />` |
| Angular | `<radi-counter [initialCount]="5" (count-change)="handleChange($event)" />` |

Vue requires the tag to match `compilerOptions.isCustomElement`. Angular requires
`CUSTOM_ELEMENTS_SCHEMA` on the consuming component or module. TypeScript JSX or
template checking may additionally require application-side element/event types.
Event handlers receive a `CustomEvent`; read its `detail` for the callback payload.

`deno task test:webcomponent` exercises real React 19.2.0, Vue 3.5.45, and Angular
22.2.5 in Chromium: number, boolean, and object bindings; custom events; reactive
updates preserving component state; and unmount cleanup. The tests also cover
direct browser usage and pre-registration property upgrades.

This is client-rendered integration, not a general standards certification.
Framework list moves that disconnect/reconnect the element reset local state.
SSR/hydration, cross-document adoption, Firefox, and WebKit are not verified.
There is no shadow-root/slot or form-association API. The underlying Radi renderer
still uses its existing `<host>` wrapper; this adapter does not change that markup.

## What Makes Radi Different

Radi takes a unique approach compared to React, Preact, or even Solid:

| Feature | React/Preact | Solid | Radi |
|---------|--------------|-------|------|
| Virtual DOM | Yes | No | No |
| Props | Object | Object | **Function** `() => props` |
| Component execution | Every render | Once | **Once** |
| Reactivity | Implicit (re-render all) | Signals | **Explicit functions** |
| Update mechanism | Scheduler | Signals | **Native DOM events** |

### Props Are Functions

In Radi, components receive props as a getter function, not a plain object:

```ts
function Greeting(props: JSX.Props<{ name: string }>) {
  // Access props by calling the function
  return <h1>Hello, {() => props().name}!</h1>;
}
```

This enables fine-grained reactivity — when parent state changes, only the
specific reactive expressions that read props will update.

### Components Are Stateful (Run Once)

Component functions execute exactly once. The returned JSX is the component's
template. State lives in closure variables:

```ts
function Counter(this: ComponentNode) {
  // This code runs once when the component mounts
  let count = 0;

  return (
    <button onclick={() => { count++; update(this); }}>
      {() => `Count: ${count}`}
    </button>
  );
}
```

### Reactive Places Are Functions

Wrap any expression in a function to make it reactive. When `update()` is called
on an ancestor, these functions re-execute:

```ts
const view = (
  <div>
    {/* Static — never updates */}
    <span>Static text</span>

    {/* Reactive — re-runs on update */}
    <span>{() => dynamicValue}</span>

    {/* Reactive prop */}
    <input value={() => inputValue} />
  </div>
);
```

### Updates Use Native Events

Radi uses native DOM events (`update`, `connect`, `disconnect`) instead of a
custom scheduler. Call `update(node)` to trigger reactive re-evaluation:

```ts
function Timer() {
  let seconds = 0;
  const el = <div>{() => seconds}</div>;

  setInterval(() => {
    seconds++;
    update(el); // Dispatches native "update" event
  }, 1000);

  return el;
}
```

## Features

- Direct DOM manipulation with minimal abstraction
- Fine-grained reactivity via functions
- Lightweight component model with closures for state
- Fragment support (`<Fragment>` or `<>...</>`)
- Lifecycle events (`connect`, `disconnect`)
- AbortSignal helpers tied to element lifecycle
- Suspense boundaries for async components
- Keyed lists for efficient reconciliation
- TypeScript automatic JSX runtime support

## Installation

```bash
# Deno
deno add jsr:@Marcisbee/radi

# npm
npm install radi
```

## Basic Usage

```ts
import { createRoot, update } from 'radi';

function App() {
  let count = 0;

  const root = (
    <div>
      <h1>Counter App</h1>
      <p>Count: {() => count}</p>
      <button onclick={() => { count++; update(root); }}>
        Increment
      </button>
    </div>
  );

  return root;
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
```

## Component Anatomy

```ts
function MyComponent(
  this: ComponentNode,           // Host element (the <host> tag)
  props: JSX.Props<{ value: number }> // Props getter function
) {
  // 1. Setup code runs once
  const signal = createAbortSignal(this);

  // 2. Event handlers
  this.addEventListener('connect', () => {
    console.log('Component mounted');
  }, { signal });

  // 3. Return JSX template
  return (
    <div>
      {/* Reactive expression */}
      {() => props().value * 2}
    </div>
  );
}
```

## Fragments

```ts
const list = (
  <>
    <li>First</li>
    <li>Second</li>
  </>
);
```

## Reactive Children

Any function passed as a child is treated as a reactive generator:

```ts
const time = () => new Date().toLocaleTimeString();

const clock = <div>The time is: {time}</div> as HTMLElement;
setInterval(() => update(clock), 1000);
```

## Reactive Props

Props can also be reactive functions:

```ts
let isDisabled = false;

const button = (
  <button disabled={() => isDisabled}>
    Click me
  </button>
) as HTMLElement;

// Later...
isDisabled = true;
update(button);
```

## Lifecycle Events

Elements receive `connect` / `disconnect` events when added/removed from the
document:

```ts
const node = (
  <div
    onconnect={() => console.log('connected')}
    ondisconnect={() => console.log('disconnected')}
  />
);
```

## AbortSignal Helpers

Automatically clean up event listeners and subscriptions:

```ts
function Component(this: HTMLElement) {
  const signal = createAbortSignal(this);

  // Automatically removed when component disconnects
  window.addEventListener('resize', handleResize, { signal });

  return <div>...</div>;
}
```

For cleanup on update or disconnect:

```ts
const signal = createAbortSignalOnUpdate(element);
// Aborts when element updates OR disconnects
```

## Memoization

Skip re-computation when values haven't changed:

```ts
const expensiveChild = memo(
  () => <ExpensiveComponent data={data} />,
  () => data === previousData // Return true to skip update
);
```

## Keyed Lists

For efficient list reconciliation:

```ts
import { createList, createKey } from 'radi';

function TodoList(props: () => { items: Todo[] }) {
  return (
    <ul>
      {() => createList((key) =>
        props().items.map((item) =>
          key(() => <TodoItem item={item} />, item.id)
        )
      )}
    </ul>
  );
}
```

Single keyed elements preserve state across updates:

```ts
{() => createKey(() => <Editor />, activeTabId)}
// Editor remounts only when activeTabId changes
```

## Async Components & Suspense

Radi supports async components with Suspense boundaries:

```ts
import { Suspense, suspend, unsuspend } from 'radi';

// Async component using Promises
async function UserProfile(props: JSX.Props<{ userId: number }>) {
  const response = await fetch(`/api/users/${props().userId}`);
  const user = await response.json();

  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// Wrap in Suspense for loading state
const app = (
  <Suspense fallback={() => <div>Loading...</div>}>
    <UserProfile userId={123} />
  </Suspense>
);
```

Manual suspend/unsuspend for custom async work:

```ts
function DataLoader(this: HTMLElement) {
  let data = null;

  suspend(this);
  fetchData().then((result) => {
    data = result;
    unsuspend(this);
    update(this);
  });

  return <div>{() => data ? renderData(data) : null}</div>;
}
```

## TypeScript JSX Configuration

### Automatic Runtime (Recommended)

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "radi"
  }
}
```

For development with extra source metadata:

```json
{
  "compilerOptions": {
    "jsx": "react-jsxdev",
    "jsxImportSource": "radi"
  }
}
```

### Manual Mode

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "createElement",
    "jsxFragmentFactory": "Fragment"
  }
}
```

Then import manually:

```ts
import { createElement, Fragment } from 'radi';
```

## API Reference

### Rendering

- `createRoot(target)` — Create a render root
- `root.render(element)` — Render into the root
- `root.unmount()` — Unmount and cleanup

### Reactivity

- `update(node)` — Trigger reactive updates on node and descendants
- `memo(fn, shouldMemo)` — Memoize reactive expressions

### Lists

- `createList(fn)` — Create keyed list for efficient diffing
- `createKey(renderFn, key)` — Create single keyed element

### Lifecycle

- `createAbortSignal(node)` — AbortSignal that fires on disconnect
- `createAbortSignalOnUpdate(node)` — AbortSignal that fires on update or disconnect

### Suspense

- `Suspense` — Boundary component with fallback
- `suspend(node)` — Signal async work starting
- `unsuspend(node)` — Signal async work complete

### JSX

- `createElement(type, props, ...children)` — JSX factory
- `Fragment` — Fragment symbol

## Contributing

For reproducible browser performance comparisons with React, Preact, Vue, and
vanilla JavaScript, see [the comparison benchmark suite](benchmarks/README.md).

1. Fork and clone
2. Install dependencies
3. Run tests: `deno task test`
4. Open a PR with a concise description

For publishing to npm, see the [release workflow](.github/RELEASING.md).

## License

MIT
