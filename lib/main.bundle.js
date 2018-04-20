/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/webpack/buildin/harmony-module.js":
/*!*******************************************!*\
  !*** (webpack)/buildin/harmony-module.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(originalModule) {
	if (!originalModule.webpackPolyfill) {
		var module = Object.create(originalModule);
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		Object.defineProperty(module, "exports", {
			enumerable: true
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),

/***/ "./src/component/Component.js":
/*!************************************!*\
  !*** ./src/component/Component.js ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Component; });
/* harmony import */ var _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../consts/GLOBALS */ "./src/consts/GLOBALS.js");
/* harmony import */ var _utils_generateId__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/generateId */ "./src/utils/generateId.js");
/* harmony import */ var _utils_PrivateStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/PrivateStore */ "./src/component/utils/PrivateStore.js");
/* harmony import */ var _r_utils_fuseDom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../r/utils/fuseDom */ "./src/r/utils/fuseDom.js");
/* harmony import */ var _utils_clone__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/clone */ "./src/utils/clone.js");
/* harmony import */ var _utils_skipInProductionAndTest__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/skipInProductionAndTest */ "./src/utils/skipInProductionAndTest.js");
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
// -- we need those for..in loops for now!








class Component {
  /**
   * @param {Node[]|*[]} [children]
   * @param {object} [o.props]
   */
  constructor(children, props) {
    this.addNonEnumerableProperties({
      $id: Object(_utils_generateId__WEBPACK_IMPORTED_MODULE_1__["default"])(),
      $name: this.constructor.name,
      $config: (typeof this.config === 'function') ? this.config() : {
        listen: true,
      },
      $store: {},
      $events: {},
      $privateStore: new _utils_PrivateStore__WEBPACK_IMPORTED_MODULE_2__["default"](),
    });

    this.on = (typeof this.on === 'function') ? this.on() : {};
    this.children = [];

    // Appends headless components
    this.copyObjToInstance(_consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].HEADLESS_COMPONENTS, 'head');

    this.state = Object.assign(
      (typeof this.state === 'function') ? this.state() : {},
      props || {}
    );

    Object(_utils_skipInProductionAndTest__WEBPACK_IMPORTED_MODULE_5__["default"])(() => Object.freeze(this.state));

    if (children) this.setChildren(children);
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    if (typeof this.view !== 'function') return '';
    const rendered = this.view();
    if (Array.isArray(rendered)) {
      for (let i = 0; i < rendered.length; i++) {
        rendered[i].destroy = this.destroy.bind(this);
      }
    } else {
      rendered.destroy = this.destroy.bind(this);
    }
    this.html = rendered;
    return rendered;
  }

  /**
   * @param {object} props
   * @returns {Component}
   */
  setProps(props) {
    this.setState(props);
    return this;
  }

  /**
   * @param {Node[]|*[]} children
   */
  setChildren(children) {
    this.children = children;
    this.setState();
    for (let i = 0; i < this.children.length; i++) {
      if (typeof this.children[i].when === 'function') {
        this.children[i].when('update', () => this.setState());
      }
    }
    return this;
  }

  /**
   * @private
   * @param {object} obj
   * @param {string} type
   */
  copyObjToInstance(obj, type) {
    for (const key in obj) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write for reserved variable \`${key}\``);
      }
      this[key] = obj[key];
      if (type === 'head') this[key].when('update', () => this.setState());
    }
  }

  /**
   * @private
   * @param {object} obj
   */
  addNonEnumerableProperties(obj) {
    for (const key in obj) {
      if (typeof this[key] !== 'undefined') continue;
      Object.defineProperty(this, key, {
        value: obj[key],
      });
    }
  }

  /**
   * @param {string} key
   * @param {Listener} listener
   */
  addListener(key, listener) {
    this.$privateStore.addListener(key, listener);
  }

  mount() {
    this.trigger('mount');
  }

  destroy() {
    this.trigger('destroy');
    if (this.html && this.html !== ''
      && typeof this.html.remove === 'function') this.html.remove();
  }

  /**
   * @param {string} key
   * @param {function} fn
   */
  when(key, fn) {
    if (typeof this.$events[key] === 'undefined') this.$events[key] = [];
    this.$events[key].push(fn);
  }

  /**
   * @param {string} key
   * @param {*} value
   */
  trigger(key, value) {
    if (typeof this.on[key] === 'function') {
      this.on[key].call(this, value);
    }

    if (typeof this.$events[key] !== 'undefined') {
      for (const i in this.$events[key]) {
        this.$events[key][i].call(this, value);
      }
    }
  }

  /**
   * @param {object} newState
   */
  setState(newState) {
    if (typeof newState === 'object') {
      const oldstate = Object(_utils_clone__WEBPACK_IMPORTED_MODULE_4__["default"])(this.state);
      this.state = Object.assign(oldstate, newState);

      Object(_utils_skipInProductionAndTest__WEBPACK_IMPORTED_MODULE_5__["default"])(() => Object.freeze(this.state));

      if (this.$config.listen) {
        this.$privateStore.setState(newState);
      }
    } else {
      // console.error('[Radi.js] ERROR: Action did not return object to merge with state');
    }

    if (!this.$config.listen && typeof this.view === 'function' && this.html) {
      _r_utils_fuseDom__WEBPACK_IMPORTED_MODULE_3__["default"].fuse(this.html, this.view());
    }
    this.trigger('update');
    return this.state;
  }

  /**
   * @returns {boolean}
   */
  static isComponent() {
    return true;
  }
}


