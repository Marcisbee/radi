# Getting Started

## Installation

Install with npm or Yarn.

```
npm i radi
```

Then with a module bundler like [Rollup](https://rollupjs.org/) or [Webpack](https://webpack.js.org/), use as you would anything else.

```js
import { r, Component, mount } from "radi"
```

If you don't want to set up a build environment, you can download Radi from a CDN like [unpkg.com](https://unpkg.com/radi@latest/dist/radi.min.js) and it will be globally available through the window.Radi object. We support all ES5-compliant browsers, including Internet Explorer 10 and above.

```html
<script src="https://unpkg.com/radi@latest/dist/radi.min.js"></script>
<script>
  const { r, Component, mount } = Radi;
  ...
</script>
```

## Hyperscript

`r` is a helper for `document.createElement` with couple of differences.
The basic idea is to simply create elements with `r` and mount them with `mount`, almost like you would do with plain JavaScript:

```js
import { r, mount } from 'radi';

const hello = r('h1', {}, 'Hello Radi!');

mount(hello, document.body);
```

```html
<body>
  <h1>Hello Radi!</h1>
</body>
```

## Components

Simply define a class or function that extends `Radi.Component`. It can have `state` method that returns [state object](#state), `view` method that returns [view data](#view) and any other methods that can be decorated as [actions](#actions). State can also be defined inside `constructor` as simple object. But `view` must always be method.

```jsx
import { r, l, action, Component } from 'radi';

class Counter extends Component {
  state() {
    return {
      count: 0
    }
  }
  
  @action
  up() {
    return {
      count: this.state.count + 1
    }
  }
  
  view() {
    return [
      <h1>{ this.state.count }</h1>,
      <button onclick={ () => this.up() }>+</button>
    ]
  }
}

```

## State

State is plain JS object that describes your entire program. Data in it cannot be changed once created, it can only be updated with actions or `setState` method that is part of Component.

```js
this.state = {
  name: 'John'
}
```

## Actions

One of the ways to change state is with actions. Every action is regular class method that has been decorated with `@action` decorator. It must return state changes to modify state.

```js
@action
rename() {
  return {
    name: 'Steve'
  }
}
```

State is always immutable. Do not mutate it without returning state change in action. DOM will not be re-rendered that way.

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

## Listener

**NOTE:**  Radi has a (babel transformer plugin)[https://github.com/radi-js/transform-radi-listen] for listeners to be handled automatically (just like transformation from JSX to [hyperscript](#hyperscript)).

Listeners watch for changes in state for assigned component and if changes happen, it is responsible for re-rendering that part of view and updating it in DOM.
Listener expects to receive component that it should listen to and path of state to listen to.

```jsx
this.state = {
  person: {
    name: 'John'
  }
}
...
<h1>{ listener(this, 'person', 'name') }</h1>
```

Listeners can also do some processing with that state value.

```jsx
<h1>{ listener(this, 'count').process(count => count + 50) }</h1>
```

## Events

Events are part of `on` method in every Component. It can also be defined inside `constructor` as simple object. Every method that is part of it is event handler. Every event can also be [action](#actions).

```js
this.on = {
  buyMilk() {
    if (this.state.milk === 0) {
      console.log('Milk not found')
    } else {
      console.log('Here you go')
    }
  },
  
  @action
  outOfMilk() {
    return {
      milk: 0
    }
  }
}
```

```js
import { r, l, action, Component } from 'radi';

class Grandma extends Component {
  state() {
    return {
      status: 'busy'
    }
  }
  
  on() {
    callGrandma(whatToSay) {
      console.log('Grandma is ', this.state.status, 'try to say', whatToSay, 'again later')
    }
  }
  
  call() {
    this.trigger('callGrandma', 'hello')
  }
}
```

### Component lifecycle

Radi supports lifecycle events for Components. Currently two events are defined: `mount` and `destroy`.

- When Component gets mounted, `mount` gets called.
- If Component gets unmounted and is no longer part of DOM, `destroy` gets called.

```js
this.on = {
  mount() {
    console.log('I just got mounted')
  },
  destroy() {
    console.log('Components view was destroyed, but I can still be mounted again')
  }
}
```

## Headless Components

TODO

## Plugin

TODO

## Mount

TODO
