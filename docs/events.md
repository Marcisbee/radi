## Events

Events are part of `on` method in every Component. It can also be defined inside `constructor` as simple object. Every method that is part of it is event handler. Every event can also be an [action](#actions).

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
import { action, Component } from 'radi';

class Grandma extends Component {
  state() {
    return {
      status: 'busy'
    }
  }

  on() {
    return {
      callGrandma(whatToSay) {
        console.log('Grandma is ', this.state.status, 'try to say', whatToSay, 'again later')
      }
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

### Global event handling

Coming Soon