/***/ }),

/***/ "./src/component/index.js":
/*!********************************!*\
  !*** ./src/component/index.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Component */ "./src/component/Component.js");


/* harmony default export */ __webpack_exports__["default"] = (_Component__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/component/utils/PrivateStore.js":
/*!*********************************************!*\
  !*** ./src/component/utils/PrivateStore.js ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return PrivateStore; });
/* harmony import */ var _Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../Component */ "./src/component/Component.js");


class PrivateStore {
  constructor() {
    this.store = {};
  }

  /**
   * @param {string} key
   * @param {Listener} listener
   */
  addListener(key, listener) {
    if (typeof this.store[key] === 'undefined') {
      this.createItemWrapper(key);
    }
    this.store[key].listeners.push(listener);
    listener.handleUpdate(this.store[key].value);

    return listener;
  }

  /**
   * setState
   * @param {*} newState
   * @returns {*}
   */
  setState(newState) {
    // Find and trigger changes for listeners
    for (const key of Object.keys(newState)) {
      if (typeof this.store[key] === 'undefined') {
        this.createItemWrapper(key);
      }
      this.store[key].value = newState[key];

      this.triggerListeners(key);
    }
    return newState;
  }

  /**
   * createItemWrapper
   * @private
   * @param {string} key
   * @returns {object}
   */
  createItemWrapper(key) {
    return this.store[key] = {
      listeners: [],
      value: null,
    };
  }

  /**
   * triggerListeners
   * @private
   * @param {string} key
   */
  triggerListeners(key) {
    const item = this.store[key];
    if (item) {
      item.listeners.forEach(listener => listener.handleUpdate(item.value));
    }
  }
}


/***/ }),

/***/ "./src/consts/GLOBALS.js":
/*!*******************************!*\
  !*** ./src/consts/GLOBALS.js ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const GLOBALS = {
  HEADLESS_COMPONENTS: {},
  FROZEN_STATE: false,
  VERSION: '0.3.1',
  ACTIVE_COMPONENTS: {},
  HTML_CACHE: {},
};

/* harmony default export */ __webpack_exports__["default"] = (GLOBALS);


/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(module) {/* harmony import */ var _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./consts/GLOBALS */ "./src/consts/GLOBALS.js");
/* harmony import */ var _r__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./r */ "./src/r/index.js");
/* harmony import */ var _listen__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./listen */ "./src/listen/index.js");
/* harmony import */ var _component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./component */ "./src/component/index.js");
/* harmony import */ var _mount__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./mount */ "./src/mount.js");
/* harmony import */ var _utils_remountActiveComponents__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils/remountActiveComponents */ "./src/utils/remountActiveComponents.js");








// Descriptor for actions
function action(target, key, descriptor) {
  const act = descriptor.value;
  descriptor.value = function (...args) {
    this.setState.call(this, act.call(this, ...args));
  }
  return descriptor;
}

const Radi = {
  version: _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].VERSION,
  activeComponents: _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].ACTIVE_COMPONENTS,
  r: _r__WEBPACK_IMPORTED_MODULE_1__["default"],
  listen: _listen__WEBPACK_IMPORTED_MODULE_2__["default"],
  l: _listen__WEBPACK_IMPORTED_MODULE_2__["default"],
  component: _component__WEBPACK_IMPORTED_MODULE_3__["default"],
  Component: _component__WEBPACK_IMPORTED_MODULE_3__["default"],
  action,
  headless: (key, comp) => {
    // TODO: Validate component and key
    const mountedComponent = new comp();
    mountedComponent.mount();
    return _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].HEADLESS_COMPONENTS['$'.concat(key)] = mountedComponent;
  },
  mount: _mount__WEBPACK_IMPORTED_MODULE_4__["default"],
  freeze: () => {
    _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].FROZEN_STATE = true;
  },
  unfreeze: () => {
    _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].FROZEN_STATE = false;
    Object(_utils_remountActiveComponents__WEBPACK_IMPORTED_MODULE_5__["default"])();
  },
};

// Pass Radi instance to plugins
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

if (window) window.$Radi = Radi;

module.exports = Radi;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../node_modules/webpack/buildin/harmony-module.js */ "./node_modules/webpack/buildin/harmony-module.js")(module)))

