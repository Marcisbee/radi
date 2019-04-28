## Hyperscript

`r` is a helper for `document.createElement` with couple of differences.
The basic idea is to simply create elements with `r` and mount them with `mount`, almost like you would do with plain JavaScript:

```js
import { h, mount } from 'radi';

const hello = h('h1', {}, 'Hello Radi!');

mount(hello, document.body);
```

```html
<body>
  <h1>Hello Radi!</h1>
</body>
```
