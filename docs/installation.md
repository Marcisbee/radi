## Installation

Install with npm or Yarn.

```
npm i radi
```

Then with a module bundler like [Rollup](https://rollupjs.org/) or [Webpack](https://webpack.js.org/), use as you would anything else.

```js
import { h, mount } from "radi"
```

If you don't want to set up a build environment, you can download Radi from a CDN like [unpkg.com](https://unpkg.com/radi@latest/dist/radi.min.js) and it will be globally available through the window.Radi object. We support all ES5-compliant browsers, including Internet Explorer 11 and above.

```html
<script src="https://unpkg.com/radi@latest/dist/radi.min.js"></script>
<script>
  const { h, mount } = Radi;
  ...
</script>
```