/***/ }),

/***/ "./src/listen/Listener.js":
/*!********************************!*\
  !*** ./src/listen/Listener.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Listener; });
/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */

class Listener {
  /**
   * @param {Component} component
   * @param {...string} path
   */
  constructor(component, ...path) {
    this.component = component;
    [this.key] = path;
    this.childPath = path.slice(1, path.length);
    this.path = path;
    this.value = null;
    this.changeListeners = [];
    this.processValue = value => value;
    this.disabled = false;

    this.component.addListener(this.key, this);
    if (this.component.state) {
      this.handleUpdate(this.component.state[this.key]);
    }
  }

  /**
   * @param {*} value
   * @return {*}
   */
  extract(value) {
    if (value.value instanceof Listener) {
      value.value.disabled = true;
      return this.extract(value.value);
    }
    return value;
  }

  /**
   * @param {*} value
   */
  handleUpdate(value) {
    // TODO: Destroy unnecessary listeners
    this.value = this.processValue(this.getShallowValue(value), this.value);

    if (this.disabled) {
      if (typeof this.disabled === 'function') this.disabled(this.value);
      return this.value;
    }
    if (this.value instanceof Listener) {
      if (this.value.disabled) return this.value;
      this.value = this.extract(this.value);
      this.value.disabled = (value) => {
        this.changeListeners.forEach(changeListener => changeListener(value));
      };
    }

    this.changeListeners.forEach(changeListener => changeListener(this.value));
    return this.value;
  }

  /**
   * @param {function(*)} changeListener
   */
  onValueChange(changeListener) {
    this.changeListeners.push(changeListener);
    changeListener(this.value);
  }

  /**
   * @param {function(*): *} processValue
   * @returns {function(*): *}
   */
  process(processValue) {
    this.processValue = processValue;
    this.handleUpdate(this.value);
    return this;
  }

  /**
   * @private
   * @param {*} value
   */
  getShallowValue(value) {
    if (typeof value !== 'object' || !this.childPath) return value;
    let shallowValue = value;
    /*eslint-disable*/
    for (const pathNestingLevel of this.childPath) {
      if (shallowValue === null
        || !shallowValue[pathNestingLevel]
        && typeof shallowValue[pathNestingLevel] !== 'number') {
        shallowValue = null
      } else {
        shallowValue = shallowValue[pathNestingLevel]
      }
    }
    return shallowValue;
  }
}


/***/ }),

/***/ "./src/listen/index.js":
/*!*****************************!*\
  !*** ./src/listen/index.js ***!
  \*****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Listener__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Listener */ "./src/listen/Listener.js");


/**
 * The listen function is used for dynamically binding a component property
 * to the DOM. Also commonly imported as 'l'.
 * @param {Component} component
 * @param {...string} path
 * @returns {Listener}
 */
const listen = (component, ...path) =>
  new _Listener__WEBPACK_IMPORTED_MODULE_0__["default"](component, ...path);

/* harmony default export */ __webpack_exports__["default"] = (listen);


/***/ }),

/***/ "./src/mount.js":
/*!**********************!*\
  !*** ./src/mount.js ***!
  \**********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _component_Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./component/Component */ "./src/component/Component.js");
/* harmony import */ var _r_appendChild__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./r/appendChild */ "./src/r/appendChild.js");
/* harmony import */ var _r_utils_fuseDom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./r/utils/fuseDom */ "./src/r/utils/fuseDom.js");




/**
 * @param {Component} component
 * @param {string} id
 * @returns {HTMLElement|Node}
 */
const mount = (component, id) => {
  const container = document.createDocumentFragment()
  const slot = typeof id === 'string' ? document.getElementById(id) : id;
  const rendered =
    (component instanceof _component_Component__WEBPACK_IMPORTED_MODULE_0__["default"] || component.render) ? component.render() : component;

  if (Array.isArray(rendered)) {
    for (var i = 0; i < rendered.length; i++) {
      mount(rendered[i], container);
    }
  } else {
    // Mount to container
    Object(_r_appendChild__WEBPACK_IMPORTED_MODULE_1__["default"])(container)(rendered);
  }

  // Mount to element
  slot.appendChild(container);

  if (typeof slot.destroy !== 'function') {
    slot.destroy = () => {
      for (var i = 0; i < rendered.length; i++) {
        _r_utils_fuseDom__WEBPACK_IMPORTED_MODULE_2__["default"].destroy(rendered[i]);
      }
    }
  }

  if (typeof component.mount === 'function') component.mount();

  return slot;
}

/* harmony default export */ __webpack_exports__["default"] = (mount);


/***/ }),

/***/ "./src/r/appendChild.js":
/*!******************************!*\
  !*** ./src/r/appendChild.js ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _mount__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mount */ "./src/mount.js");
