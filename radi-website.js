// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({16:[function(require,module,exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],13:[function(require,module,exports) {
var process = require("process");
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() : typeof define === 'function' && define.amd ? define(factory) : factory();
})(this, function () {
  'use strict';

  var GLOBALS = {
    HEADLESS_COMPONENTS: {},
    FROZEN_STATE: false,
    VERSION: '0.3.23',
    // TODO: Collect active components
    ACTIVE_COMPONENTS: {},
    CUSTOM_ATTRIBUTES: {}
  };

  /**
   * @param {*[]} list
   * @returns {*[]}
   */
  var flatten = function flatten(list) {
    return list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
  };

  /**
   * UUID v4 generator
   * https://gist.github.com/jcxplorer/823878
   * @returns {string}
   */
  var generateId = () => {
    var uuid = '';
    for (var i = 0; i < 32; i++) {
      var random = Math.random() * 16 | 0; // eslint-disable-line

      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += '-';
      }
      uuid += (i === 12 ? 4 : i === 16 ? random & 3 | 8 : random).toString(16); // eslint-disable-line
    }
    return uuid;
  };

  var PrivateStore = function PrivateStore() {
    this.store = {};
  };

  /**
   * @param {string} key
   * @param {Listener} listener
   * @param {number} depth
   */
  PrivateStore.prototype.addListener = function addListener(key, listener, depth) {
    if (typeof this.store[key] === 'undefined') {
      this.createItemWrapper(key);
    }
    this.store[key].listeners[depth] = (this.store[key].listeners[depth] || []).filter(item => item.attached);
    this.store[key].listeners[depth].push(listener);

    return listener;
  };

  /**
   * Removes all listeners for all keys
   */
  PrivateStore.prototype.removeListeners = function removeListeners() {
    var o = Object.keys(this.store);
    for (var i = 0; i < o.length; i++) {
      this.store[o[i]].listeners = {};
      this.store[o[i]].value = null;
    }
  };

  /**
   * setState
   * @param {*} newState
   * @returns {*}
   */
  PrivateStore.prototype.setState = function setState(newState) {
    // Find and trigger changes for listeners
    for (var key of Object.keys(newState)) {
      if (typeof this.store[key] === 'undefined') {
        this.createItemWrapper(key);
      }
      this.store[key].value = newState[key];

      this.triggerListeners(key);
    }
    return newState;
  };

  /**
   * createItemWrapper
   * @private
   * @param {string} key
   * @returns {object}
   */
  PrivateStore.prototype.createItemWrapper = function createItemWrapper(key) {
    return this.store[key] = {
      listeners: {},
      value: null
    };
  };

  /**
   * triggerListeners
   * @private
   * @param {string} key
   */
  PrivateStore.prototype.triggerListeners = function triggerListeners(key) {
    var item = this.store[key];
    if (item) {
      var clone = Object.keys(item.listeners).sort().map(key => item.listeners[key].map(listener => listener));

      for (var i = 0; i < clone.length; i++) {
        for (var n = clone[i].length - 1; n >= 0; n--) {
          if (clone[i][n].attached) {
            clone[i][n].handleUpdate(item.value);
          }
        }
      }
    }
  };

  /**
   * @param {*} obj
   * @returns {*}
   */
  var clone = obj => {
    if (typeof obj !== 'object') {
      return obj;
    }
    if (obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(clone);
    }

    /*eslint-disable*/
    // Reverted as currently throws some errors
    var cloned = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = clone(obj[key]);
      }
    }
    /* eslint-enable */

    return cloned;
  };

  var skipInProductionAndTest = fn => {
    if (typeof process === 'undefined' || 'production' === 'production' || 'production' === 'test') {
      return false;
    }
    return fn && fn();
  };

  /* eslint-disable no-param-reassign */
  /* eslint-disable no-shadow */
  /* eslint-disable guard-for-in */
  /* eslint-disable no-restricted-syntax */
  // import fuseDom from '../r/utils/fuseDom';

  var Listener = function Listener(component, ...path) {
    var assign;

    this.component = component;
    assign = path, this.key = assign[0];
    this.path = path.slice(1, path.length);
    this.depth = 0;
    this.attached = true;
    this.processValue = value => value;
    this.changeListener = () => {};
    this.addedListeners = [];
  };

  /**
   * Applies values and events to listener
   */
  Listener.prototype.init = function init() {
    this.value = this.getValue(this.component.state[this.key]);
    this.component.addListener(this.key, this, this.depth);
    this.handleUpdate(this.component.state[this.key]);
    return this;
  };

  /**
   * Removes last active value with destroying listeners and
   * @param {*} value
   */
  Listener.prototype.unlink = function unlink() {
    if (this.value instanceof Node) {
      // Destroy this Node
      // fuseDom.destroy(this.value);
    } else if (this.value instanceof Listener) {
      // Deattach this Listener
      this.value.deattach();
    }
  };

  Listener.prototype.clone = function clone(target, source) {
    var out = {};

    for (var i in target) {
      out[i] = target[i];
    }
    for (var i$1 in source) {
      out[i$1] = source[i$1];
    }

    return out;
  };

  Listener.prototype.setPartialState = function setPartialState(path, value, source) {
    var target = {};
    if (path.length) {
      target[path[0]] = path.length > 1 ? this.setPartialState(path.slice(1), value, source[path[0]]) : value;
      return this.clone(source, target);
    }
    return value;
  };

  /**
   * Updates state value
   * @param {*} value
   */
  Listener.prototype.updateValue = function updateValue(value) {
    var source = this.component.state[this.key];
    return this.component.setState({
      [this.key]: this.setPartialState(this.path, value, source)
    });
  };

  Listener.prototype.extractListeners = function extractListeners(value) {
    // if (this.value instanceof Listener && value instanceof Listener) {
    // console.log('middle')
    // } else
    if (value instanceof Listener) {
      // if (this.value instanceof Listener) {
      // this.value.processValue = value.processValue;
      // // this.value = value;
      // this.handleUpdate(value.getValue(value.component.state[value.key]));
      // console.log(value, value.getValue(value.component.state[value.key]));
      // value.deattach();
      // }
      // value.component.addListener(value.key, value, value.depth);
      // value.handleUpdate = () => {
      // console.log('inner handler')
      // }
      var tempListener = {
        depth: value.depth,
        attached: true,
        processValue: value => value,
        handleUpdate: () => {
          if (this.component) {
            this.handleUpdate(this.getValue(this.component.state[this.key]));
          }
          tempListener.attached = false;
        },
        changeListener: () => {}
      };
      this.addedListeners.push(tempListener);
      value.component.addListener(value.key, tempListener, value.depth);
      // value.init()
      // value.handleUpdate = () => {
      // console.log('inner handler')
      // }
      // value.onValueChange((v) => {
      // this.handleUpdate(this.getValue(this.component.state[this.key]));
      // console.log('me got changed', v)
      // });
      var newValue = value.processValue(value.getValue(value.component.state[value.key]));
      value.deattach();
      return this.extractListeners(newValue);
    }
    return value;

    // return this.processValue(this.getValue(value));
  };

  /**
   * @param {*} value
   */
  Listener.prototype.handleUpdate = function handleUpdate(value) {
    var newValue = this.processValue(this.getValue(value));
    // if (this.value instanceof Listener && newValue instanceof Listener) {
    // this.value.processValue = newValue.processValue;
    // // this.value = newValue;
    // this.value.handleUpdate(newValue.component.state[newValue.key]);
    // console.log(newValue, newValue.getValue(newValue.component.state[newValue.key]));
    // newValue.deattach();
    // } else
    if (newValue instanceof Listener) {
      // if (this.value instanceof Listener) {
      // this.value.processValue = newValue.processValue;
      // // this.value = newValue;
      // this.value.handleUpdate(newValue.component.state[newValue.key]);
      // console.log(newValue, newValue.getValue(newValue.component.state[newValue.key]));
      // newValue.deattach();
      // } else {
      for (var i = 0; i < this.addedListeners.length; i++) {
        this.addedListeners[i].attached = false;
      }
      this.addedListeners = [];
      this.value = this.extractListeners(newValue);
      this.changeListener(this.value);
      // }
      // // console.log(this.value.processValue('P'), newValue.processValue('A'));
      // // console.log(this.extractListeners(newValue));
      // // newValue.handleUpdate(newValue.component.state[newValue.key]);
      // // this.value = newValue;
      // // this.value.processValue = newValue.processValue;
      // this.value = this.extractListeners(newValue);
      // this.changeListener(this.value);
      // // this.value.processValue = newValue.processValue;
      // // // this.value = newValue;
      // // this.value.handleUpdate(newValue.component.state[newValue.key]);
      // // console.log(newValue, newValue.getValue(newValue.component.state[newValue.key]));
      // // newValue.deattach();
    } else {
      this.unlink();
      this.value = newValue;
      this.changeListener(this.value);
    }
  };

  /**
   * @param {*} source
   * @returns {*}
   */
  Listener.prototype.getValue = function getValue(source) {
    var i = 0;
    while (i < this.path.length) {
      if (source === null || !source[this.path[i]] && typeof source[this.path[i]] !== 'number') {
        source = null;
      } else {
        source = source[this.path[i]];
      }
      i += 1;
    }
    return source;
  };

  /**
   * @param {number} depth
   * @returns {Listener}
   */
  Listener.prototype.applyDepth = function applyDepth(depth) {
    this.depth = depth;
    return this;
  };

  /**
   * @param {function(*)} changeListener
   */
  Listener.prototype.onValueChange = function onValueChange(changeListener) {
    this.changeListener = changeListener;
    this.changeListener(this.value);
  };

  /**
   * @param {function(*): *} processValue
   * @returns {function(*): *}
   */
  Listener.prototype.process = function process(processValue) {
    this.processValue = processValue;
    return this;
  };

  Listener.prototype.deattach = function deattach() {
    this.component = null;
    this.attached = false;
    this.key = null;
    this.childPath = null;
    this.path = null;
    this.unlink();
    this.value = null;
    this.changeListener = () => {};
    this.processValue = () => {};
  };

  /**
   * Append dom node to dom tree (after - (true) should append after 'to' element
   * or (false) inside it)
   * @param {HTMLElement} node
   * @param {HTMLElement} to
   * @param {Boolean} after
   * @returns {HTMLElement}
   */
  var append = (node, to, after) => {
    if (after && to) {
      if (to.parentNode) {
        to.parentNode.insertBefore(node, to);
        // if (!to.nextSibling) {
        //   to.parentNode.appendChild(node);
        // } else {
        //   to.parentNode.insertBefore(node, to.nextSibling || to);
        // }
      }
      return node;
    }

    return to.appendChild(node);
  };

  var getLast = child => {
    if (child.$redirect && child.$redirect[child.$redirect.length - 1]) {
      return getLast(child.$redirect[child.$redirect.length - 1]);
    }

    // if (child.children && child.children.length > 0) {
    //   return child.children;
    // }

    return child;
  };

  /**
   * @param {Structure} child
   */
  var mountChildren = (child, isSvg, depth) => {
    if (depth === void 0) depth = 0;

    if (!child) {
      return;
    }

    if (child.$redirect && child.$redirect.length > 0) {
      mountChildren(getLast(child), isSvg, depth + 1);
    } else if (child.children && child.children.length > 0) {
      if (child.html && child.html.length === 1) {
        mount(child.children, child.html[0], child.html[0].nodeType !== 1, child.$isSvg, child.$depth);
      } else {
        mount(child.children, child.$pointer, true, child.$isSvg, child.$depth);
      }
    }
  };

  /**
   * @param {string} value
   * @returns {HTMLElement}
   */
  var textNode = value => document.createTextNode(typeof value === 'object' ? JSON.stringify(value) : value);

  // import Component from './component/Component';

  /**
   * Appends structure[] to dom node
   * @param {*} component
   * @param {string} id
   * @param {boolean} isSvg
   * @param {number} depth
   * @returns {HTMLElement|Node}
   */
  var mount = (raw, parent, after, isSvg, depth) => {
    if (after === void 0) after = false;
    if (isSvg === void 0) isSvg = false;
    if (depth === void 0) depth = 0;

    parent = typeof parent === 'string' ? document.getElementById(parent) : parent;
    var nodes = flatten([raw]).map(filterNode);

    // console.log(1, 'MOUNT')

    var loop = function (i) {
      var nn = nodes[i];

      // console.log(2, nodes[i])
      if (nn instanceof Node) {
        append(nn, parent, after);
      } else if (nn && typeof nn.render === 'function') {
        // nn.$pointer = text('[pointer]');
        nn.$pointer = textNode('');
        append(nn.$pointer, parent, after);

        nodes[i].render(rendered => {
          // console.log(3, rendered)

          // Abort! Pointer was destroyed
          if (nn.$pointer === false) {
            return false;
          }

          for (var n = 0; n < rendered.length; n++) {
            if (nn.$pointer) {
              append(rendered[n], nn.$pointer, true);
            } else {
              append(rendered[n], parent, after);
            }
          }

          mountChildren(nn, nn.$isSvg, depth + 1);
        }, nn, depth, isSvg);
      }

      // if (!nn.html) {
      //   nn.$pointer = text('[pointer]');
      //   append(nn.$pointer, parent, after);
      // }
    };

    for (var i = 0; i < nodes.length; i++) loop(i);

    return nodes;
  };

  /**
   * @param {*} query
   * @returns {Node}
   */
  var getElementFromQuery = (query, isSvg) => {
    if (typeof query === 'string' || typeof query === 'number') {
      return query !== 'template' ? isSvg || query === 'svg' ? document.createElementNS("http://www.w3.org/2000/svg", query) : document.createElement(query) : document.createDocumentFragment();
    }
    console.warn('[Radi.js] Warn: Creating a JSX element whose query is not of type string, automatically converting query to string.');
    return document.createElement(query.toString());
  };

  /**
   * @param {*[]} raw
   * @param {HTMLElement} parent
   * @param {string} raw
   * @returns {HTMLElement}
   */
  var explode = (raw, parent, next, depth, isSvg) => {
    if (depth === void 0) depth = 0;

    var nodes = flatten([raw]).map(filterNode);
    // console.log('EXPLODE', nodes)

    // console.log('explode', {parent, nodes})

    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] instanceof Structure && !nodes[i].html) {
        // let pp = depth === 0 ? parent : nodes[i];
        // let pp = parent;
        // console.log('EXPLODE 1', parent.$depth, depth, parent.$redirect, nodes[i].$redirect)
        if (parent.children.length <= 0) {
          if (!parent.$redirect) {
            parent.$redirect = [nodes[i]];
          } else {
            parent.$redirect.push(nodes[i]);
          }
        }

        if (!parent.$redirect && nodes[i].children) {
          parent.children = parent.children.concat(nodes[i].children);
        }

        if (typeof nodes[i].render === 'function') {
          nodes[i].render(v => {
            // if (parent.children.length <= 0) {
            //   if (!parent.$redirect) {
            //     parent.$redirect = [nodes[n]];
            //   } else {
            //     parent.$redirect.push(nodes[n]);
            //   }
            // }
            // console.log('EXPLODE 2', nodes[n], v, parent.$depth, nodes[n].$depth)
            next(v);
            // nodes[n].mount();
          }, nodes[i], depth + 1, isSvg);
        }
      }
    }

    return;
  };

  /**
   * @param {*} value
   * @return {*}
   */
  var parseValue = value => typeof value === 'number' && !Number.isNaN(value) ? `${value}px` : value;

  /* eslint-disable no-continue */

  /**
   * @param {Structure} structure
   * @param {object} styles
   * @param {object} oldStyles
   * @returns {object}
   */
  var setStyles = (structure, styles, oldStyles) => {
    if (styles === void 0) styles = {};
    if (oldStyles === void 0) oldStyles = {};

    if (!structure.html || !structure.html[0]) {
      return styles;
    }
    var element = structure.html[0];

    // Handle Listeners
    if (styles instanceof Listener) {
      if (typeof structure.$styleListeners.general !== 'undefined') {
        return element.style;
      }
      structure.$styleListeners.general = styles;
      structure.$styleListeners.general.applyDepth(structure.depth).init();

      structure.$styleListeners.general.onValueChange(value => {
        setStyles(structure, value, {});
      });

      return element.style;
    }

    if (typeof styles === 'string') {
      element.style = styles;
      return element.style;
    }

    var toRemove = Object.keys(oldStyles).filter(key => typeof styles[key] === 'undefined');

    var loop = function (style) {
      if (styles.hasOwnProperty(style)) {
        // Skip if styles are the same
        if (typeof oldStyles !== 'undefined' && oldStyles[style] === styles[style]) {
          return;
        }

        // Need to remove falsy style
        if (!styles[style] && typeof styles[style] !== 'number') {
          element.style[style] = null;
          return;
        }

        // Handle Listeners
        if (styles[style] instanceof Listener) {
          if (typeof structure.$styleListeners[style] !== 'undefined') {
            return;
          }
          structure.$styleListeners[style] = styles[style];
          structure.$styleListeners[style].applyDepth(structure.depth).init();

          structure.$styleListeners[style].onValueChange(value => {
            setStyles(structure, {
              [style]: value
            }, {});
          });

          styles[style] = structure.$styleListeners[style].value;
          return;
        }

        element.style[style] = parseValue(styles[style]);
      }
    };

    for (var style in styles) loop(style);

    for (var i = 0; i < toRemove.length; i++) {
      element.style[toRemove[i]] = null;
    }

    return element.style;
  };

  /**
   * @param {*} value
   * @return {*}
   */
  var parseClass = value => {
    if (Array.isArray(value)) {
      return value.filter(item => item).join(' ');
    }
    return value;
  };

  /* eslint-disable no-continue */
  // import AttributeListener from './utils/AttributeListener';

  /**
   * @param {Structure} structure
   * @param {object} propsSource
   * @param {object} oldPropsSource
   */
  var setAttributes = (structure, propsSource, oldPropsSource) => {
    if (propsSource === void 0) propsSource = {};
    if (oldPropsSource === void 0) oldPropsSource = {};

    var props = propsSource || {};
    var oldProps = oldPropsSource || {};

    if (!structure.html || !structure.html[0]) {
      return structure;
    }
    var element = structure.html[0];

    if (!(element instanceof Node && element.nodeType !== 3)) {
      return structure;
    }

    var toRemove = Object.keys(oldProps).filter(key => typeof props[key] === 'undefined');

    var loop = function (prop) {
      if (props.hasOwnProperty(prop)) {
        // Skip if proprs are the same
        if (typeof oldProps !== 'undefined' && oldProps[prop] === props[prop]) {
          return;
        }

        // Need to remove falsy attribute
        if (!props[prop] && typeof props[prop] !== 'number') {
          element.removeAttribute(prop);
          return;
        }

        if ((prop === 'value' || prop === 'model') && !(props[prop] instanceof Listener)) {
          if (/(checkbox|radio)/.test(element.getAttribute('type'))) {
            element.checked = props[prop];
          } else {
            element.value = props[prop];
          }
        }

        // Handle Listeners
        if (props[prop] instanceof Listener) {
          if (typeof structure.$attrListeners[prop] !== 'undefined') {
            return;
          }
          structure.$attrListeners[prop] = props[prop];
          props[prop].applyDepth(structure.depth).init();

          if (prop.toLowerCase() === 'model') {
            if (/(checkbox|radio)/.test(element.getAttribute('type'))) {
              element.addEventListener('change', e => {
                structure.$attrListeners[prop].updateValue(e.target.checked);
              });
            } else {
              element.addEventListener('input', e => {
                structure.$attrListeners[prop].updateValue(e.target.value);
              });
            }
          }

          structure.$attrListeners[prop].onValueChange(value => {
            setAttributes(structure, {
              [prop]: value
            }, {});
            // props[prop] = value;
          });

          // structure.setProps(Object.assign(structure.data.props, {
          //   [prop]: props[prop].value,
          // }));
          props[prop] = structure.$attrListeners[prop].value;
          return;
        }

        if (typeof GLOBALS.CUSTOM_ATTRIBUTES[prop] !== 'undefined') {
          var ref = GLOBALS.CUSTOM_ATTRIBUTES[prop];
          var allowedTags = ref.allowedTags;

          if (!allowedTags || allowedTags && allowedTags.length > 0 && allowedTags.indexOf(element.localName) >= 0) {
            if (typeof GLOBALS.CUSTOM_ATTRIBUTES[prop].caller === 'function') {
              GLOBALS.CUSTOM_ATTRIBUTES[prop].caller(element, props[prop]);
            }
            if (!GLOBALS.CUSTOM_ATTRIBUTES[prop].addToElement) {
              return;
            }
          }
        }

        if (prop.toLowerCase() === 'style') {
          if (typeof props[prop] === 'object') {
            setStyles(structure, props[prop], oldProps && oldProps.style || {});
            // props[prop] = structure.setStyles(props[prop], (oldProps && oldProps.style) || {});
          } else {
            element.style = props[prop];
          }
          return;
        }

        if (prop.toLowerCase() === 'class' || prop.toLowerCase() === 'classname') {
          element.setAttribute('class', parseClass(props[prop]));
          return;
        }

        if (prop.toLowerCase() === 'loadfocus') {
          element.onload = el => {
            setTimeout(() => {
              el.focus();
            }, 10);
          };
          return;
        }

        if (prop.toLowerCase() === 'html') {
          element.innerHTML = props[prop];
          return;
        }

        // Handles events 'on<event>'
        if (prop.substring(0, 2).toLowerCase() === 'on' && typeof props[prop] === 'function') {
          var fn = props[prop];
          if (prop.substring(0, 8).toLowerCase() === 'onsubmit') {
            element[prop] = e => {
              var data = [];
              var inputs = e.target.elements || [];
              for (var input of inputs) {
                if (input.name !== '' && input.type !== 'radio' && input.type !== 'checkbox' || input.checked) {
                  var item = {
                    name: input.name,
                    el: input,
                    type: input.type,
                    default: input.defaultValue,
                    value: input.value,
                    set(val) {
                      structure.el.value = val;
                    },
                    reset(val) {
                      structure.el.value = val;
                      structure.el.defaultValue = val;
                    }
                  };
                  data.push(item);
                  if (!data[item.name]) {
                    Object.defineProperty(data, item.name, {
                      value: item
                    });
                  }
                }
              }

              return fn(e, data);
            };
          } else {
            element[prop] = e => fn(e);
          }
          return;
        }

        element.setAttribute(prop, props[prop]);
      }
    };

    for (var prop in props) loop(prop);

    for (var i = 0; i < toRemove.length; i++) {
      element.removeAttribute(toRemove[i]);
    }

    structure.props = props;

    return structure;
  };

  /* eslint-disable no-restricted-syntax */

  /**
   * @param {*} query
   * @param {object} props
   * @param {...*} children
   * @param {number} depth
   */
  var Structure = function Structure(query, props, children, depth) {
    if (props === void 0) props = {};
    if (depth === void 0) depth = 0;

    // console.log('H', query, children)
    this.query = query;
    this.props = Boolean !== props ? props : {};
    if (isComponent(query) || query instanceof Component) {
      this.$compChildren = flatten(children || []).map(filterNode);
      this.children = [];
    } else {
      this.children = flatten(children || []).map(filterNode);
      this.$compChildren = [];
    }
    this.html = null;
    this.$attrListeners = [];
    this.$styleListeners = [];
    this.$pointer = null;
    this.$component = null;
    this.$listener = null;
    this.$redirect = null;
    this.$destroyed = false;
    this.$isSvg = query === 'svg';
    this.$depth = depth;
  };

  Structure.prototype.mount = function mount() {
    this.$destroyed = false;
    // console.warn('[mounted]', this)

    if (this.$component instanceof Component) {
      this.$component.mount();
    }
  };

  Structure.prototype.destroy = function destroy(childrenToo) {
    if (childrenToo === void 0) childrenToo = true;

    if (this.$destroyed) {
      return false;
    }
    // console.warn('[destroyed]', this, this.html, this.$redirect)

    for (var l in this.$styleListeners) {
      if (this.$styleListeners[l] && typeof this.$styleListeners[l].deattach === 'function') {
        this.$styleListeners[l].deattach();
      }
    }

    for (var l$1 in this.$attrListeners) {
      if (this.$attrListeners[l$1] && typeof this.$attrListeners[l$1].deattach === 'function') {
        this.$attrListeners[l$1].deattach();
      }
    }

    if (this.$redirect) {
      for (var i = 0; i < this.$redirect.length; i++) {
        if (typeof this.$redirect[i].destroy === 'function') {
          this.$redirect[i].destroy();
        }
      }
    }

    if (childrenToo && this.children) {
      for (var i$1 = 0; i$1 < this.children.length; i$1++) {
        if (typeof this.children[i$1].destroy === 'function') {
          this.children[i$1].destroy();
        }
      }
    }

    if (this.html) {
      for (var i$2 = 0; i$2 < this.html.length; i$2++) {
        if (this.html[i$2].parentNode) {
          this.html[i$2].parentNode.removeChild(this.html[i$2]);
        }
      }
    }

    if (this.$component instanceof Component) {
      this.$component.destroy();
    }

    if (this.$listener instanceof Listener) {
      this.$listener.deattach();
    }

    if (this.$pointer && this.$pointer.parentNode) {
      this.$pointer.parentNode.removeChild(this.$pointer);
    }
    this.$pointer = null;
    this.$redirect = null;
    this.$component = null;
    this.render = () => {};
    this.html = null;
    this.$destroyed = true;
    return true;
  };

  Structure.prototype.render = function render(next, parent, depth, isSvg) {
    if (depth === void 0) depth = 0;
    if (isSvg === void 0) isSvg = false;

    // console.log('RENDER', isSvg, parent, parent && parent.$isSvg)
    this.$depth = Math.max(this.$depth, depth);
    this.$isSvg = isSvg || parent && parent.$isSvg || this.query === 'svg';

    if (this.query === '#text') {
      this.html = [textNode(this.props)];
      return next(this.html);
    }

    if (typeof this.query === 'string' || typeof this.query === 'number') {
      this.html = [getElementFromQuery(this.query, this.$isSvg)];

      setAttributes(this, this.props, {});

      return next(this.html);
    }

    if (this.query instanceof Listener) {
      if (!this.$listener) {
        this.$listener = this.query.applyDepth(this.$depth).init();
        this.mount();
      }
      return this.query.onValueChange(v => {
        if (this.html) {
          var tempParent = this.html[0];

          if (this.$pointer) {
            this.$redirect = patch(this.$redirect, v, this.$pointer, true, this.$isSvg, this.$depth + 1);
          } else {
            this.$redirect = patch(this.$redirect, v, tempParent, true, this.$isSvg, this.$depth + 1);
          }

          // let a = {
          // $redirect: [],
          // children: [],
          // };
          //
          // explode(v, a, output => {
          // // this.html = output;
          // if (this.$pointer) {
          //   this.$redirect = patch(this.$redirect, a.$redirect,
          // this.$pointer, true, this.$isSvg, this.$depth + 1);
          // } else {
          //   this.$redirect = patch(this.$redirect, a.$redirect,
          // tempParent, true, this.$isSvg, this.$depth + 1);
          // }
          // // next(output);
          // }, this.$depth + 1, this.$isSvg);
        } else {
          explode(v, parent || this, output => {
            // console.warn('change HTML', this.html)
            this.html = output;
            next(output);
          }, this.$depth + 1, this.$isSvg);
        }
      });
    }

    if (this.query instanceof Promise || this.query.constructor.name === 'LazyPromise') {
      return this.query.then(v => {
        var normalisedValue = v.default || v;
        explode(normalisedValue, parent || this, output => {
          this.html = output;
          next(output);
        }, this.$depth, this.$isSvg);
      });
    }

    if (this.query instanceof Component && typeof this.query.render === 'function') {
      this.$component = this.query;
      return explode(this.$component.render(), parent || this, v => {
        this.html = v;
        next(v);
        this.mount();
      }, this.$depth, this.$isSvg);
    }

    if (isComponent(this.query)) {
      if (!this.$component) {
        this.$component = new this.query(this.$compChildren).setProps(this.props); // eslint-disable-line
      }
      if (typeof this.$component.render === 'function') {
        explode(this.$component.render(), parent || this, v => {
          this.html = v;
          next(v);
        }, this.$depth, this.$isSvg);
        this.mount();
      }
      return null;
    }

    if (typeof this.query === 'function') {
      return explode(this.query(this.props), parent || this, v => {
        this.html = v;
        next(v);
      }, this.$depth, this.$isSvg);
    }

    return next(textNode(this.query));
  };

  /* eslint-disable no-restricted-syntax */

  // const hasRedirect = item => (
  //   item && item.$redirect
  // );

  var patch = (rawfirst, rawsecond, parent, after, isSvg, depth) => {
    if (after === void 0) after = false;
    if (isSvg === void 0) isSvg = false;
    if (depth === void 0) depth = 0;

    var first = flatten([rawfirst]);
    var second = flatten([rawsecond]).map(filterNode);

    var length = Math.max(first.length, second.length);

    var loop = function (i) {
      // debugger
      // const nn = i;
      // first[i] = first[i].$redirect || first[i];
      if (typeof first[i] === 'undefined') {
        // mount
        mount(second[i], parent, after, isSvg, depth);
        return;
      }

      if (typeof second[i] === 'undefined') {
        // remove
        if (typeof first[i].destroy === 'function') {
          first[i].destroy();
        }
        return;
      }

      second[i].$depth = depth;

      if (first[i] instanceof Structure && second[i] instanceof Structure && first[i] !== second[i]) {
        // if (second[i].$redirect2) {
        //   second[i] = patch(
        //     // first[i].$redirect || first[i],
        //     hasRedirect(first[i]) || first[i],
        //     second[i].$redirect[second[i].$redirect.length - 1] || second[i],
        //     parent,
        //     after,
        //     isSvg,
        //     depth
        //   );
        //   continue;
        // }

        if (first[i].html && first[i].query === '#text' && second[i].query === '#text') {
          for (var n = 0; n < first[i].html.length; n++) {
            if (first[i].props !== second[i].props) {
              first[i].html[n].textContent = first[i].props = second[i].props;
            }
          }

          second[i].html = first[i].html;
          first[i].html = null;

          if (first[i].$pointer) {
            if (second[i].$pointer && second[i].$pointer.parentNode) {
              second[i].$pointer.parentNode.removeChild(second[i].$pointer);
            }
            second[i].$pointer = first[i].$pointer;
            first[i].$pointer = null;
          }

          first[i].destroy();
          return;
        }

        if (first[i].html && typeof first[i].query === 'string' && typeof second[i].query === 'string' && first[i].query === second[i].query) {
          // for (var n = 0; n < first[i].html.length; n++) {
          //   if (first[i].props !== second[i].props) {
          //     // first[i].html[n].textContent = second[i].props;
          //   }
          // }

          second[i].html = first[i].html;
          first[i].html = null;

          if (first[i].$pointer) {
            if (second[i].$pointer && second[i].$pointer.parentNode) {
              second[i].$pointer.parentNode.removeChild(second[i].$pointer);
            }
            second[i].$pointer = first[i].$pointer;
            first[i].$pointer = null;
          }

          setAttributes(second[i], second[i].props, first[i].props);
          // mountChildren(second[i], second[i].$isSvg, second[i].$depth + 1);

          if (second[i].html[0] && second[i].children && second[i].children.length > 0) {
            second[i].children = patch(first[i].children, second[i].children, second[i].html[0], false, second[i].$isSvg, second[i].$depth + 1);
          }
          first[i].destroy(false);

          return;
        }

        // maybe merge
        var n1 = first[i];
        var n2 = second[i];

        // n2.$pointer = textNode('[pointer2]');
        n2.$pointer = textNode('');
        append(n2.$pointer, parent, after);

        n2.render(rendered => {
          if (n1.$pointer) {
            if (n2.$pointer && n2.$pointer.parentNode) {
              n2.$pointer.parentNode.removeChild(n2.$pointer);
            }
            n2.$pointer = n1.$pointer;
            n1.$pointer = null;
          }

          for (var n = 0; n < rendered.length; n++) {
            if (n1.html && !n1.html[i] || !n1.html) {
              append(rendered[n], n2.$pointer, true);
            } else {
              append(rendered[n], n1.html[i], true);
            }
          }

          mountChildren(n2, isSvg, depth + 1);

          n1.destroy(false);
        }, n2, depth, isSvg);
      }
    };

    for (var i = 0; i < length; i++) loop(i);

    return second;
  };

  /* eslint-disable guard-for-in */

  var Component = function Component(children, props) {
    this.addNonEnumerableProperties({
      $id: generateId(),
      $name: this.constructor.name,
      $config: typeof this.config === 'function' ? this.config() : {
        listen: true
      },
      $events: {},
      $privateStore: new PrivateStore()
    });

    this.on = typeof this.on === 'function' ? this.on() : {};
    this.children = [];

    // Links headless components
    for (var key in GLOBALS.HEADLESS_COMPONENTS) {
      this[key].when('update', () => this.setState());
    }

    this.state = typeof this.state === 'function' ? this.state() : this.state || {};

    skipInProductionAndTest(() => Object.freeze(this.state));

    if (children) {
      this.setChildren(children);
    }
    if (props) {
      this.setProps(props);
    }
  };

  /**
   * @returns {HTMLElement}
   */
  Component.prototype.render = function render() {
    if (typeof this.view !== 'function') {
      return null;
    }
    return this.html = this.view();
  };

  /**
   * @param {object} props
   * @returns {Component}
   */
  Component.prototype.setProps = function setProps(props) {
    var newState = {};
    var self = this;
    var loop = function (key) {
      if (typeof props[key] === 'function' && key.substr(0, 2) === 'on') {
        self.when(key.substring(2, key.length), props[key]);
      } else if (props[key] instanceof Listener) {
        newState[key] = props[key].init().value;
        props[key].changeListener = value => {
          self.setState({
            [key]: value
          });
        };
      } else {
        newState[key] = props[key];
      }
    };

    for (var key in props) loop(key);
    this.setState(newState);
    return this;
  };

  /**
   * @param {Node[]|*[]} children
   */
  Component.prototype.setChildren = function setChildren(children) {
    this.children = children;
    this.setState();
    for (var i = 0; i < this.children.length; i++) {
      if (typeof this.children[i].when === 'function') {
        this.children[i].when('update', () => this.setState());
      }
    }
    return this;
  };

  /**
   * @private
   * @param {object} obj
   */
  Component.prototype.addNonEnumerableProperties = function addNonEnumerableProperties(obj) {
    for (var key in obj) {
      if (typeof this[key] !== 'undefined') {
        continue;
      }
      Object.defineProperty(this, key, {
        value: obj[key]
      });
    }
  };

  /**
   * @param {string} key
   * @param {Listener} listener
   * @param {number} depth
   */
  Component.prototype.addListener = function addListener(key, listener, depth) {
    this.$privateStore.addListener(key, listener, depth);
  };

  Component.prototype.mount = function mount() {
    this.trigger('mount');
  };

  Component.prototype.destroy = function destroy() {
    // if (this.html) {
    // for (var i = 0; i < this.html.length; i++) {
    //   if (this.html[i].parentNode) {
    //     this.html[i].parentNode.removeChild(this.html[i]);
    //   }
    // }
    // }
    this.html = null;
    this.trigger('destroy');
    this.$privateStore.removeListeners();
  };

  /**
   * @param {string} key
   * @param {function} fn
   */
  Component.prototype.when = function when(key, fn) {
    if (typeof this.$events[key] === 'undefined') {
      this.$events[key] = [];
    }
    this.$events[key].push(fn);
  };

  /**
   * @param {string} key
   * @param {*} value
   */
  Component.prototype.trigger = function trigger(key, ...args) {
    if (typeof this.on[key] === 'function') {
      this.on[key].call(this, ...args);
    }

    if (typeof this.$events[key] !== 'undefined') {
      for (var i in this.$events[key]) {
        this.$events[key][i].call(this, ...args);
      }
    }
  };

  /**
   * @param {object} newState
   */
  Component.prototype.setState = function setState(newState) {
    if (typeof newState === 'object') {
      var oldstate = this.state;

      skipInProductionAndTest(() => oldstate = clone(this.state));

      this.state = Object.assign(oldstate, newState);

      skipInProductionAndTest(() => Object.freeze(this.state));

      if (this.$config.listen) {
        this.$privateStore.setState(newState);
      }
    }

    if (!this.$config.listen && typeof this.view === 'function' && this.html) {
      this.html = patch(this.html, this.view());
    }

    // if (typeof newState === 'object') {
    // let oldstate = this.state;
    //
    // skipInProductionAndTest(() => oldstate = clone(this.state));
    //
    // this.state = Object.assign(oldstate, newState);
    //
    // skipInProductionAndTest(() => Object.freeze(this.state));
    //
    // if (this.$config.listen) {
    //   this.$privateStore.setState(newState);
    // }
    // }
    //
    // if (!this.$config.listen && typeof this.view === 'function' && this.html) {
    // fuseDom.fuse(this.html, this.view());
    // }
    this.trigger('update');

    return newState;
  };

  /**
   * @returns {boolean}
   */
  Component.isComponent = function isComponent() {
    return true;
  };

  /**
   * @param {*} value
   * @returns {Boolean}
   */
  var isComponent = value => {
    if (value) {
      if (value.prototype instanceof Component) {
        return true;
      }

      if (value.isComponent) {
        return true;
      }
    }

    return false;
  };

  /**
   * @param {function} value
   * @returns {object}
   */
  var filterNode = value => {

    if (typeof value === 'string' || typeof value === 'number') {
      return r('#text', value);
    }

    if (!value || typeof value === 'boolean') {
      return r('#text', '');
    }

    if (value instanceof Listener) {
      return r(value);
    }

    if (isComponent(value) || value instanceof Component) {
      return r(value);
    }

    if (typeof value === 'function') {
      return r(value);
    }

    if (value instanceof Promise || value.constructor.name === 'LazyPromise') {
      return r(value);
    }

    return value;
  };

  // import Component from '../component/Component';

  /**
   * @param {*} query
   * @param {object} props
   * @param {...*} children
   * @returns {object}
   */
  var r = (query, props, ...children) => {
    if (query === 'await') {
      var output = null;

      if (props.src && props.src instanceof Promise) {
        props.src.then(v => {
          var nomalizedData = filterNode(typeof props.transform === 'function' ? props.transform(v) : v);

          if (output) {
            output = patch(output, nomalizedData, output.html[0].parentNode);
          } else {
            output = nomalizedData;
          }
        }).catch(error => {
          var placerror = filterNode(typeof props.error === 'function' ? props.error(error) : props.error);

          if (output) {
            output = patch(output, placerror, output.html[0].parentNode);
          } else {
            output = placerror;
          }
        });
      }

      if (!output) {
        output = filterNode(props.placeholder);
      }

      return output;
    }

    if (query === 'template') {
      // return flatten([children]).map(filterNode);
      return new Structure('section', props, flatten([children]).map(filterNode));
    }

    return new Structure(query, props, flatten([children]).map(filterNode));
  };

  /**
   * The listen function is used for dynamically binding a component property
   * to the DOM. Also commonly imported as 'l'.
   * @param {Component} component
   * @param {...string} path
   * @returns {Listener}
   */
  var listen = (component, ...path) => new Listener(component, ...path);

  var remountActiveComponents = () => {
    Object.values(GLOBALS.ACTIVE_COMPONENTS).forEach(component => {
      if (typeof component.onMount === 'function') {
        component.onMount(component);
      }
    });
  };

  function createWorker(fn) {
    var fire = () => {};

    var blob = new Blob([`self.onmessage = function(e) {
    self.postMessage((${fn.toString()})(e.data));
  }`], { type: 'text/javascript' });

    var url = window.URL.createObjectURL(blob);
    var myWorker = new Worker(url);

    myWorker.onmessage = e => {
      fire(e.data, null);
    };
    myWorker.onerror = e => {
      fire(null, e.data);
    };

    return arg => new Promise((resolve, reject) => {
      fire = (data, err) => !err ? resolve(data) : reject(data);
      myWorker.postMessage(arg);
    });
  }

  // Descriptor for worker
  function worker(target, key, descriptor) {
    var act = descriptor.value;

    var promisedWorker = createWorker(act);

    descriptor.value = function (...args) {
      promisedWorker(...args).then(newState => {
        this.setState.call(this, newState);
      });
    };
    return descriptor;
  }

  // Descriptor for actions
  function action(target, key, descriptor) {
    var act = descriptor.value;
    descriptor.value = function (...args) {
      return this.setState.call(this, act.call(this, ...args));
    };
    return descriptor;
  }

  // Descriptor for subscriptions
  function subscribe(container, eventName, triggerMount) {
    // TODO: Remove event after no longer needed / Currently overrides existing
    // TODO: Do not override existing event - use EventListener
    // TODO: triggerMount should trigger this event on mount too
    return function (target, key, descriptor) {
      var name = 'on' + (eventName || key);
      var fn = function (...args) {
        return descriptor.value.call(this, ...args);
      };

      container[name] = fn;
      // if (container && container.addEventListener) {
      //   container.addEventListener(name, fn);
      //   self.when('destroy', () => {
      //     container.removeEventListener(name, fn);
      //   });
      // }
      // console.log(target, key, descriptor, container[name], name, fn, fn.radiGlobalEvent);
      return descriptor;
    };
  }

  var Radi = {
    version: GLOBALS.VERSION,
    activeComponents: GLOBALS.ACTIVE_COMPONENTS,
    r,
    listen,
    l: listen,
    worker,
    component: Component,
    Component,
    action,
    subscribe,
    customAttribute: (attributeName, caller, ref) => {
      if (ref === void 0) ref = {};
      var allowedTags = ref.allowedTags;
      var addToElement = ref.addToElement;

      GLOBALS.CUSTOM_ATTRIBUTES[attributeName] = {
        name: attributeName,
        caller,
        allowedTags: allowedTags || null,
        addToElement
      };
    },
    headless: (key, comp) => {
      // TODO: Validate component and key
      var name = '$'.concat(key);
      var mountedComponent = new comp();
      mountedComponent.mount();
      Component.prototype[name] = mountedComponent;
      return GLOBALS.HEADLESS_COMPONENTS[name] = mountedComponent;
    },
    update: patch,
    patch,
    mount,
    freeze: () => {
      GLOBALS.FROZEN_STATE = true;
    },
    unfreeze: () => {
      GLOBALS.FROZEN_STATE = false;
      remountActiveComponents();
    }
  };

  // Radi.customAttribute('source', (element, value) => {
  //   element.style.fontSize = value + 'px';
  //   console.log('Sourced', element, value)
  // }, {
  //   allowedTags: ['li', 'ul'],
  // })

  // Pass Radi instance to plugins
  Radi.plugin = (fn, ...args) => fn(Radi, ...args);

  if (window) {
    window.Radi = Radi;
  }
  // export default Radi;
  module.exports = Radi;
});
//# sourceMappingURL=radi.js.map
},{"process":16}],17:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var version = exports.version = '0.3.5';

