# <a href='http://radi.js.org'><img src='https://rawgit.com/radi-js/radi/gh-pages/logo/radijs-github.png' height='60' alt='Radi' aria-label='Redux.js.org' /></a>

**Radi** is a tiny (3kB minified & gzipped) javascript framework.

It's built quite differently from any other framework. It doesn't use any kind of diffing algorithm nor virtual dom which makes it really fast.

With Radi you can create any kind of single-page applications or more complex applications with **no dependencies required!** Oh did I mention that Radi.js is faster than any popular framework? And yes it is.

[![npm version](https://img.shields.io/npm/v/radi.svg?style=flat-square)](https://www.npmjs.com/package/radi)
[![npm downloads](https://img.shields.io/npm/dm/radi.svg?style=flat-square)](https://www.npmjs.com/package/radi)
[![gzip bundle size](http://img.badgesize.io/https://unpkg.com/radi@0.1.1/dist/radi.min.js?compression=gzip&style=flat-square)](https://unpkg.com/radi@0.1.1/dist/radi.js)
[![radi workspace on slack](https://img.shields.io/badge/slack-radijs-3eb891.svg?style=flat-square)](https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ)


## Installation

To install the stable version:

```
npm install --save radi
```

This assumes you are using [npm](https://www.npmjs.com/) as your package manager.  

If you're not, you can [access these files on unpkg](https://unpkg.com/radi/dist/), download them, or point your package manager to them.

#### Browser Compatibility

Radi.js currently is compatible with browsers that support ES6. In stable release v1 it will support ES5 compatible browsers and even some below that, yes - looking at IE8 too.

## Ecosystem

| Project | Status | Description |
|---------|--------|-------------|
| [radi-router]          | [![radi-router-status]][radi-router-package] | Single-page application routing |

[radi-router]: https://github.com/radi-js/radi-router

[radi-router-status]: https://img.shields.io/npm/v/radi-router.svg?style=flat-square

[radi-router-package]: https://npmjs.com/package/radi-router

## Documentation

Documentation is currently being written. For now just a few examples to work our appetite.

#### Hello World example

Lets create component using JSX, tho it's not mandatory
we can just use hyperscript `r('h1', 'Hello', this.sample, '!')`. I'm using JSX for html familiarity and to showcase compatibility.

```jsx
/** @jsx r **/
const { r, mount, component } = radi;

const main = component({
  view: function() {
    return (
      <h1>Hello { this.sample } !</h1>
    )
  },
  state: {
    sample: 'World'
  }
});

mount(new main(), document.body);
```

This example will mount h1 to body like so `<body><h1>Hello World</h1></body>`

[View this example on codepen](https://codepen.io/Marcisbee/pen/MQmOWG?editors=0010)

#### Counter example

This will be different as we'll need to update state and use actions. We'll need to use binder function `l(..)`. It binds any value to real DOM. When something in this function updates, DOM will change too.

```jsx
/** @jsx r **/
const { r, l, mount, component } = radi;

const counter = component({
  view: function() {
    return (
      <div id="app">
        <div class="counter">
          { l(this.counter) }
        </div>
        <div class="buttons">
          <button onclick={ this.down }
            disabled={ l(this.counter <= 0) }>-</button>
          <button onclick={ this.up }>+</button>
        </div>
      </div>
    )
  },
  state: {
    counter: 0
  },
  actions: {
    up() {
      this.counter += 1;
    },
    down() {
      this.counter -= 1;
    }
  }
});

mount(new counter(), document.body);
```

[View this example on codepen](https://codepen.io/Marcisbee/pen/PQmObp?editors=0010). In codepen I use hyperscript instead jsx for more diverse example purpose.

## Architecture

I'm in process of creating some cool examples and diagrams of how exactly Radi works.

<!-- ## Benchmarks

I'm in process of creating some cool examples and diagrams of how exactly Radi works. -->

<!-- To check out [live examples](https://radi.js.org/examples/) and docs, visit [radi.js.org](https://radi.js.org). -->

<!-- ## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/radi-js/radi/releases). -->

## Stay In Touch

- [Twitter](https://twitter.com/radi_js)
- [Slack](https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, Marcis (Marcisbee) Bergmanis