/* harmony import */ var _component_Component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../component/Component */ "./src/component/Component.js");
/* harmony import */ var _listen_Listener__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../listen/Listener */ "./src/listen/Listener.js");
/* harmony import */ var _appendChildren__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./appendChildren */ "./src/r/appendChildren.js");
/* harmony import */ var _utils_appendListenerToElement__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils/appendListenerToElement */ "./src/r/utils/appendListenerToElement.js");
/* eslint-disable no-param-reassign */
/* eslint-disable no-console */







/**
 * @param {HTMLElement} element
 * @returns {function(*)}
 */
const appendChild = element => child => {
  if (!child && typeof child !== 'number') {
    // Needs to render every child, even empty ones to preserve dom hierarchy
    child = '';
  }

  if (child instanceof _component_Component__WEBPACK_IMPORTED_MODULE_1__["default"]) {
    Object(_mount__WEBPACK_IMPORTED_MODULE_0__["default"])(child, element);
    return;
  }

  if (child instanceof _listen_Listener__WEBPACK_IMPORTED_MODULE_2__["default"]) {
    Object(_utils_appendListenerToElement__WEBPACK_IMPORTED_MODULE_4__["default"])(child, element);
    return;
  }

  if (Array.isArray(child)) {
    Object(_appendChildren__WEBPACK_IMPORTED_MODULE_3__["default"])(element, child);
    return;
  }

  // Handles lazy loading components
  if (typeof child === 'function') {
    const placeholder = document.createElement('div');
    const el = element.appendChild(placeholder);
    el.__async = true;
    child().then(local => {
      if (typeof local.default === 'function'
        && local.default.isComponent
        && local.default.isComponent()) {
        /*eslint-disable*/
        appendChild(el)(new local.default());
        // el.__async = false;
        /* eslint-enable */
      } else {
        appendChild(el)(local.default);
        // el.__async = false;
      }
    }).catch(console.warn);
    return;
  }

  if (child instanceof Node) {
    element.appendChild(child);
    return;
  }

  element.appendChild(document.createTextNode(child));
};

/* harmony default export */ __webpack_exports__["default"] = (appendChild);


/***/ }),

/***/ "./src/r/appendChildren.js":
/*!*********************************!*\
  !*** ./src/r/appendChildren.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _appendChild__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./appendChild */ "./src/r/appendChild.js");


/**
 * @param {HTMLElement} element
 * @param {*[]} children
 */
const appendChildren = (element, children) => {
  children.forEach(Object(_appendChild__WEBPACK_IMPORTED_MODULE_0__["default"])(element));
};

/* harmony default export */ __webpack_exports__["default"] = (appendChildren);


/***/ }),

/***/ "./src/r/index.js":
/*!************************!*\
  !*** ./src/r/index.js ***!
  \************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _setAttributes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./setAttributes */ "./src/r/setAttributes.js");
/* harmony import */ var _utils_getElementFromQuery__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/getElementFromQuery */ "./src/r/utils/getElementFromQuery.js");
/* harmony import */ var _appendChildren__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./appendChildren */ "./src/r/appendChildren.js");




/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
const r = (Query, props, ...children) => {
  if (typeof Query === 'function' && Query.isComponent) {
    return new Query(children).setProps(props || {});
  }

  if (typeof Query === 'function') {
    const propsWithChildren = props || {};
    propsWithChildren.children = children;
    return Query(propsWithChildren);
  }

  const element = Object(_utils_getElementFromQuery__WEBPACK_IMPORTED_MODULE_1__["default"])(Query);

  if (props !== null) Object(_setAttributes__WEBPACK_IMPORTED_MODULE_0__["default"])(element, props);
  Object(_appendChildren__WEBPACK_IMPORTED_MODULE_2__["default"])(element, children);

  return element;
};

/* harmony default export */ __webpack_exports__["default"] = (r);


/***/ }),

/***/ "./src/r/setAttributes.js":
/*!********************************!*\
  !*** ./src/r/setAttributes.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _setStyles__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./setStyles */ "./src/r/setStyles.js");
/* harmony import */ var _listen_Listener__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../listen/Listener */ "./src/listen/Listener.js");
/* harmony import */ var _utils_parseClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/parseClass */ "./src/r/utils/parseClass.js");
/* harmony import */ var _utils_AttributeListener__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/AttributeListener */ "./src/r/utils/AttributeListener.js");
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
// -- we need those for..in loops for now!

/* eslint-disable no-param-reassign */
// -- until this can be rewritten as a pure function, we need to reassign.






/**
 * @param {HTMLElement} element
 * @param {object} attributes
 */