// Pass routes to initiate things

exports.default = function (_ref, routes) {
  var r = _ref.r,
      l = _ref.l,
      mount = _ref.mount,
      headless = _ref.headless,
      Component = _ref.Component;

  var current = {};

  var COLON = ':'.charCodeAt(0);
  var SLASH = '/'.charCodeAt(0);
  var cr, crg, lr, ld;

  var parseRoute = function parseRoute(route) {
    var parts = route.split('/'),
        end = [],
        p = [];
    for (var i = 0; i < parts.length; i++) {
      if (COLON === parts[i].charCodeAt(0)) {
        end.push('([^/]+?)');
        p.push(parts[i].substr(1));
      } else if (parts[i] !== '') {
        end.push(parts[i]);
      }
    }
    return [new RegExp('^/' + end.join('/') + '(?:[/])?(?:[?&].*)?$', 'i'), p];
  };

  var parseAllRoutes = function parseAllRoutes(arr) {
    var len = arr.length,
        ret = new Array(len);
    for (var i = len - 1; i >= 0; i--) {
      ret[i] = parseRoute(arr[i]);
    }
    return ret;
  };

  var renderError = function renderError(number) {
    return current.config.errors[number]();
  };

  var writeUrl = function writeUrl(url) {
    window.location.hash = url;
    return true;
  };

  var guard = function guard(before, comp, active, last, resolve, reject, deep, _router) {
    return before.call(_router, active, last, function (act) {
      if (typeof act === 'undefined' || act === true) {
        if (typeof deep === 'function') {
          return guard(deep, comp, active, last, resolve, reject, null, _router);
        } else {
          resolve(comp);
        }
      } else if (typeof act === 'string' && act.charCodeAt(0) === SLASH) {
        writeUrl(act);
        return reject();
      } else {
        resolve(renderError(403));
      }

      // Fire afterEach event in routes
      if (current.after) current.after(active, last);
    });
  };

  var extractChildren = function extractChildren(routes) {
    var children = routes;
    for (var child in routes) {
      if (routes.hasOwnProperty(child) && routes[child].children) {
        var extracted = extractChildren(routes[child].children);
        for (var nn in extracted) {
          if (extracted.hasOwnProperty(nn)) {
            children[child + nn] = extracted[nn];
          }
        }
      }
    }
    return children;
  };

  var getRoute = function getRoute(curr) {
    if (lr === curr) return ld;
    if (!cr) cr = Object.keys(current.routes);
    if (!crg) crg = parseAllRoutes(cr);
    var cahnged = false;

    for (var i = 0; i < crg.length; i++) {
      if (crg[i][0].test(curr)) {
        ld = new Route(curr, crg[i], current.routes, cr[i]);
        cahnged = true;
        break;
      }
    }

    lr = curr;
    return !cahnged ? { key: null } : ld;
  };

  var Route = function Route(curr, match, routes, key) {
    _classCallCheck(this, Route);

    var query = curr.split(/[\?\&]/).slice(1).map(function (query) {
      return query.split('=');
    }).reduce(function (acc, key) {
      return Object.assign(acc, _defineProperty({}, key[0], key[1]));
    }, {});
    var m = curr.match(match[0]);
    this.path = curr;
    this.key = key;
    this.query = query;
    this.cmp = routes[key];
    this.params = this.cmp.data || {};
    for (var i = 0; i < match[1].length; i++) {
      this.params[match[1][i]] = m[i + 1];
    }
  };

  var RouterHead = function (_Component) {
    _inherits(RouterHead, _Component);

    function RouterHead() {
      _classCallCheck(this, RouterHead);

      return _possibleConstructorReturn(this, (RouterHead.__proto__ || Object.getPrototypeOf(RouterHead)).apply(this, arguments));
    }

    _createClass(RouterHead, [{
      key: 'state',
      value: function state() {
        return {
          location: window.location.hash.substr(1) || '/',
          params: {},
          query: {},
          last: null,
          active: null,
          activeComponent: null
        };
      }
    }, {
      key: 'on',
      value: function on() {
        return {
          mount: function mount() {
            var _this2 = this;

            window.onhashchange = function () {
              return _this2.setState(_this2.hashChange());
            };
            this.setState(this.hashChange());
          }
        };
      }
    }, {
      key: 'hashChange',
      value: function hashChange() {
        var loc = window.location.hash.substr(1) || '/';
        var a = getRoute(loc);

        // console.log('[radi-router] Route change', a, this.state.location);

        window.scrollTo(0, 0);

        // this.resolve(this.inject(a.key || '', this.state.active))

        this.trigger('changed', a.key || '', this.state.active);

        return {
          last: this.state.active,
          location: loc,
          params: a.params || {},
          query: a.query || {},
          active: a.key || ''
        };
      }
    }]);

    return RouterHead;
  }(Component);

  var Link = function (_Component2) {
    _inherits(Link, _Component2);

    function Link() {
      _classCallCheck(this, Link);

      return _possibleConstructorReturn(this, (Link.__proto__ || Object.getPrototypeOf(Link)).apply(this, arguments));
    }

    _createClass(Link, [{
      key: 'state',
      value: function state() {
        return {
          to: '/',
          active: 'active',
          core: false,
          class: '',
          id: null,
          title: null
        };
      }
    }, {
      key: 'view',
      value: function view() {
        var _this4 = this;

        return r.apply(undefined, ['a', {
          href: l(this, 'to').process(function (url) {
            return '#'.concat(url);
          }),
          class: l(this, 'to').process(function (to) {
            return l(_this4.$router, 'active').process(function (active) {
              return l(_this4, 'class').process(function (cls) {
                return [(active === to || _this4.state.core && new RegExp('^' + to).test(active)) && _this4.state.active, cls];
              });
            });
          }),
          id: l(this, 'id'),
          title: l(this, 'title')
        }].concat(_toConsumableArray(this.children)));
      }
    }]);

    return Link;
  }(Component);

  var Router = function (_Component3) {
    _inherits(Router, _Component3);

    function Router() {
      _classCallCheck(this, Router);

      return _possibleConstructorReturn(this, (Router.__proto__ || Object.getPrototypeOf(Router)).apply(this, arguments));
    }

    _createClass(Router, [{
      key: 'state',
      value: function state() {
        return {
          active: null
        };
      }
    }, {
      key: 'on',
      value: function on() {
        return {
          mount: function mount() {
            var _this6 = this;

            this.setState({ active: this.$router.state.active });
            this.$router.when('changed', function (active, last) {
              _this6.setState({ active: active });
            });
          }
        };
      }
    }, {
      key: 'view',
      value: function view() {
        var _this7 = this;

        // return [
        //   l(this.$router, 'active').process(() => r('div', {}, this.inject(this.$router.state))),
        //   ...this.children,
        // ];
        return [l(this, 'active').process(function (comp) {
          return _this7.extractComponent(comp);
        }), this.children];
        // return r(
        //   'template',
        //   {},
        //   l(this, 'active').process(comp => this.extractComponent(comp)),
        //   this.children,
        // );
        // return [
        //   l(this.$router, 'activeComponent').process(comp => comp),
        //   this.children,
        // ]
        // return r(
        //   'template',
        //   {},
        //   l(this.$router, 'activeComponent').process(comp => comp),
        //   this.children,
        // );
      }

      // Triggers when route is changed

    }, {
      key: 'extractComponent',
      value: function extractComponent(active, last) {
        var _this8 = this;

        // Route is not yet ready
        // For the future, maybe show cached page or default screen
        // or loading placeholder if time between this and next request
        // is too long
        if (active === null && typeof last === 'undefined') return;

        // const { active, last } = this.state
        var RouteComponent = current.routes[active];
        var WillRender = (typeof RouteComponent === 'undefined' ? 'undefined' : _typeof(RouteComponent)) === 'object' ? RouteComponent.component : RouteComponent;

        // Route not found or predefined error
        if ((typeof WillRender === 'undefined' || typeof WillRender === 'number' || !WillRender) && typeof RouteComponent === 'undefined') return renderError(WillRender || 404);

        // Plain redirect
        if (typeof RouteComponent.redirect === 'string') return writeUrl(RouteComponent.redirect);

        // Check if has any guards to check
        var guards = [current.before || null, RouteComponent.before || null].filter(function (guard) {
          return typeof guard === 'function';
        });

        if (guards.length > 0) {
          var checkGuard = function checkGuard(resolve, reject) {
            return guards.pop().call(_this8, active, last, function (act) {
              // Render
              if (typeof act === 'undefined' || act === true) {
                if (guards.length > 0) {
                  return checkGuard(resolve, reject);
                } else {
                  return resolve(WillRender);
                }
              }

              // Redirect
              // if (typeof act === 'string' && act.charCodeAt(0) === SLASH) {
              //   reject();
              //   return writeUrl(act);
              // }

              // Restricted
              return resolve(renderError(403));
            });
          };

          return function () {
            return new Promise(checkGuard);
          };
        }

        if (typeof WillRender === 'function') {
          // Route is component
          if (WillRender.isComponent && WillRender.isComponent()) return r(WillRender);

          // Route is plain function
          return WillRender;
        }

        // Route is plain text/object
        return WillRender;
      }
    }]);

    return Router;
  }(Component);

  var before = routes.beforeEach;
  var after = routes.afterEach;

  current = {
    config: {
      errors: {
        404: function _() {
          return r('div', {}, 'Error 404: Not Found');
        },
        403: function _() {
          return r('div', {}, 'Error 403: Forbidden');
        }
      }
    },
    before: before,
    after: after,
    routes: extractChildren(routes.routes),
    write: writeUrl,
    Link: Link,
    Router: Router
  };

  // Initiates router component
  headless('router', RouterHead);

  return current;
};
},{}],21:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// import logo from '../../assets/img/llwhite.png'
// import logoColor from '../../assets/img/llcolor.png'

