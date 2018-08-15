# <a href='http://radi.js.org'><img src='https://rawgit.com/radi-js/radi/gh-pages/logo/radijs-github.png' height='60' alt='Radi' aria-label='Redux.js.org' /></a>

**Radi** is a tiny javascript framework.

It's built quite differently from any other framework. It doesn't use any kind of diffing algorithm nor virtual dom which makes it really fast.

With Radi you can create any kind of single-page applications or more complex applications.

[![npm version](https://img.shields.io/npm/v/radi.svg?style=flat-square)](https://www.npmjs.com/package/radi)
[![npm downloads](https://img.shields.io/npm/dm/radi.svg?style=flat-square)](https://www.npmjs.com/package/radi)
[![gzip bundle size](http://img.badgesize.io/https://unpkg.com/radi@latest/dist/radi.es.min.js?compression=gzip&style=flat-square)](https://unpkg.com/radi@latest/dist/radi.js)
[![radi workspace on slack](https://img.shields.io/badge/slack-radijs-3eb891.svg?style=flat-square)](https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ)


## Installation

To install the stable version:

```
npm install --save radi
```

This assumes you are using [npm](https://www.npmjs.com/) as your package manager.  

If you're not, you can [access these files on unpkg](https://unpkg.com/radi/dist/), download them, or point your package manager to them.

#### Browser Compatibility

Radi.js currently is compatible with browsers that support at least ES5.

## Ecosystem

| Project | Status | Description |
|---------|--------|-------------|
| [radi-router]          | [![radi-router-status]][radi-router-package] | Single-page application routing |
| [radi-fetch]          | [![radi-fetch-status]][radi-fetch-package] | HTTP client for Radi.js |

[radi-router]: https://github.com/radi-js/radi-router

[radi-router-status]: https://img.shields.io/npm/v/radi-router.svg?style=flat-square

[radi-router-package]: https://npmjs.com/package/radi-router

[radi-fetch]: https://github.com/radi-js/radi-fetch

[radi-fetch-status]: https://img.shields.io/npm/v/radi-fetch.svg?style=flat-square

[radi-fetch-package]: https://npmjs.com/package/radi-fetch

## Documentation

[Getting started guide](/docs)

Here are just a few examples to work our appetite.

#### Hello World example

Lets create component using JSX, tho it's not mandatory
we can just use hyperscript `r('h1', 'Hello', this.sample, '!')`. I'm using JSX for html familiarity and to showcase compatibility.

```jsx
/** @jsx Radi.r **/

class Hello extends Radi.component {
  state() {
    return { sample: 'World' };
  }
  view() {
    return (
      <h1>Hello { this.state.sample } !</h1>
    )
  }
}

Radi.mount(<Hello />, document.body);
```

This example will mount h1 to body like so `<body><h1>Hello World</h1></body>`

#### Counter example (With Single File Component syntax)

This will be different as we'll need to update state and use actions. Only actions can change state and trigger changes in DOM.
Also we'll be using our SFC syntax for `*.radi` files

`Counter.radi`
```jsx
class {
  state = {
    count: 0
  }

  @action up() {
    return {
      count: this.state.count +1
    }
  }

  @action down() {
    return {
      count: this.state.count -1
    }
  }
}

<div>
  <h1>{ this.state.count }</h1>

  <button onclick={ () => this.down() } disabled={ this.state.count <= 0 }>-</button>

  <button onclick={ () => this.up() }>+</button>
</div>
```

## Architecture

Radi fully renders page only once initially. After that `listeners` take control. They can listen for state changes in any Radi component. When change in state is caught, listener then re-renders only that part.

Other frameworks silently re-renders whole page over and over again, then apply changes. But radi only re-renders parts that link to changed state values.

To check out [live repl](https://radi.js.org/#/fiddle) and [docs](https://radi.js.org/#/docs), visit [radi.js.org](https://radi.js.org).

<!-- ## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/radi-js/radi/releases). -->

## Stay In Touch

- [Twitter](https://twitter.com/radi_js)
- [Slack](https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, Marcis (Marcisbee) Bergmanis
