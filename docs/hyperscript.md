## Hyperscript

`h` is a helper function for `document.createElement` with couple of differences.
The basic idea is to simply create elements with `h` and mount them with `mount`, almost like you would do with plain JavaScript:

```js
import { h, mount } from 'radi';

const hello = h('h1', {}, 'Hello Radi!');

mount(hello, document.body);
```

This would append `h1` tag with text `Hello Radi!` to body tag:

```html
<body>
  <h1>Hello Radi!</h1>
</body>
```

There are couple of ways to make this more syntactically friendly:

#### 1. Using JSX

Like in React we can use JSX in Radi too. Just change pragma from `React.createElement` to `Radi.h` (or just `h` if you have that function in scope) and we're good to go.

```jsx
/** @jsx h **/
import { h, mount } from 'radi';

const hello = <h1>Hello Radi!</h1>;

mount(hello, document.body);
```

#### 2. Using HTM ([more info](https://github.com/developit/htm))

It's similar to JSX, but with some differences. Most importantly, it can be used without compilation or bundling.

```js
import htm from 'htm';
import { h, mount } from 'radi';

const html = htm.bind(h);

const hello = html`<h1>Hello Radi!</h1>`;

mount(hello, document.body);
```