exports.default = {
  github: 'https://github.com/radi-js/radi',
  slack: 'https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ',
  docs: '/docs',
  repl: '/fiddle',
  startingCode: 'state: {\n  count: 0\n}\n\n@action change(diff) {\n  return {\n    count: this.state.count + diff\n  }\n}\n\n<template>\n  <h2>{ this.state.count }</h2>\n\n  <button\n    class="btn"\n    disabled={ this.state.count <= 0 }\n    onclick={ () => -1 |> this.change }>\n    -\n  </button>\n\n  <button\n    class="btn"\n    onclick={ () => 1 |> this.change }>\n    +\n  </button>\n</template>'
};
},{}],34:[function(require,module,exports) {
var bundleURL = null;
function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp):\/\/[^)\n]+/g);
    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],18:[function(require,module,exports) {
var getBundleURL = require('./bundle-url').getBundleURL;

function loadBundlesLazy(bundles) {
  if (!Array.isArray(bundles)) {
    bundles = [bundles];
  }

  var id = bundles[bundles.length - 1];

  try {
    return Promise.resolve(require(id));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return new LazyPromise(function (resolve, reject) {
        loadBundles(bundles).then(resolve, reject);
      });
    }

    throw err;
  }
}

function loadBundles(bundles) {
  var id = bundles[bundles.length - 1];

  return Promise.all(bundles.slice(0, -1).map(loadBundle)).then(function () {
    return require(id);
  });
}

var bundleLoaders = {};
function registerBundleLoader(type, loader) {
  bundleLoaders[type] = loader;
}

module.exports = exports = loadBundlesLazy;
exports.load = loadBundles;
exports.register = registerBundleLoader;

var bundles = {};
function loadBundle(bundle) {
  var id;
  if (Array.isArray(bundle)) {
    id = bundle[1];
    bundle = bundle[0];
  }

  if (bundles[bundle]) {
    return bundles[bundle];
  }

  var type = (bundle.substring(bundle.lastIndexOf('.') + 1, bundle.length) || bundle).toLowerCase();
  var bundleLoader = bundleLoaders[type];
  if (bundleLoader) {
    return bundles[bundle] = bundleLoader(getBundleURL() + bundle).then(function (resolved) {
      if (resolved) {
        module.bundle.modules[id] = [function (require, module) {
          module.exports = resolved;
        }, {}];
      }

      return resolved;
    });
  }
}

function LazyPromise(executor) {
  this.executor = executor;
  this.promise = null;
}

LazyPromise.prototype.then = function (onSuccess, onError) {
  return this.promise || (this.promise = new Promise(this.executor).then(onSuccess, onError));
};

LazyPromise.prototype.catch = function (onError) {
  return this.promise || (this.promise = new Promise(this.executor).catch(onError));
};
},{"./bundle-url":34}],15:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _routes;

