## Headless Components

Components can also be registered as headless (without view). These are components that live in other components as contained mixins and handle logic, events and rendering. This is useful for plugins that handle global data and some logic.

```js
import { action, headless, Component } from 'radi';

class GlobalComponent extends Component {
  state() {
    return {
      count: 0
    }
  }

  @action tick() {
    return {
      count: this.state.count + 1
    }
  }

  on() {
    return {
      mount() {
        setInterval(() => {
          this.tick()
        })
      }
    }
  }
}

headless('myGlobalComponent', GlobalComponent)
```

Now that we registered headless component it can be accessed by every component with dollar sign + handle name `this.$myGlobalComponent`.

```jsx
<h1>{ listen(this.$myGlobalComponent, 'count') }</h1>
```

This will output `GlobalComponent` state.count output.
