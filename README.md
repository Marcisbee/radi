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

[radi-router]: https://github.com/radi-js/radi-router

[radi-router-status]: https://img.shields.io/npm/v/radi-router.svg?style=flat-square

[radi-router-package]: https://npmjs.com/package/radi-router

## Documentation

[Getting started guide](/docs)

Here are just a few examples to work our appetite.

#### Hello World example

Lets create component using JSX, tho it's not mandatory
we can just use hyperscript `h('h1', 'Hello', this.sample, '!')`. I'm using JSX for html familiarity and to showcase compatibility.

```jsx
/** @jsx Radi.h **/

function Hello() {
  return <h1>Hello World !</h1>
}

Radi.mount(<Hello />, document.body);
```

This example will mount h1 to body like so `<body><h1>Hello World</h1></body>`

#### Counter example

This will be different as we'll need to update state and use actions. Only actions can change state and trigger changes in DOM.

```jsx
/** @jsx Radi.h **/

const changeCount = Radi.action('Change Count');

const store = Radi.store(0)
  .schema(Number)
  .on(changeCount, (count, by) => count + by);

function Counter(
  count = Radi.listen(store),
) {
  return (
    <div>
      <h1>{ count }</h1>
      <button
        onclick={ () => changeCount(-1) }
        disabled={ count(state => state <= 0) }>-</button>
      <button
        onclick={ () => changeCount(1) }>+</button>
    </div>
  )
}
```

To check out [live repl](https://radi.js.org/#/fiddle) and [docs](https://radi.js.org/#/docs), visit [radi.js.org](https://radi.js.org).

## Changelog

Detailed changes for each release are documented in the [release notes](https://radi.js.org/#/changelog).

## Stay In Touch

- [Twitter](https://twitter.com/radi_js)
- [Slack](https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, Marcis (Marcisbee) Bergmanis
