## Store

Store is reactive variable that holds data (it can be object, array, string, number, etc.). It's immutable, it can only be changed by [actions](action) or [effects](effect).

```js
const nameStore = Radi.store('John Doe')
```

Store must be created outside components and used inside them.
Store can be accessed in multiple ways:

1. To get raw state use `nameStore.getRawState()` => "John Doe"
2. To get [listener](listener) use `Radi.listen(nameStore)` => Listener("John Doe")
3. To get state and trigger component update use `Radi.watch(nameStore)` => "John Doe"

We can listen to state changes with subscriber.

```js
function nameChanged(newState, oldState) {
  console.log(`Name changed from ${oldState} to ${newState}`);
}

nameStore.subscribe(nameChanged);
```

Also we can unsubscribe.

```js
nameStore.unsubscribe(nameChanged);
```

### Getting state in components

#### Using `Radi.watch`

Let's say we want to update `App` component, based on input. We will use `Radi.watch` to re-render component every time stores state changes.

```jsx
const accessStore = Radi.store(false)

function App({
  hasAccess: Radi.watch(accessStore),
}) {
  if (!hasAccess) {
    return (
      <button onclick={() => accessStore.setState(true)}>
        Gain access
      </button>
    )
  }

  return <p>Access granted</p>
}
```

In this example user is provided with a button that says `Gain access`. When the button is clicked, state changes, component reloads and button is replaced with a paragraph saying `Access granted`.

#### Using `Radi.listen`

If we use `Radi.listen` instead of `Radi.watch` component will not fully re-render when state changes.
We can use [Listeners](listener) when there is no need to reload whole component.

```jsx
const increment = Radi.action('Increment')
const countStore = Radi.store(0)
  .on(increment, (state) => state + 1)

function App({
  count: Radi.listen(countStore),
}) {
  console.log('Component rendered');

  return (
    <button onclick={increment}>
      {count}
    </button>
  )
}
```

Now component will render only once. When button is clicked, only text inside button change.
Console will not print "Component rendered" on every button click.

### Updating state

#### Using `.setState()`

State can be updated in multiple ways. We can update state using `.setState()` method in store. This should only be used for when state that's being updated is not complex.

```jsx
const nameStore = Radi.store('John Doe')
nameStore.setState('John Wick');
```

#### Using `.bind`

Or it can be used from helper `.bind()` that adds two way binding to input fields.

```jsx
const nameStore = Radi.store('No one')

function App() {
  return <input type="text" {...nameStore.bind} />
}
```

Bind is a simple object that has two properties `value` and `oninput`. In example above user is presented with input field that says "No one" and when input is changed by used, state updates automatically.

State can also be change by [actions](action) or [effects](effect).

#### Using [actions](action)

We can use actions to change state. First we need to create action and then link it to single store or multiple ones. Actions first argument is current state in store and rest are arguments passed when calling action.

Action must return new state.

```jsx
const changeCount = Radi.action('Change Count')
const countStore = Radi.store(0)
  .on(changeCount, (state, by) => state + by)

function Counter({
  count: Radi.listen(countStore),
}) {
  return (
    <div>
      <h1>{count}</h1>
      <button onclick={() => changeCount(-1)}>-</button>
      <button onclick={() => changeCount(1)}>+</button>
    </div>
  )
}
```

#### Using [effects](effect)

Effects are quite similar to actions but ca

```jsx
const changeCount = Radi.action('Change Count')
const countStore = Radi.store(0)
  .on(changeCount, (state, by) => state + by)

function Counter({
  count: Radi.listen(countStore),
}) {
  return (
    <div>
      <h1>{count}</h1>
      <button onclick={() => changeCount(-1)}>-</button>
      <button onclick={() => changeCount(1)}>+</button>
    </div>
  )
}
```