var _globals = require('./helpers/globals');

var _globals2 = _interopRequireDefault(_globals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// import docs from './helpers/docs';

exports.default = {
  routes: (_routes = {
    '/': {
      component: function component() {
        return require("_bundle_loader")(require.resolve('./pages/Index.radi'));
      }
    }
  }, _defineProperty(_routes, _globals2.default.repl, {
    component: function component() {
      return require("_bundle_loader")(require.resolve('./pages/Repl.radi'));
    },
    children: {
      '/:code': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/Repl.radi'));
        }
      }
    }
  }), _defineProperty(_routes, _globals2.default.docs, {
    component: function component() {
      return require("_bundle_loader")(require.resolve('./pages/docs/Introduction.radi'));
    },
    // children: docs.list.reduce((acc, value) => {
    //   return Object.assign(acc, {
    //     [value.link]: {
    //       component: () => import('./pages/docs/' + value.name + '.radi'),
    //     },
    //   });
    // }, {}),
    children: {
      '/installation': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/Installation.radi'));
        }
      },
      '/hyperscript': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/Hyperscript.radi'));
        }
      },
      '/components': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/Components.radi'));
        }
      },
      '/state': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/State.radi'));
        }
      },
      '/actions': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/Actions.radi'));
        }
      },
      '/view': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/View.radi'));
        }
      },
      '/listener': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/Listener.radi'));
        }
      },
      '/events': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/Events.radi'));
        }
      },
      '/headless-components': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/HeadlessComponents.radi'));
        }
      },
      '/plugin': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/Plugin.radi'));
        }
      },
      '/mount': {
        component: function component() {
          return require("_bundle_loader")(require.resolve('./pages/docs/Mount.radi'));
        }
      }
    }
  }), _routes)
  // beforeEach(to, from, next) {
  //   if (to === '/restricted') {
  //     next(false)
  //   } else {
  //     next()
  //   }
  // },
  // afterEach(to, from) {
  //   console.log('This triggers after every route change', to, from)
  // },
};
},{"./helpers/globals":21,"_bundle_loader":18,"./pages/Index.radi":[["c8dcae0a69732e03b210fd058e9198c8.js",19],"c8dcae0a69732e03b210fd058e9198c8.map",["6e70ba7b1d89921e1828e15e26d37127.svg",73],"c8dcae0a69732e03b210fd058e9198c8.css",["ec1044bce9e69aa95df108c9581b0106.png",59],["94d93683a2ebc1a16ed11e7e5c5b09c6.png",60],["68eaf9dda3323f75544cfa111b82b69c.png",61],["90e891bd752da22c18abff180dd8bef9.png",62],["7dac33bb14b9cd6b71ac140d422436f5.png",63],["e63612f23f466482c9d44de0328f92d1.png",64],["4a4cbae5cc9695d074dc7d3e89ed3361.png",65],["866d1a29ff9d6e555a3ce13f0701e90f.png",66],["6fde0edafe606b5119b8fd221444d322.png",67],["0a1ab65f258cdc331a91f1aa5c19ab56.png",68],19],"./pages/Repl.radi":[["7fc0d4a50ff645b1a1d2ac433087a5da.js",20],"7fc0d4a50ff645b1a1d2ac433087a5da.map","7fc0d4a50ff645b1a1d2ac433087a5da.css",20],"./pages/docs/Introduction.radi":[["6c40c1ebffac474856d213c5f6c0a0f6.js",23],"6c40c1ebffac474856d213c5f6c0a0f6.map",23],"./pages/docs/Installation.radi":[["9ca4b6ef18cb1ad75020484ca3a92949.js",22],"9ca4b6ef18cb1ad75020484ca3a92949.map",22],"./pages/docs/Hyperscript.radi":[["febe99e4e30f8cbc24a25a841666e4ca.js",24],"febe99e4e30f8cbc24a25a841666e4ca.map",24],"./pages/docs/Components.radi":[["fcb10d66e4a983a5d80cb9b2493e4462.js",25],"fcb10d66e4a983a5d80cb9b2493e4462.map",25],"./pages/docs/State.radi":[["aa924706c8490558ea487b3a48015eb7.js",27],"aa924706c8490558ea487b3a48015eb7.map",27],"./pages/docs/Actions.radi":[["8881f6b1d97e538095b5d9959ae76432.js",26],"8881f6b1d97e538095b5d9959ae76432.map",26],"./pages/docs/View.radi":[["9fd16ad3d6b1760420b279ae51e5eb46.js",29],"9fd16ad3d6b1760420b279ae51e5eb46.map",29],"./pages/docs/Listener.radi":[["f5264e3e912f4f1852540286e50968cb.js",30],"f5264e3e912f4f1852540286e50968cb.map",30],"./pages/docs/Events.radi":[["f6ec8c37f5cbdd110304e6dc9f922e7a.js",28],"f6ec8c37f5cbdd110304e6dc9f922e7a.map",28],"./pages/docs/HeadlessComponents.radi":[["c3fa139353c849197666d546cdb5392d.js",31],"c3fa139353c849197666d546cdb5392d.map",31],"./pages/docs/Plugin.radi":[["7c9e9d645d84737cb6bae411a7f049a0.js",32],"7c9e9d645d84737cb6bae411a7f049a0.map",32],"./pages/docs/Mount.radi":[["7406b75c376fd94088325c6c5578c6c5.js",33],"7406b75c376fd94088325c6c5578c6c5.map",33]}],9:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

