## Components

Simply define a class or function that extends `Radi.Component`. It can have `state` method that returns [state object](#state), `view` method that returns [view data](#view) and any other methods that can be decorated as [action](#actions). State can also be defined inside `constructor` as simple object. But `view` must always be method.

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