const setAttributes = (element, attributes) => {
  for (const key in attributes) {
    const value = attributes[key];

    if (typeof value === 'undefined') continue;

    if (!value && typeof value !== 'number') {
      // Need to remove falsy attribute
      element.removeAttribute(key);
      continue;
    }

    if (key.toLowerCase() === 'style') {
      Object(_setStyles__WEBPACK_IMPORTED_MODULE_0__["default"])(element, value);
      continue;
    }

    if (value instanceof _listen_Listener__WEBPACK_IMPORTED_MODULE_1__["default"]) {
      new _utils_AttributeListener__WEBPACK_IMPORTED_MODULE_3__["default"]({
        attributeKey: key,
        listener: value,
        element,
      }).attach();
      continue;
    }

    if (key.toLowerCase() === 'class' || key.toLowerCase() === 'classname') {
      element.setAttribute('class', Object(_utils_parseClass__WEBPACK_IMPORTED_MODULE_2__["default"])(value));
      continue;
    }

    // Handles events 'on<event>'
    if (key.substring(0, 2).toLowerCase() === 'on') {
      if (key.substring(0, 8).toLowerCase() === 'onsubmit') {
        element[key] = (e) => {
          const data = [];
          const inputs = e.target.elements || [];
          for (const input of inputs) {
            if (input.name !== '') {
              const item = {
                name: input.name,
                el: input,
                type: input.type,
                default: input.defaultValue,
                value: input.value,
                set(val) {
                  this.el.value = val;
                },
                reset(val) {
                  this.el.value = val;
                  this.el.defaultValue = val;
                },
              };
              data.push(item);
              Object.defineProperty(data, item.name, {
                value: item,
              });
            }
          }

          return value(e, data);
        };
      } else {
        element[key] = value;
      }
      continue;
    }

    element.setAttribute(key, value);
  }
};

/* harmony default export */ __webpack_exports__["default"] = (setAttributes);


/***/ }),

/***/ "./src/r/setStyles.js":
/*!****************************!*\
  !*** ./src/r/setStyles.js ***!
  \****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _listen_Listener__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../listen/Listener */ "./src/listen/Listener.js");
/* harmony import */ var _utils_AttributeListener__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/AttributeListener */ "./src/r/utils/AttributeListener.js");
/* harmony import */ var _utils_setStyle__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/setStyle */ "./src/r/utils/setStyle.js");

/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
// -- we need those for..in loops for now!

/* eslint-disable no-param-reassign */
// -- until this can be rewritten as a pure function, we need to reassign.




/**
 * @param {HTMLElement} element
 * @param {string|object|Listener} styles
 * @returns {CSSStyleDeclaration}
 */
const setStyles = (element, styles) => {
  if (typeof styles === 'string') {
    element.style = styles;
  }

  if (typeof styles !== 'object' || Array.isArray(styles)) {
    return element.style;
  }

  if (styles instanceof _listen_Listener__WEBPACK_IMPORTED_MODULE_0__["default"]) {
    new _utils_AttributeListener__WEBPACK_IMPORTED_MODULE_1__["default"]({
      attributeKey: 'style',
      listener: styles,
      element,
    }).attach();
    return element.style;
  }

  for (const property in styles) {
    Object(_utils_setStyle__WEBPACK_IMPORTED_MODULE_2__["default"])(element, property, styles[property]);
  }

  return element.style;
};

/* harmony default export */ __webpack_exports__["default"] = (setStyles);


/***/ }),

/***/ "./src/r/utils/AttributeListener.js":
/*!******************************************!*\
  !*** ./src/r/utils/AttributeListener.js ***!
  \******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return AttributeListener; });
/* harmony import */ var _setAttributes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../setAttributes */ "./src/r/setAttributes.js");


class AttributeListener {
  /**
   * @param {object} options
   * @param {string} options.attributeKey
   * @param {Listener} options.listener
   * @param {Node} options.element
   */
  constructor({ attributeKey, listener, element }) {
    this.attributeKey = attributeKey;
    this.listener = listener;
    this.element = element;
    this.attached = false;
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  /**
   * Attaches attribute listener to given element and starts listening.
   * @returns {AttributeListener}
   */
  attach() {
    if (!this.element.attributeListeners) this.element.attributeListeners = [];
    this.element.attributeListeners.push(this);
    this.listener.onValueChange(this.handleValueChange);
    this.attached = true;

    if (this.attributeKey === 'model') {
      if (/(checkbox|radio)/.test(this.element.getAttribute('type'))) {
        this.element.onchange = (e) => {
          this.listener.component[this.listener.key] = e.target.checked;
        };
      } else {
        this.element.oninput = (e) => {
          this.listener.component[this.listener.key] = e.target.value;
        };
      }
    }
    return this;
  }

  /**
   * @param {*} value
   */
  handleValueChange(value) {
    if (this.attributeKey === 'value' || this.attributeKey === 'model') {
      if (/(checkbox|radio)/.test(this.element.getAttribute('type'))) {
        this.element.checked = value;
      } else {
        this.element.value = value;
      }
    } else {
      Object(_setAttributes__WEBPACK_IMPORTED_MODULE_0__["default"])(this.element, { [this.attributeKey]: value });
    }
  }

  /**
   * @param {Node} newElement
   */
  updateElement(newElement) {
    this.element = newElement;
    return this.element;
  }
}


/***/ }),