var _radiRouter = require('../../radi-router');

var _radiRouter2 = _interopRequireDefault(_radiRouter);

var _routes = require('./routes.js');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var _radi$plugin = _radi3.default.plugin(_radiRouter2.default, _routes2.default),
    Router = _radi$plugin.Router,
    Link = _radi$plugin.Link;

window.Link = Link;

{}

var App = function (_radi$Component) {
  _inherits(App, _radi$Component);

  function App() {
    var _ref;

    _classCallCheck(this, App);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = App.__proto__ || Object.getPrototypeOf(App)).call.apply(_ref, [this].concat(args)));

    _this.state = {};
    _this.on = {};
    return _this;
  }

  _createClass(App, [{
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(Router, null)];
    }
  }]);

  return App;
}(_radi3.default.Component);

exports.default = App;
;
},{"radi":13,"../../radi-router":17,"./routes.js":15}],11:[function(require,module,exports) {

},{}],5:[function(require,module,exports) {
'use strict';

var _App = require('./app/App.radi');

var _App2 = _interopRequireDefault(_App);

var _radi = require('radi');

require('./assets/stylus/main.styl');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.loadJS = function (url, fn) {
  var scriptTag = document.createElement('script');
  scriptTag.src = url;

  scriptTag.onload = fn;
  scriptTag.onreadystatechange = fn;

  document.body.appendChild(scriptTag);
};

// var a = new App()

// console.log(a, a.render())

// var toDestroy = mount([
//   r('div', { id: 'hell' },
//     r(App),
//     r('h1', { style: 'font-size: 20px;' }, 'Hello World 1'),
//     r('h1', {}, 'Hello World 2'),
//     r('button', {onclick: () => { console.log('lel') }}, 'Hello World 2'),
//   )]
// , app);

var toDestroy = (0, _radi.mount)((0, _radi.r)(_App2.default), app);

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(function () {
    // Before restarting the app, we create a new root element and dispose the old one
    if (toDestroy) {
      for (var i = 0; i < toDestroy.length; i++) {
        toDestroy[i].destroy();
      }
    }
    var del = document.getElementById('app');
    del.parentNode.replaceChild(del.cloneNode(false), del);
  });
}
},{"./app/App.radi":9,"radi":13,"./assets/stylus/main.styl":11}],76:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.declare = declare;

function declare(builder) {
  return function (api, options, dirname) {
    if (!api.assertVersion) {
      api = Object.assign(copyApiObject(api), {
        assertVersion: function assertVersion(range) {
          throwVersionError(range, api.version);
        }
      });
    }

    return builder(api, options || {}, dirname);
  };
}

