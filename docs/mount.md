## Mount

Mount is a function that will mount anything that [view](#view) returns ([Hyperscript](#hyperscript)/JSX nodes, DOM Nodes, Component or Array of these three) to any DOM node. This is how we mount our Apps root component to DOM.

```jsx
import { h, mount } from 'radi';

function MyComponent() {
  ...
}

mount(<MyComponent />, document.body)
```
