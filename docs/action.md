## Actions

Action is just a function that has a string name and can be assigned to store for state changes.

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