function copyApiObject(api) {
  var proto = null;

  if (typeof api.version === "string" && /^7\./.test(api.version)) {
    proto = Object.getPrototypeOf(api);

    if (proto && (!has(proto, "version") || !has(proto, "transform") || !has(proto, "template") || !has(proto, "types"))) {
      proto = null;
    }
  }

  return Object.assign({}, proto, api);
}

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function throwVersionError(range, version) {
  if (typeof range === "number") {
    if (!Number.isInteger(range)) {
      throw new Error("Expected string or integer value.");
    }

    range = "^" + range + ".0.0-0";
  }

  if (typeof range !== "string") {
    throw new Error("Expected string or integer value.");
  }

  var limit = Error.stackTraceLimit;

  if (typeof limit === "number" && limit < 25) {
    Error.stackTraceLimit = 25;
  }

  var err;

  if (version.slice(0, 2) === "7.") {
    err = new Error("Requires Babel \"^7.0.0-beta.41\", but was loaded with \"" + version + "\". " + "You'll need to update your @babel/core version.");
  } else {
    err = new Error("Requires Babel \"" + range + "\", but was loaded with \"" + version + "\". " + "If you are sure you have a compatible version of @babel/core, " + "it is likely that something in your build process is loading the " + "wrong version. Inspect the stack trace of this error to look for " + "the first entry that doesn't mention \"@babel/core\" or \"babel-core\" " + "to see what is calling Babel.");
  }

  if (typeof limit === "number") {
    Error.stackTraceLimit = limit;
  }

  throw Object.assign(err, {
    code: "BABEL_VERSION_UNSUPPORTED",
    version: version,
    range: range
  });
}
},{}],70:[function(require,module,exports) {
const { declare } = require("@babel/helper-plugin-utils");

module.exports = declare(({types: t}, options) => {

  const PRAGMA_DEFAULT = options.pragma || 'l';
  const LISTEN_ANNOTATION_REGEX = /\*?\s*@radi-listen\s+([^\s]+)/;

  let pragma = PRAGMA_DEFAULT;

  function listener() {
    const expr = t.identifier(pragma);
    expr.isClean = true;
    return expr;
  }

  let args = [];

  let variables = {
    prefix: '_$',
    count: 0,
  }

  const getvar = () => variables.prefix.concat(variables.count++);

  const makeListener = (variable, expression) => {
    let newVariable = variable.slice(1)
    if (variable[0].process) {
      return t.callExpression(
        t.memberExpression(
          t.callExpression(
            listener(),
            variable[0].props
          ),
          t.identifier('process')
        ),
        [
          t.functionExpression(
            null,
            [variable[0].var],
            t.blockStatement([
              t.returnStatement(
                newVariable.length > 0 ? makeListener(newVariable, expression) : expression
              )
            ])
          )
        ]
      )
    } else {
      return t.callExpression(
        listener(),
        variable[0].props
      )
    }
  }

  Array.prototype.extract = function (path) {
    if (!path || !path.node) return;
    if (t.isIdentifier(path.node.property)) {
      this.unshift(t.stringLiteral(path.node.property.name));
    } else {
      this.unshift(path.node.property);
    }
    if (t.isIdentifier(path.node.object)) {
      this.unshift(path.node.object);
    }
  }

  return {
    visitor: {
      Program(path) {
        for (const comment of path.container.comments) {
          const matches = LISTEN_ANNOTATION_REGEX.exec(comment.value);
          if (matches) {
            pragma = matches[1];
          }
        }
      },
      JSXExpressionContainer(path) {
        if (!path) return;
        path.traverse({
          ThisExpression(thisPath) {
            thisPath.replaceWith(t.identifier('component'));
          }
        });
        // Handle object attribute like { style: { color: ... } }
        if (t.isObjectExpression(path.node.expression) && t.isJSXAttribute(path.parent)) {

          path.traverse({
            ObjectProperty(path) {
              // This isn't root member of Object
              if (!t.isObjectExpression(path.parent)) return;
              let gathered = [];
              path.traverse({
                MemberExpression(path) {
                  // This isn't root member of Object
                  if (t.isMemberExpression(path.parent)) return;

                  const isRoot = t.isJSXExpressionContainer(path.parent);

                  let extracted = [];

                  extracted.extract(path);
                  if (t.isMemberExpression(path.node.object)) {
                    path.traverse({
                      MemberExpression(path) {
                        extracted.extract(path);
                      },
                      ThisExpression(path) {
                        extracted.unshift(path.node);
                      },
                    });
                  }

                  // console.log('extracted', path.parentKey === callee);
                  let fn = (t.isCallExpression(path.parent) && path.parentKey === 'callee') && extracted.pop();

                  const DOLLAR = '$'.charCodeAt(0);

                  if (extracted[0]
                    && !t.isThisExpression(extracted[0])
                    && extracted[0].name !== 'component') return;
                  if (extracted[1] && extracted[1].value
                    && extracted[1].value.charCodeAt(0) === DOLLAR) {
                    extracted[0] = t.memberExpression(
                      extracted[0],
                      t.identifier(extracted[1].value),
                    );
                    extracted.splice(1, 1);
                  }
                  if (extracted[1] && extracted[1].name !== 'state') {
                    extracted.splice(1, 1);
                  }

                  if (extracted.length < 2) return;

                  // console.log('extracted', extracted);
                  // console.log('extracted', extracted.map(item => item.value || item.name));

                  // Should replace

                  let newvar = t.identifier(getvar());

                  if (t.isIdentifier(path.node.property)) {
                    path.node.property = t.stringLiteral(path.node.property.name);
                  }

                  gathered.push({
                    process: !(!fn && isRoot),
                    var: newvar,
                    props: extracted
                  })

                  path.replaceWith(t.expressionStatement(
                    fn ? t.memberExpression(newvar, t.identifier(fn.value)) : newvar,
                  ));
                }
              });

              if (gathered.length > 0) {
            	  path.replaceWith(
                  t.ObjectProperty(
                    path.node.key,
                    makeListener(gathered, path.node.value),
                  )
                );
              }
            }
          });

        } else {
          let gathered = [];

          path.traverse({
            JSXExpressionContainer(path) {
              path.skip();
            },
            MemberExpression(path) {
              // This isn't root member of Object
              if (t.isMemberExpression(path.parent)) return;

              const isRoot = t.isJSXExpressionContainer(path.parent);

              let extracted = [];

              extracted.extract(path);
              if (t.isMemberExpression(path.node.object)) {
                path.traverse({
                  MemberExpression(path) {
                    extracted.extract(path);
                  },
                  ThisExpression(path) {
                    extracted.unshift(path.node);
                  },
                });
              }

              // console.log('extracted', path.parentKey === callee);
              let fn = (t.isCallExpression(path.parent) && path.parentKey === 'callee') && extracted.pop();

              const DOLLAR = '$'.charCodeAt(0);

              if (extracted[0]
                && !t.isThisExpression(extracted[0])
                && extracted[0].name !== 'component') return;
              if (extracted[1] && extracted[1].value
                && extracted[1].value.charCodeAt(0) === DOLLAR) {
                extracted[0] = t.memberExpression(
                  extracted[0],
                  t.identifier(extracted[1].value),
                );
                extracted.splice(1, 1);
              }
              if (extracted[1] && extracted[1].name !== 'state') {
                extracted.splice(1, 1);
              }

              if (extracted.length < 2) return;

              // console.log('extracted', extracted);
              // console.log('extracted', extracted.map(item => item.value || item.name));

              // Should replace

              let newvar = t.identifier(getvar());

              if (t.isIdentifier(path.node.property)) {
                path.node.property = t.stringLiteral(path.node.property.name);
              }

              gathered.push({
                process: !(!fn && isRoot),
                var: newvar,
                props: extracted
              })

              path.replaceWith(t.expressionStatement(
                fn ? t.memberExpression(newvar, t.identifier(fn.value)) : newvar,
              ));
            }
          });

          if (gathered.length > 0) {
            if (t.isJSXAttribute(path.parent)) {
          	  path.replaceWith(
                t.JSXExpressionContainer(
                  makeListener(gathered, path.node.expression)
                )
              );
            } else {
          	  path.replaceWith(
                makeListener(gathered, path.node.expression)
              );
            }
          }

        }
      }
    }
  }

})

},{"@babel/helper-plugin-utils":76}],69:[function(require,module,exports) {
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var FINDTOKENS = /__RTOKEN-([A-Za-z0-9-_]+):([0-9]+);/g;

var definitions = {
  comment: {
    regex: /((?:\/\*(?:[^*]|[\r\n]|(?:\*+([^*\/]|[\r\n])))*\*+\/)|(?:(^|[^\:])\/\/.*))/
  },
  state: {
    regex: /(?:^|\s)state(?:\s|:|)+\{/,
    extract: [-1, '{', '}']
  },
  on: {
    regex: /(?:^|\s)on(?:\s|:|)+\{/,
    extract: [-1, '{', '}']
  },
  node: {
    // regex: /(?:{\/\*[^\*]+?\*\/\}|<([A-Za-z][A-Za-z0-9-_]*?)(?:\/>|\b[^>]*>([^<\/]*?|[\s\S]+?)<\/\1>))/,
    regex: /(?:{\/\*[^\*]+?\*\/\}|<([A-Za-z][A-Za-z0-9-_]*?)(?:\/>|\b[^>]*>(?:[^{]+({[\s\S]*[^}]+})[^<\\]+|([^<\/]*?|[\s\S]+?))<\/\1>))/,
    custom: function custom(input) {
      return input.replace(/this\.state/g, 'component.state');
    }
  },
  method: {
    // regex: /(?:(@[\w]+|[\w]+)*[^\b])(\w+)\s*\([^)]*\)\s*({(?:{[^{}]*(?:{[^{}]*}|[\s\S])*?[^{}]*}|[\s\S])*?})/,
    regex: /(?:(?:@[\w]+|[\w]+)*[^\b])(?:\w+)\s*\([^)]*\)\s*\{/,
    extract: [-1, '{', '}'],
    matchToo: true,
    multiple: true
  }
  // method: /(?:(@[\w]+|[\w]+)*[^\b])(\w+)\s*\([^)]*\)\s*({(?:{[^{}]*(?:{[^{}]*}|[\s\S])*?[^{}]*}|[\s\S])*?})/,
  // function: /(\w+)\s*\([^)]*\)\s*({(?:{[^{}]*(?:{[^{}]*}|[\s\S])*?[^{}]*}|[\s\S])*?})/,
};

var savedTokens = {};

var template = function template(_ref, name, outside) {
  var on = _ref.on,
      state = _ref.state,
      method = _ref.method,
      node = _ref.node;
  return ('\n  /** @jsx Radi.r **/\n  /** @radi-listen Radi_listen **/\n\n  const action = Radi.action;\n  const subscribe = Radi.subscribe;\n  const Radi_listen = Radi.listen;\n\n  ' + (outside || '') + '\n\n  class ' + (name || '') + ' extends Radi.Component {\n    constructor(...args) {\n      super(...args);\n      this.state = ' + (state || '{}') + ';\n      this.on = ' + (on || '{}') + ';\n    }\n\n    ' + (method ? method.join('\n\n') : '') + '\n\n    ' + (node && 'view() {\n        const component = this;\n        return [' + node.join(', ') + '];\n      }' || '') + '\n\n  }\n').trim();
};

var remapCode = function remapCode(input) {
  var output = input.replace(FINDTOKENS, function (match, type, id) {
    return savedTokens[type][id].match;
  });
  return output === input ? output : remapCode(output);
};

var rebuild = function rebuild(code, name) {
  var out = {};
  var output = code.replace(FINDTOKENS, function (match, type, id) {
    if (typeof out[type] === 'undefined') out[type] = [];
    out[type].push(remapCode(savedTokens[type][id].match));
    return '';
  }).trim();

  return template(out, name, output);
};

var parse = function parse(name, code, cb) {

  savedTokens = {};

  var saveToken = function saveToken(type, contents, match, input) {
    if (typeof savedTokens[type] === 'undefined') savedTokens[type] = [];
    if (typeof definitions[type].custom === 'function') {
      match = definitions[type].custom(match);
      input = definitions[type].custom(input);
    }
    var i = savedTokens[type].push({
      type: type,
      contents: contents,
      match: match,
      input: input
    });
    return '__RTOKEN-' + type + ':' + (i - 1) + ';';
  };

  var tokenize = function tokenize(type, CODE) {
    var replaced = CODE.replace(definitions[type].regex, function (match) {
      for (var _len = arguments.length, contents = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        contents[_key - 1] = arguments[_key];
      }

      var input = contents.splice(-1)[0];
      var offset = contents.splice(-1)[0];
      return saveToken(type, [].concat(contents), match, input);
    });
    return replaced === CODE ? CODE : tokenize(type, replaced);
  };

  // Extracts classes and contents from code
  var extract = function extract(type, CODE) {
    var find = definitions[type].regex;

    var _definitions$type$ext = _slicedToArray(definitions[type].extract, 3),
        mod = _definitions$type$ext[0],
        first = _definitions$type$ext[1],
        last = _definitions$type$ext[2];

    var L = first.charCodeAt(0);
    var R = last.charCodeAt(0);

    var match = CODE.match(find);
    if (!match) return CODE;
    var indexState = match.index + match[0].length;

    var diff = 1;
    var endIndex = -1;

    for (var i = indexState; i <= CODE.length; i++) {
      if (CODE.charCodeAt(i) === L) diff += 1;else if (CODE.charCodeAt(i) === R) diff -= 1;

      if (diff === 0) {
        endIndex = i + 1;
        break;
      }
    }
    if (endIndex < 0) {
      throw new Error('Cannot find end for ' + type + ' in "' + name + '": ' + match[0].replace(/\n/g, '') + '...');
      return CODE;
    }

    var out = CODE.substring(indexState + (definitions[type].matchToo ? -match[0].length : mod), endIndex);

    var tokenID = saveToken(type, ['state'], out, out);

    var input = CODE.substr(0, match.index).concat(tokenID).concat(CODE.substring(endIndex, CODE.length));

    if (definitions[type].multiple && CODE.match(find)) {
      input = extract(type, input);
    }

    return input;
  };

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(definitions)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var type = _step.value;

      code = typeof definitions[type].extract !== 'undefined' ? extract(type, code) : tokenize(type, code);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var parsed = rebuild(code, name);

  if (typeof cb === 'function') cb(savedTokens, code, parsed);
  return parsed;
};

module.exports = parse;
},{}],56:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = search;
function search(x, y) {
  var list = x.toLowerCase().replace(/  /g, ' ').replace(/[^a-zA-z\d]+/g, ' ').trim().split(' ');
  var y2 = y.toLowerCase();
  var score = 0;
  var step = 100 / list.length / 2;
  for (var i = 0; i < list.length; i++) {
    var strength = 2 - 2 / list.length * i;
    if (y2.indexOf(list[i]) >= 0) score += step * strength;
    if (new RegExp('(^|\\b)' + list[i] + '($|\\b)', 'g').test(y2)) score += step * strength;
  }
  return score;
}
},{}],45:[function(require,module,exports) {
module.exports=`<h2 id="introduction">Introduction</h2>
<p><strong>Radi</strong> is a tiny javascript framework.</p>
<p><a href="https://www.npmjs.com/package/radi"><img src="https://img.shields.io/npm/v/radi.svg?style=flat-square" alt="npm version"></a>
<a href="https://www.npmjs.com/package/radi"><img src="https://img.shields.io/npm/dm/radi.svg?style=flat-square" alt="npm downloads"></a>
<a href="https://unpkg.com/radi@latest/dist/radi.js"><img src="http://img.badgesize.io/https://unpkg.com/radi@latest/dist/radi.es.min.js?compression=gzip&amp;style=flat-square" alt="gzip bundle size"></a>
<a href="https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ"><img src="https://img.shields.io/badge/slack-radijs-3eb891.svg?style=flat-square" alt="radi workspace on slack"></a></p>
<p>It&#39;s built quite differently from any other framework. It doesn&#39;t use any kind of diffing algorithm nor virtual dom which makes it really fast.</p>
<p>With Radi you can create any kind of single-page applications or more complex applications.</p>
`
},{}],41:[function(require,module,exports) {
module.exports=`<h2 id="installation">Installation</h2>
<p>Install with npm or Yarn.</p>
<pre><code>npm i radi
</code></pre><p>Then with a module bundler like <a href="https://rollupjs.org/">Rollup</a> or <a href="https://webpack.js.org/">Webpack</a>, use as you would anything else.</p>
<pre><code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> Component<span class="token punctuation">,</span> mount <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">"radi"</span></code></pre>

<p>If you don&#39;t want to set up a build environment, you can download Radi from a CDN like <a href="https://unpkg.com/radi@latest/dist/radi.min.js">unpkg.com</a> and it will be globally available through the window.Radi object. We support all ES5-compliant browsers, including Internet Explorer 10 and above.</p>
<pre><code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span> <span class="token attr-name">src</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>https://unpkg.com/radi@latest/dist/radi.min.js<span class="token punctuation">"</span></span><span class="token punctuation">></span></span><span class="token script language-javascript"></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script language-javascript">
  <span class="token keyword">const</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> Component<span class="token punctuation">,</span> mount <span class="token punctuation">}</span> <span class="token operator">=</span> Radi<span class="token punctuation">;</span>
  <span class="token operator">...</span>
</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code></pre>
`
},{}],44:[function(require,module,exports) {
module.exports=`<h2 id="hyperscript">Hyperscript</h2>
<p><code>r</code> is a helper for <code>document.createElement</code> with couple of differences.
The basic idea is to simply create elements with <code>r</code> and mount them with <code>mount</code>, almost like you would do with plain JavaScript:</p>
<pre><code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> mount <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">const</span> hello <span class="token operator">=</span> <span class="token function">r</span><span class="token punctuation">(</span><span class="token string">'h1'</span><span class="token punctuation">,</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token string">'Hello Radi!'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token function">mount</span><span class="token punctuation">(</span>hello<span class="token punctuation">,</span> document<span class="token punctuation">.</span>body<span class="token punctuation">)</span><span class="token punctuation">;</span></code></pre>

<pre><code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>body</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span>Hello Radi!<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>body</span><span class="token punctuation">></span></span></code></pre>
`
},{}],42:[function(require,module,exports) {
module.exports=`<h2 id="components">Components</h2>
<p>Simply define a class or function that extends <code>Radi.Component</code>. It can have <code>state</code> method that returns <a href="#state">state object</a>, <code>view</code> method that returns <a href="#view">view data</a> and any other methods that can be decorated as <a href="#actions">action</a>. State can also be defined inside <code>constructor</code> as simple object. But <code>view</code> must always be method.</p>
<pre><code class="language-jsx"><span class="token keyword">import</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> l<span class="token punctuation">,</span> action<span class="token punctuation">,</span> Component <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">Counter</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">state</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      count<span class="token punctuation">:</span> <span class="token number">0</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  @action
  <span class="token function">up</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      count<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>count <span class="token operator">+</span> <span class="token number">1</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">view</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">[</span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>count <span class="token punctuation">}</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">,</span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>button</span> <span class="token attr-name">onclick</span><span class="token script language-javascript"><span class="token script-punctuation punctuation">=</span><span class="token punctuation">{</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">up</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">}</span></span><span class="token punctuation">></span></span><span class="token operator">+</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
    <span class="token punctuation">]</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>
`
},{}],43:[function(require,module,exports) {
module.exports=`<h2 id="state">State</h2>
<p>State is a plain JS object that describes your entire program. Data in it cannot be changed once created, it can only be updated with actions or <code>setState</code> method that is part of Component.</p>
<pre><code class="language-js"><span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
  name<span class="token punctuation">:</span> <span class="token string">'John'</span>
<span class="token punctuation">}</span></code></pre>
`
},{}],48:[function(require,module,exports) {
module.exports=`<h2 id="actions">Actions</h2>
<p>One of the ways to change state is with actions. Every action is regular class method that has been decorated with <code>@action</code> decorator. It must return state changes to modify state.</p>
<pre><code class="language-js">@action
<span class="token function">rename</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">{</span>
    name<span class="token punctuation">:</span> <span class="token string">'Steve'</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>

<p>State is always immutable. Do not mutate it without returning state change in action. DOM will not be re-rendered that way.</p>
`
},{}],47:[function(require,module,exports) {
module.exports=`<h2 id="view">View</h2>
<p>View is a function in Component class that returns <a href="#hyperscript">Hyperscript</a>/JSX nodes, DOM Nodes, Component or Array of these three.</p>
<pre><code class="language-jsx"><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">view</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span>Hello World<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span>
<span class="token punctuation">}</span></code></pre>

<pre><code class="language-jsx"><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">view</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MyComponent</span> <span class="token punctuation">/></span></span>
<span class="token punctuation">}</span></code></pre>

<pre><code class="language-jsx"><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">view</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">[</span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">,</span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MyComponent</span><span class="token punctuation">></span></span><span class="token punctuation">,</span>
    document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">'foo'</span><span class="token punctuation">)</span>
  <span class="token punctuation">]</span>
<span class="token punctuation">}</span></code></pre>

<p>View is rendered only once when Component is mounted or re-mounted. This is where Radi differs from other frameworks - it doesn&#39;t re render whole view, instead it uses <a href="#listener">Listener</a> to re-render only necessary parts of DOM.
So if you write logic inside <code>view</code> method before return statement, it will NOT be triggered every time something updates.</p>
`
},{}],51:[function(require,module,exports) {
module.exports=`<h2 id="listener">Listener</h2>
<p><strong>NOTE:</strong>  Radi has a <a href="https://github.com/radi-js/babel-plugin-transform-radi-listen">babel transformer plugin</a> for listeners to be handled automatically (just like transformation from JSX to <a href="#hyperscript">hyperscript</a>).</p>
<p>Listeners watch for changes in the state of the assigned component and if changes happen it is responsible for re-rendering that part of view and updating it in DOM.
Listener expects to receive component that it should listen to and path of state to listen to.</p>
<pre><code class="language-jsx"><span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
  person<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    name<span class="token punctuation">:</span> <span class="token string">'John'</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
<span class="token operator">...</span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">{</span> <span class="token function">listener</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token string">'person'</span><span class="token punctuation">,</span> <span class="token string">'name'</span><span class="token punctuation">)</span> <span class="token punctuation">}</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span></code></pre>

<p>Listeners can also do some processing with that state value.</p>
<pre><code class="language-jsx"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">{</span> <span class="token function">listener</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token string">'count'</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">process</span><span class="token punctuation">(</span>count <span class="token operator">=></span> count <span class="token operator">+</span> <span class="token number">50</span><span class="token punctuation">)</span> <span class="token punctuation">}</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span></code></pre>
`
},{}],46:[function(require,module,exports) {
module.exports=`<h2 id="events">Events</h2>
<p>Events are part of <code>on</code> method in every Component. It can also be defined inside <code>constructor</code> as simple object. Every method that is part of it is event handler. Every event can also be an <a href="#actions">action</a>.</p>
<pre><code class="language-js"><span class="token keyword">this</span><span class="token punctuation">.</span>on <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token function">buyMilk</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>milk <span class="token operator">===</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Milk not found'</span><span class="token punctuation">)</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
      console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Here you go'</span><span class="token punctuation">)</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  @action
  <span class="token function">outOfMilk</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      milk<span class="token punctuation">:</span> <span class="token number">0</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>

<pre><code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">{</span> action<span class="token punctuation">,</span> Component <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">Grandma</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">state</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      status<span class="token punctuation">:</span> <span class="token string">'busy'</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">on</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      <span class="token function">callGrandma</span><span class="token punctuation">(</span>whatToSay<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Grandma is '</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>status<span class="token punctuation">,</span> <span class="token string">'try to say'</span><span class="token punctuation">,</span> whatToSay<span class="token punctuation">,</span> <span class="token string">'again later'</span><span class="token punctuation">)</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">call</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">trigger</span><span class="token punctuation">(</span><span class="token string">'callGrandma'</span><span class="token punctuation">,</span> <span class="token string">'hello'</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>

<h3 id="component-lifecycle">Component lifecycle</h3>
<p>Radi supports lifecycle events for Components. Currently two events are defined: <code>mount</code> and <code>destroy</code>.</p>
<ul>
<li>When Component gets mounted, <code>mount</code> gets called.</li>
<li>If Component gets unmounted and is no longer part of DOM, <code>destroy</code> gets called.</li>
</ul>
<pre><code class="language-js"><span class="token keyword">this</span><span class="token punctuation">.</span>on <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token function">mount</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'I just got mounted'</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token function">destroy</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Components view was destroyed, but I can still be mounted again'</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>

<h3 id="global-event-handling">Global event handling</h3>
<p>Coming Soon</p>
`
},{}],49:[function(require,module,exports) {
module.exports=`<h2 id="headless-components">Headless Components</h2>
<p>Components can also be registered as headless (without view). These are components that live in other components as contained mixins and handle logic, events and rendering. This is useful for plugins that handle global data and some logic.</p>
<pre><code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">{</span> action<span class="token punctuation">,</span> headless<span class="token punctuation">,</span> Component <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">GlobalComponent</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">state</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      count<span class="token punctuation">:</span> <span class="token number">0</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  @action <span class="token function">tick</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      count<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>count <span class="token operator">+</span> <span class="token number">1</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">on</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      <span class="token function">mount</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">setInterval</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
          <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">tick</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
        <span class="token punctuation">}</span><span class="token punctuation">)</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token function">headless</span><span class="token punctuation">(</span><span class="token string">'myGlobalComponent'</span><span class="token punctuation">,</span> GlobalComponent<span class="token punctuation">)</span></code></pre>

<p>Now that we registered headless component it can be accessed by every component with dollar sign + handle name <code>this.$myGlobalComponent</code>.</p>
<pre><code class="language-jsx"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">{</span> <span class="token function">listen</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>$myGlobalComponent<span class="token punctuation">,</span> <span class="token string">'count'</span><span class="token punctuation">)</span> <span class="token punctuation">}</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span></code></pre>

<p>This will output <code>GlobalComponent</code> state.count output.</p>
`
},{}],50:[function(require,module,exports) {
module.exports=`<h2 id="plugin">Plugin</h2>
<p>Plugin is a function that expects a callback function that takes current Radi scope as first argument. This way we can register plugins easily to the current scope of Radi.</p>
<pre><code class="language-js"><span class="token keyword">import</span> plugin <span class="token keyword">from</span> <span class="token string">'radi'</span>

<span class="token keyword">const</span> <span class="token function-variable function">myCoolPlugin</span> <span class="token operator">=</span> _radi <span class="token operator">=></span> <span class="token punctuation">{</span>
  <span class="token comment">// Your plugins logic here</span>
  <span class="token comment">// create _radi.Component, make it headless, sky is the limit</span>
  <span class="token comment">// can also return anyhing</span>
  <span class="token keyword">return</span> <span class="token punctuation">{</span>
    mom<span class="token punctuation">:</span> <span class="token string">'hi'</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">const</span> <span class="token punctuation">{</span> mom <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">plugin</span><span class="token punctuation">(</span>myCoolPlugin<span class="token punctuation">)</span>
<span class="token comment">// mom = 'hi'</span></code></pre>
`
},{}],52:[function(require,module,exports) {
module.exports=`<h2 id="mount">Mount</h2>
<p>Mount is a function that will mount anything that <a href="#view">view</a> returns (<a href="#hyperscript">Hyperscript</a>/JSX nodes, DOM Nodes, Component or Array of these three) to any DOM node. This is how we mount our Apps root component to DOM.</p>
<pre><code class="language-jsx"><span class="token keyword">import</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> mount<span class="token punctuation">,</span> Component <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">MyComponent</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token operator">...</span>
<span class="token punctuation">}</span>

<span class="token function">mount</span><span class="token punctuation">(</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MyComponent</span> <span class="token punctuation">/></span></span><span class="token punctuation">,</span> document<span class="token punctuation">.</span>body<span class="token punctuation">)</span></code></pre>
`
},{}],39:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readme = require('radi/docs/readme.md');

