## Actions

One of the ways to change state is with actions. Every action is regular class method that has been decorated with `@action` decorator. It must return state changes to modify state.

```js
const rename = Radi.action('Rename');
```

State is always immutable. Do not mutate it without returning state change in action. DOM will not be re-rendered that way.