/***/ "./src/r/utils/ElementListener.js":
/*!****************************************!*\
  !*** ./src/r/utils/ElementListener.js ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return ElementListener; });
/* harmony import */ var _listenerToNode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./listenerToNode */ "./src/r/utils/listenerToNode.js");
/* harmony import */ var _fuseDom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./fuseDom */ "./src/r/utils/fuseDom.js");



class ElementListener {
  /**
   * @param {object} options
   * @param {Listener} options.listener
   * @param {Node} options.element
   */
  constructor({ listener, element }) {
    this.listener = listener;
    this.element = element;
    this.listenerAsNode = [];
    this.attached = false;
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  /**
   * Attaches listener to given element and starts listening.
   * @returns {ElementListener}
   */
  attach() {
    if (!this.element.listeners) this.element.listeners = [];
    this.element.listeners.push(this);
    this.listener.onValueChange(this.handleValueChange);
    this.attached = true;
    return this;
  }

  /**
   * @param {*} value
   */
  handleValueChange(value) {
    const newNode = Object(_listenerToNode__WEBPACK_IMPORTED_MODULE_0__["default"])(value);

    var i = 0
    for (const node of newNode) {
      if (!this.listenerAsNode[i]) {
        this.listenerAsNode.push(this.element.appendChild(node));
      } else {
        this.listenerAsNode[i] = _fuseDom__WEBPACK_IMPORTED_MODULE_1__["default"].fuse(this.listenerAsNode[i], node);
      }
      i+=1
    }

    if (i < this.listenerAsNode.length) {
      var nodesLeft = this.listenerAsNode.splice(i-this.listenerAsNode.length);
      for (const node of nodesLeft) {
        _fuseDom__WEBPACK_IMPORTED_MODULE_1__["default"].destroy(node);
        // node.remove();
      }
    }
  }

  /**
   * @param {Node} newElement
   */
  updateElement(newElement) {
    this.element = newElement;
    return this.element;
  }
}


/***/ }),

/***/ "./src/r/utils/StyleListener.js":
/*!**************************************!*\
  !*** ./src/r/utils/StyleListener.js ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return StyleListener; });
/* harmony import */ var _setStyle__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./setStyle */ "./src/r/utils/setStyle.js");


class StyleListener {
  /**
   * @param {object} options
   * @param {string} options.styleKey
   * @param {Listener} options.listener
   * @param {Node} options.element
   */
  constructor({ styleKey, listener, element }) {
    this.styleKey = styleKey;
    this.listener = listener;
    this.element = element;
    this.attached = false;
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  /**
   * Attaches style listener to given element and starts listening.
   * @returns {StyleListener}
   */
  attach() {
    if (!this.element.styleListeners) this.element.styleListeners = [];
    this.element.styleListeners.push(this);
    this.listener.onValueChange(this.handleValueChange);
    this.attached = true;
    return this;
  }

  /**
   * @param {*} value
   */
  handleValueChange(value) {
    Object(_setStyle__WEBPACK_IMPORTED_MODULE_0__["default"])(this.element, this.styleKey, value);
  }

  /**
   * @param {Node} newElement
   */
  updateElement(newElement) {
    this.element = newElement;
    return this.element;
  }
}


/***/ }),

/***/ "./src/r/utils/appendListenerToElement.js":
/*!************************************************!*\
  !*** ./src/r/utils/appendListenerToElement.js ***!
  \************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _ElementListener__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ElementListener */ "./src/r/utils/ElementListener.js");


/**
 * @param {Listener} listener
 * @param {HTMLElement} element
 * @returns {ElementListener}
 */
const appendListenerToElement = (listener, element) =>
  new _ElementListener__WEBPACK_IMPORTED_MODULE_0__["default"]({
    listener,
    element,
  }).attach();

/* harmony default export */ __webpack_exports__["default"] = (appendListenerToElement);


/***/ }),

/***/ "./src/r/utils/ensureArray.js":
/*!************************************!*\
  !*** ./src/r/utils/ensureArray.js ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * @param {*} value
 * @returns {*[]}
 */
const ensureArray = value => {
  if (Array.isArray(value)) return value;
  return [value];
};

/* harmony default export */ __webpack_exports__["default"] = (ensureArray);


/***/ }),