var _readme2 = _interopRequireDefault(_readme);

var _installation = require('radi/docs/installation.md');

var _installation2 = _interopRequireDefault(_installation);

var _hyperscript = require('radi/docs/hyperscript.md');

var _hyperscript2 = _interopRequireDefault(_hyperscript);

var _components = require('radi/docs/components.md');

var _components2 = _interopRequireDefault(_components);

var _state = require('radi/docs/state.md');

var _state2 = _interopRequireDefault(_state);

var _actions = require('radi/docs/actions.md');

var _actions2 = _interopRequireDefault(_actions);

var _view = require('radi/docs/view.md');

var _view2 = _interopRequireDefault(_view);

var _listener = require('radi/docs/listener.md');

var _listener2 = _interopRequireDefault(_listener);

var _events = require('radi/docs/events.md');

var _events2 = _interopRequireDefault(_events);

var _headlessComponents = require('radi/docs/headless-components.md');

var _headlessComponents2 = _interopRequireDefault(_headlessComponents);

var _plugin = require('radi/docs/plugin.md');

var _plugin2 = _interopRequireDefault(_plugin);

var _mount = require('radi/docs/mount.md');

var _mount2 = _interopRequireDefault(_mount);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  introduction: _readme2.default,
  installation: _installation2.default,
  hyperscript: _hyperscript2.default,
  components: _components2.default,
  state: _state2.default,
  actions: _actions2.default,
  view: _view2.default,
  listener: _listener2.default,
  events: _events2.default,
  headlessComponents: _headlessComponents2.default,
  plugin: _plugin2.default,
  mount: _mount2.default
};
},{"radi/docs/readme.md":45,"radi/docs/installation.md":41,"radi/docs/hyperscript.md":44,"radi/docs/components.md":42,"radi/docs/state.md":43,"radi/docs/actions.md":48,"radi/docs/view.md":47,"radi/docs/listener.md":51,"radi/docs/events.md":46,"radi/docs/headless-components.md":49,"radi/docs/plugin.md":50,"radi/docs/mount.md":52}],55:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _docsBundle = require('./docs-bundle.js');

