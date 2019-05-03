## Effects

Effects are like [actions](/action), but it can do stuff on it's own.

This is usefull for fetching data from API or other async work that has `loading`, `done` and `error` states.
We can get state of effect by using `Radi.status()`.

```jsx
const getUsers = Radi.effect('Get Users')
  .use(() => fetch('/users').then((data) => data.json()))

const usersStore = Radi.store(null)
  .on(getUsers.done, (_, data) => data)

function App({
  users: Radi.watch(countStore),
  state: Radi.status(getUsers),
}) {
  return (
    <div>
      <h1>
        {users === null
          ? 'No user loaded'
          : state === 'loading'
            ? 'loading...'
            : users}
      </h1>
      <button onclick={getUsers}>Get users</button>
    </div>
  )
}
```