/***/ "./src/r/utils/fuseDom.js":
/*!********************************!*\
  !*** ./src/r/utils/fuseDom.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

const copyAttrs = (newNode, oldNode) => {
  var oldAttrs = oldNode.attributes;
  var newAttrs = newNode.attributes;
  var attrNamespaceURI = null;
  var attrValue = null;
  var fromValue = null;
  var attrName = null;
  var attr = null;

  for (var i = newAttrs.length - 1; i >= 0; --i) {
    attr = newAttrs[i];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;
    attrValue = attr.value;
    // TODO: Change only specific parts of style
    // if (attr.name === 'style') {
    //   for (var item of newNode.style) {
    //     if (oldNode.style[item] !== newNode.style[item]) oldNode.style[item] = newNode.style[item]
    //   }
    //   continue;
    // }
    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;
      fromValue = oldNode.getAttributeNS(attrNamespaceURI, attrName);
      if (fromValue !== attrValue) {
        oldNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
      }
    } else {
      if (!oldNode.hasAttribute(attrName)) {
        oldNode.setAttribute(attrName, attrValue);
      } else {
        fromValue = oldNode.getAttribute(attrName);
        if (fromValue !== attrValue) {
          // apparently values are always cast to strings, ah well
          if (attrValue === 'null' || attrValue === 'undefined') {
            oldNode.removeAttribute(attrName);
          } else {
            oldNode.setAttribute(attrName, attrValue);
          }
        }
      }
    }
  }

  // Remove any extra attributes found on the original DOM element that
  // weren't found on the target element.
  for (var j = oldAttrs.length - 1; j >= 0; --j) {
    attr = oldAttrs[j];
    if (attr.specified !== false) {
      attrName = attr.name;
      attrNamespaceURI = attr.namespaceURI;

      if (attrNamespaceURI) {
        attrName = attr.localName || attrName;
        if (!newNode.hasAttributeNS(attrNamespaceURI, attrName)) {
          oldNode.removeAttributeNS(attrNamespaceURI, attrName);
        }
      } else {
        if (!newNode.hasAttributeNS(null, attrName)) {
          oldNode.removeAttribute(attrName);
        }
      }
    }
  }
}

const destroy = node => {
  if (!(node instanceof Node)) return;
  var treeWalker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_ELEMENT,
    el => el && (typeof el.destroy === 'function'
      || el.listeners),
    false
  );

  var el;
  while((el = treeWalker.nextNode())) {
    // Unlink listeners for garbage collection
    el.listeners = null;
    el.destroy();
    if (el.parentNode) el.parentNode.removeChild(el);
  }

  if (node.destroy) node.destroy();

  if (node.parentNode) node.parentNode.removeChild(node);
}

/**
 * @param {HTMLElement} newNode
 * @param {HTMLElement} oldNode
 * @returns {ElementListener}
 */
const fuse = (toNode, fromNode, childOnly) => {
  if (Array.isArray(fromNode) || Array.isArray(toNode)) childOnly = true;

  if (!childOnly) {
    const nt1 = toNode.nodeType;
    const nt2 = fromNode.nodeType;

    if (nt1 === nt2 && (nt1 === 3 || nt2 === 8)) {
      if (!toNode.isEqualNode(fromNode)) {
        // toNode.textContent = fromNode.textContent
        toNode.nodeValue = fromNode.nodeValue;
        // toNode.replaceWith(fromNode)
        destroy(fromNode);
      }
      return toNode;
    }

    if (fromNode.destroy || toNode.destroy || fromNode.__async || fromNode.__async
      || toNode.listeners || fromNode.listeners
      || nt1 === 3 || nt2 === 3) {
      if (!toNode.isEqualNode(fromNode)) {
        toNode.parentNode.insertBefore(fromNode, toNode);
        destroy(toNode);
      }
      return fromNode;
    }

    copyAttrs(fromNode, toNode);
  }

  let a1 = [ ...toNode.childNodes || toNode ];
  let a2 = [ ...fromNode.childNodes || fromNode ];
  let max = Math.max(a1.length, a2.length);

  for (var i = 0; i < max; i++) {
    if (a1[i] && a2[i]) {
      // Fuse
      fuse(a1[i], a2[i]);
    } else
    if (a1[i] && !a2[i]) {
      // Remove
      destroy(a1[i]);
    } else
    if (!a1[i] && a2[i]) {
      // Add
      toNode.appendChild(a2[i]);
    }
  }

  destroy(fromNode);
  return toNode;
}

class FuseDom {
  fuse(...args) {
    return fuse(...args);
  }
  destroy(...args) {
    return destroy(...args);
  }
}

/* harmony default export */ __webpack_exports__["default"] = (new FuseDom());


/***/ }),

/***/ "./src/r/utils/getElementFromQuery.js":
/*!********************************************!*\
  !*** ./src/r/utils/getElementFromQuery.js ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * @param {*} query
 * @returns {Node}
 */
const getElementFromQuery = query => {
  if (typeof query === 'string') return query !== 'template'
    ? document.createElement(query)
    : document.createDocumentFragment();
  console.warn(
    '[Radi.js] Warn: Creating a JSX element whose query is not of type string, automatically converting query to string.'
  );
  return document.createElement(query.toString());
};