var _docsBundle2 = _interopRequireDefault(_docsBundle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [{
  page: '/docs',
  title: 'Introduction',
  html: _docsBundle2.default.introduction,
  p: _docsBundle2.default.introduction.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/installation',
  title: 'Installation',
  html: _docsBundle2.default.installation,
  p: _docsBundle2.default.installation.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/hyperscript',
  title: 'Hyperscript',
  html: _docsBundle2.default.hyperscript,
  p: _docsBundle2.default.hyperscript.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/components',
  title: 'Components',
  html: _docsBundle2.default.components,
  p: _docsBundle2.default.components.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/state',
  title: 'State',
  html: _docsBundle2.default.state,
  p: _docsBundle2.default.state.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/actions',
  title: 'Actions',
  html: _docsBundle2.default.actions,
  p: _docsBundle2.default.actions.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/view',
  title: 'View',
  html: _docsBundle2.default.view,
  p: _docsBundle2.default.view.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/listener',
  title: 'Listener',
  html: _docsBundle2.default.listener,
  p: _docsBundle2.default.listener.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/events',
  title: 'Events',
  html: _docsBundle2.default.events,
  p: _docsBundle2.default.events.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/headless-components',
  title: 'Headless Components',
  html: _docsBundle2.default.headlessComponents,
  p: _docsBundle2.default.headlessComponents.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/plugin',
  title: 'Plugin',
  html: _docsBundle2.default.plugin,
  p: _docsBundle2.default.plugin.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}, {
  page: '/docs/mount',
  title: 'Mount',
  html: _docsBundle2.default.mount,
  p: _docsBundle2.default.mount.replace(/<\/?[^>]+(>|$)/g, '').split('. ')
}];
},{"./docs-bundle.js":39}],40:[function(require,module,exports) {
module.exports="b6c1be62ed6c8ad78806d81f751dd1d2.png";
},{}],36:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

var _globals = require('../helpers/globals');

var _globals2 = _interopRequireDefault(_globals);

var _logoLWhite = require('../../assets/img/logo-l-white.png');

var _logoLWhite2 = _interopRequireDefault(_logoLWhite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var Header = function (_radi$Component) {
  _inherits(Header, _radi$Component);

  function Header() {
    var _ref;

    _classCallCheck(this, Header);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = Header.__proto__ || Object.getPrototypeOf(Header)).call.apply(_ref, [this].concat(args)));

    _this.state = {
      location: null
    };
    _this.on = {};
    return _this;
  }

  _createClass(Header, [{
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(
        'header',
        { 'class': _radi_listen(component, 'location') },
        _radi3.default.r(
          'div',
          { 'class': 'wrapper' },
          _radi3.default.r(
            'div',
            { id: 'logo' },
            _radi3.default.r(
              Link,
              { to: '/' },
              _radi3.default.r('img', { src: _logoLWhite2.default, alt: '' })
            )
          ),
          _radi3.default.r(
            'ul',
            { id: 'main-menu' },
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs, core: true },
                'Docs'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.repl },
                'Try online'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                'a',
                { href: _globals2.default.slack, target: '_blank' },
                'Slack'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                'a',
                { href: _globals2.default.github, target: '_blank' },
                'GitHub'
              )
            )
          )
        )
      )];
    }
  }]);

  return Header;
}(_radi3.default.Component);

exports.default = Header;
;
},{"radi":13,"../helpers/globals":21,"../../assets/img/logo-l-white.png":40}],54:[function(require,module,exports) {
module.exports="db77c2553b3a5f7c089c98351a87b700.png";
},{}],38:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class; /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

require('github-markdown-css');

require('../../assets/stylus/docs.styl');

var _globals = require('../helpers/globals');

var _globals2 = _interopRequireDefault(_globals);

var _search = require('../helpers/search');

var _search2 = _interopRequireDefault(_search);

var _docs = require('../helpers/docs');

var _docs2 = _interopRequireDefault(_docs);

var _Header = require('../components/Header');

var _Header2 = _interopRequireDefault(_Header);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var DocsLayout = (_class = function (_radi$Component) {
  _inherits(DocsLayout, _radi$Component);

  function DocsLayout() {
    var _ref;

    _classCallCheck(this, DocsLayout);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = DocsLayout.__proto__ || Object.getPrototypeOf(DocsLayout)).call.apply(_ref, [this].concat(args)));

    _this.state = {
      searchOverlay: false,
      search: '',
      results: []
    };
    _this.on = {
      mount: function mount() {
        var _this2 = this;

        document.onkeydown = function (e) {
          return _this2.trigger('keydown', e);
        };
      },

      // @subscribe(document)
      keydown: function keydown(e) {
        if ((e.metaKey === true || e.ctrlKey === true) && e.keyCode === 70) {
          e.preventDefault();
          this.openSearch();
          return false;
        } else {
          this.searchKey(e);
        }
      }
    };
    return _this;
  }

  _createClass(DocsLayout, [{
    key: 'searchKey',
    value: function searchKey(e) {
      if (e.keyCode === 27) {
        this.closeSearch();
      }
    }
  }, {
    key: 'makeSearch',
    value: function makeSearch(e) {
      var phrase = e.target.value;

      if (phrase === '') {
        // this.noresults = phrase !== '' && this.results.length <= 0
        return { results: [] };
      }

      var treshold = 100;
      var res = [];
      for (var i = 0; i < _docs2.default.length; i++) {
        for (var n = 0; n < _docs2.default[i].p.length; n++) {
          var s = (0, _search2.default)(phrase, _docs2.default[i].p[n]);
          if (s >= treshold) res.push({
            term: _docs2.default[i].p[n],
            score: s,
            page: _docs2.default[i].page,
            title: _docs2.default[i].title
          });
        }
      }

      if (res.length <= 0) {
        return { results: [] };
      }

      return { results: res };
    }
  }, {
    key: 'closeSearch',
    value: function closeSearch() {
      return { searchOverlay: false };
    }
  }, {
    key: 'openSearch',
    value: function openSearch() {
      return { searchOverlay: true };
    }
  }, {
    key: 'addHighlight',
    value: function addHighlight(text) {
      return text.replace(new RegExp(this.state.search.trim().replace(/  /g, ' ').split(' ').join('|'), 'ig'), function (match) {
        return (
          // '{' + match + '}'
          '<span class="mark">' + match + '</span>'
        );
      });
    }
  }, {
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(
        'template',
        null,
        _radi3.default.r(_Header2.default, { location: 'at-docs' }),
        _radi3.default.r(
          'div',
          { id: 'docs-menu' },
          _radi3.default.r(
            'div',
            { 'class': 'docs-logo' },
            _radi3.default.r(
              Link,
              { to: '/' },
              _radi3.default.r('img', { src: require('../../assets/img/llcolor.png'), alt: '' })
            )
          ),
          _radi3.default.r(
            'ul',
            null,
            _radi3.default.r(
              'li',
              { 'class': 'search-btn-wrap' },
              _radi3.default.r(
                'button',
                { onclick: function onclick(e) {
                    return component.openSearch(e);
                  }, 'class': 'search-btn' },
                _radi3.default.r(
                  'i',
                  { 'class': 'material-icons' },
                  '\uE8B6'
                ),
                'Search docs'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs },
                'Introduction'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/installation' },
                'Installation'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/hyperscript' },
                'Hyperscript'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/components' },
                'Components'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/state' },
                'State'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/actions' },
                'Actions'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/view' },
                'View'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/listener' },
                'Listener'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/events' },
                'Events'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/headless-components' },
                'Headless Components'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/plugin' },
                'Plugin'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/mount' },
                'Mount'
              )
            ),
            _radi3.default.r('hr', null),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.repl },
                'Try online'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                'a',
                { href: _globals2.default.slack, target: '_blank' },
                'Slack'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                'a',
                { href: _globals2.default.github, target: '_blank' },
                'GitHub'
              )
            )
          )
        ),
        _radi3.default.r(
          'div',
          { 'class': 'docs-wrapper' },
          _radi_listen(component, 'searchOverlay').process(function (_$1) {
            return _$1 && _radi3.default.r(
              'div',
              { 'class': 'docs-search-wrapper' },
              _radi3.default.r('div', { 'class': 'docs-search-wrapper-bg', onclick: function onclick(e) {
                  return component.closeSearch();
                } }),
              _radi3.default.r(
                'div',
                { 'class': 'wrapper' },
                _radi3.default.r('input', { type: 'search', autofocus: 'true', onkeyup: function onkeyup(e) {
                    return component.makeSearch(e);
                  }, onkeydown: function onkeydown(e) {
                    return component.searchKey(e);
                  }, placeholder: 'Search..', model: _radi_listen(component, 'search') }),
                _radi_listen(component, 'results', 'length').process(function (_$3) {
                  return _$3 > 0 ? _radi3.default.r(
                    'ul',
                    { 'class': 'search-results' },
                    _radi_listen(component, 'results').process(function (_$4) {
                      return _$4.map(function (result) {
                        return _radi3.default.r(
                          'li',
                          null,
                          _radi3.default.r(
                            Link,
                            { to: result.page },
                            _radi3.default.r(
                              'strong',
                              null,
                              result.title
                            ),
                            _radi3.default.r('span', { html: component.addHighlight(result.term) })
                          )
                        );
                      });
                    })
                  ) : _radi3.default.r(
                    'div',
                    null,
                    'No results'
                  );
                })
              )
            );
          }),
          component.children,
          _radi3.default.r(
            'footer',
            null,
            _radi3.default.r(
              'p',
              null,
              'Edit this page on ',
              _radi3.default.r(
                'a',
                { href: 'https://github.com/radi-js/radi/docs', target: '_blank' },
                'Github'
              )
            )
          )
        )
      )];
    }
  }]);

  return DocsLayout;
}(_radi3.default.Component), (_applyDecoratedDescriptor(_class.prototype, 'makeSearch', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'makeSearch'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'closeSearch', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'closeSearch'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'openSearch', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'openSearch'), _class.prototype)), _class);
exports.default = DocsLayout;
;
},{"radi":13,"github-markdown-css":11,"../../assets/stylus/docs.styl":11,"../helpers/globals":21,"../helpers/search":56,"../helpers/docs":55,"../components/Header":36,"../../assets/img/llcolor.png":54}],78:[function(require,module,exports) {
module.exports = function loadCSSBundle(bundle) {
  return new Promise(function (resolve, reject) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = bundle;
    link.onerror = function (e) {
      link.onerror = link.onload = null;
      reject(e);
    };

    link.onload = function () {
      link.onerror = link.onload = null;
      resolve();
    };

    document.getElementsByTagName('head')[0].appendChild(link);
  });
};
},{}],79:[function(require,module,exports) {
module.exports = function loadJSBundle(bundle) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.src = bundle;
    script.onerror = function (e) {
      script.onerror = script.onload = null;
      reject(e);
    };

    script.onload = function () {
      script.onerror = script.onload = null;
      resolve();
    };

    document.getElementsByTagName('head')[0].appendChild(script);
  });
};
},{}],0:[function(require,module,exports) {
var b=require(18);b.register("css",require(78));b.register("js",require(79));
},{}]},{},[0,5])
//# sourceMappingURL=radi-website.map