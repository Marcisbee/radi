## Plugin

Plugin is a function that expects a callback function that takes current Radi scope as first argument. This way we can register plugins easily to the current scope of Radi.

```js
import plugin from 'radi'

const myCoolPlugin = _radi => {
  // Your plugins logic here
  // create _radi.Component, make it headless, sky is the limit
  // can also return anyhing
  return {
    mom: 'hi'
  }
}

const { mom } = plugin(myCoolPlugin)
// mom = 'hi'
```