/* harmony default export */ __webpack_exports__["default"] = (getElementFromQuery);


/***/ }),

/***/ "./src/r/utils/listenerToNode.js":
/*!***************************************!*\
  !*** ./src/r/utils/listenerToNode.js ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _appendChildren__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../appendChildren */ "./src/r/appendChildren.js");
/* harmony import */ var _ensureArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ensureArray */ "./src/r/utils/ensureArray.js");



/**
 * @param {*} value - Value of the listener
 * @returns {Node[]}
 */
const listenerToNode = value => {
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes);
  }

  const element = document.createDocumentFragment();
  Object(_appendChildren__WEBPACK_IMPORTED_MODULE_0__["default"])(element, Object(_ensureArray__WEBPACK_IMPORTED_MODULE_1__["default"])(value));
  return listenerToNode(element);
};

/* harmony default export */ __webpack_exports__["default"] = (listenerToNode);


/***/ }),

/***/ "./src/r/utils/parseClass.js":
/*!***********************************!*\
  !*** ./src/r/utils/parseClass.js ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * @param {*} value
 * @return {*}
 */
const parseClass = value => {
  if (Array.isArray(value)) {
    return value.filter(item => item).join(' ')
  }
  return value;
}

/* harmony default export */ __webpack_exports__["default"] = (parseClass);


/***/ }),

/***/ "./src/r/utils/parseValue.js":
/*!***********************************!*\
  !*** ./src/r/utils/parseValue.js ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * @param {*} value
 * @return {*}
 */
const parseValue = value =>
  typeof value === 'number' && !Number.isNaN(value) ? `${value}px` : value;

/* harmony default export */ __webpack_exports__["default"] = (parseValue);


/***/ }),

/***/ "./src/r/utils/setStyle.js":
/*!*********************************!*\
  !*** ./src/r/utils/setStyle.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _listen_Listener__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../listen/Listener */ "./src/listen/Listener.js");
/* harmony import */ var _utils_StyleListener__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/StyleListener */ "./src/r/utils/StyleListener.js");
/* harmony import */ var _parseValue__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parseValue */ "./src/r/utils/parseValue.js");
/* eslint-disable no-param-reassign */
// -- until this can be rewritten as a pure function, we need to reassign.





/**
 * @param {HTMLElement} element
 * @param {string} property
 * @param {string} value
 * @returns {*}
 */
const setStyle = (element, property, value) => {
  if (typeof value === 'undefined') return undefined;

  if (value instanceof _listen_Listener__WEBPACK_IMPORTED_MODULE_0__["default"]) {
    new _utils_StyleListener__WEBPACK_IMPORTED_MODULE_1__["default"]({
      styleKey: property,
      listener: value,
      element,
    }).attach();
    return element[property];
  }

  return element.style[property] = Object(_parseValue__WEBPACK_IMPORTED_MODULE_2__["default"])(value);
};

/* harmony default export */ __webpack_exports__["default"] = (setStyle);


/***/ }),

/***/ "./src/utils/clone.js":
/*!****************************!*\
  !*** ./src/utils/clone.js ***!
  \****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * @param {*} obj
 * @returns {*}
 */
const clone = obj => {
  if (typeof obj !== 'object') return obj;
  if (obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(clone);

  /*eslint-disable*/
  // Reverted as currently throws some errors
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = clone(obj[key]);
    }
  }
  /* eslint-enable */

  return cloned;
};

/* harmony default export */ __webpack_exports__["default"] = (clone);


/***/ }),

/***/ "./src/utils/generateId.js":
/*!*********************************!*\
  !*** ./src/utils/generateId.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * UUID v4 generator
 * https://gist.github.com/jcxplorer/823878
 * @returns {string}
 */
const generateId = () => {
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    const random = (Math.random() * 16) | 0; // eslint-disable-line

    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16); // eslint-disable-line
  }
  return uuid;
};

/* harmony default export */ __webpack_exports__["default"] = (generateId);


/***/ }),

/***/ "./src/utils/remountActiveComponents.js":
/*!**********************************************!*\
  !*** ./src/utils/remountActiveComponents.js ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../consts/GLOBALS */ "./src/consts/GLOBALS.js");


const remountActiveComponents = () => {
  Object.values(_consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].ACTIVE_COMPONENTS).forEach(component => {
    if (typeof component.onMount === 'function') {
      component.onMount(component);
    }
  });
};

/* harmony default export */ __webpack_exports__["default"] = (remountActiveComponents);


/***/ }),

/***/ "./src/utils/skipInProductionAndTest.js":
/*!**********************************************!*\
  !*** ./src/utils/skipInProductionAndTest.js ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const skipInProductionAndTest = fn => {
  if (false) {}
  return fn && fn();
};

/* harmony default export */ __webpack_exports__["default"] = (skipInProductionAndTest);


/***/ })

/******/ });
//# sourceMappingURL=main.bundle.js.map