## Components

Simply define a class or function that extends `Radi.Component`. It can have `state` method that returns [state object](#state), `view` method that returns [view data](#view) and any other methods that can be decorated as [action](#actions). State can also be defined inside `constructor` as simple object. But `view` must always be method.

```jsx
const up = Radi.action('Increment')

const store = Radi.store(0)
  .on(up, (state) => state + 1)

function Counter({
  state: Radi.listen(store)
}) {
  return [
    <h1>{state.count}</h1>,
    <button onclick={up}>+</button>
  ]
}

```
