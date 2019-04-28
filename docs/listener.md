## Listener

**NOTE:**  Radi has a [babel transformer plugin](https://github.com/radi-js/babel-plugin-transform-radi-listen) for listeners to be handled automatically (just like transformation from JSX to [hyperscript](#hyperscript)).

Listeners watch for changes in the state of the assigned component and if changes happen it is responsible for re-rendering that part of view and updating it in DOM.
Listener expects to receive component that it should listen to and path of state to listen to.

```jsx
const personStore = Radi.store({
  person: {
    name: 'John'
  }
})
...
<h1>{ Radi.listen(personStore, (state) => state.person.name) }</h1>
```

Listeners can also do some processing with that state value.

```jsx
<h1>{ Radi.listen(countStore, (count) => count + 50) }</h1>
```
