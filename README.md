# Radi

Radi is a lightweight reactive JSX runtime that lets you write components as
plain functions with direct DOM manipulation — no virtual DOM required.

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

1. Fork and clone
2. Install dependencies
3. Run tests: `deno task test`
4. Open a PR with a concise description

## License

MIT
