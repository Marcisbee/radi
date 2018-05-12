## View

View is a function in Component class that returns [Hyperscript](#hyperscript)/JSX nodes, DOM Nodes, Component or Array of these three.

```jsx
this.view() {
  return <h1>Hello World</h1>
}
```

```jsx
this.view() {
  return <MyComponent />
}
```

```jsx
this.view() {
  return [
    <h1></h1>,
    <MyComponent>,
    document.getElementById('foo')
  ]
}
```

View is rendered only once when Component is mounted or re-mounted. This is where Radi differs from other frameworks - it doesn't re render whole view, instead it uses [Listener](#listener) to re-render only necessary parts of DOM.
So if you write logic inside `view` method before return statement, it will NOT be triggered every time something updates.
