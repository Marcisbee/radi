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
/* harmony import */ var _utils_clone__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/clone */ "./src/utils/clone.js");
/* harmony import */ var _utils_generateId__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/generateId */ "./src/utils/generateId.js");
/* harmony import */ var _utils_Renderer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/Renderer */ "./src/component/utils/Renderer.js");
/* harmony import */ var _utils_PrivateStore__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils/PrivateStore */ "./src/component/utils/PrivateStore.js");
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
// -- we need those for..in loops for now!







class Component {
  /**
   * @param {object} o
   * @param {string} [o.name]
   * @param {object} [o.mixins]
   * @param {object} [o.state]
   * @param {object} [o.props]
   * @param {object} [o.actions]
   * @param {function(Component): (HTMLElement|Component)} view
   * @param {Node[]|*[]} [children]
   */
  constructor(o, children) {
    this.name = o.name;

    this.addNonEnumerableProperties(Object.assign({
      $id: Object(_utils_generateId__WEBPACK_IMPORTED_MODULE_2__["default"])(),
      $mixins: o.mixins || {},
      $state: Object(_utils_clone__WEBPACK_IMPORTED_MODULE_1__["default"])(o.state || {}),
      $props: Object(_utils_clone__WEBPACK_IMPORTED_MODULE_1__["default"])(o.props || {}),
      $actions: o.actions || {},
      // Variables like state and props are actually stored here so that we can
      // have custom setters
      $privateStore: new _utils_PrivateStore__WEBPACK_IMPORTED_MODULE_4__["default"](),
    }));

    this.addCustomField('children', []);
    if (children) this.setChildren(children);

    this.copyObjToInstance(this.$mixins);
    this.copyObjToInstance(this.$state);
    this.copyObjToInstance(this.$props);
    // Appends headless components
    this.copyObjToInstance(_consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].HEADLESS_COMPONENTS);
    // The bind on this.handleAction is necessary
    this.copyObjToInstance(this.$actions, this.handleAction.bind(this));

    this.addNonEnumerableProperties({
      $view: o.view ? o.view(this) : () => () => null,
      $renderer: new _utils_Renderer__WEBPACK_IMPORTED_MODULE_3__["default"](this),
    });

    this.$view.unmount = this.unmount.bind(this);
    this.$view.mount = this.mount.bind(this);
  }

  /**
   * @private
   * @param {object} obj
   * @param {function(*): *} [handleItem=item => item]
   */
  copyObjToInstance(obj, handleItem = item => item) {
    for (const key in obj) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write for reserved variable \`${key}\``);
      }
      this.addCustomField(key, handleItem(obj[key]));
    }
  }

  /**
   * @private
   * @param {function(*): *} action
   * @returns {function(...*): *}
   */
  handleAction(action) {
    return (...args) => {
      if (_consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].FROZEN_STATE) return null;
      return action.bind(this)(...args);
    };
  }

  /**
   * @param {object} props
   * @returns {Component}
   */
  setProps(props) {
    for (const key in props) {
      this.$props[key] = props[key];
      if (typeof this.$props[key] === 'undefined') {
        console.warn(`[Radi.js] Warn: Creating a prop \`${key}\` that is not defined in component`);
        this.addCustomField(key, props[key]);
        continue;
      }
      this[key] = props[key];
    }
    return this;
  }

  /**
   * @param {Node[]|*[]} children
   */
  setChildren(children) {
    this.children = children;
    return this;
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
   * @private
   * @param {string} key
   * @param {*} value
   * @returns {*}
   */
  addCustomField(key, value) {
    Object.defineProperty(this, key, {
      get: () => this.$privateStore.getItem(key),
      set: val => this.$privateStore.setItem(key, val),
      enumerable: true,
    });
    this[key] = value;
  }

  /**
   * @param {string} key
   * @param {Listener} listener
   */
  addListener(key, listener) {
    this.$privateStore.addListener(key, listener);
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  isMixin(key) {
    return typeof this.$mixins[key] !== 'undefined';
  }

  mount() {
    if (typeof this.$actions.onMount === 'function') {
      this.$actions.onMount(this);
    }
    _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].ACTIVE_COMPONENTS[this.$id] = this;
  }

  unmount() {
    if (typeof this.$actions.onDestroy === 'function') {
      this.$actions.onDestroy(this);
    }
    delete _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].ACTIVE_COMPONENTS[this.$id];
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    this.mount();
    return this.$renderer.render();
  }

  /**
   * @returns {HTMLElement}
   */
  destroy() {
    this.unmount();
    return this.$renderer.destroyHtml();
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


/**
 * @param {object} o
 * @returns {function}
 */
const component = o => class {
  /**
   * @returns {Component}
   */
  constructor(children) {
    return new _Component__WEBPACK_IMPORTED_MODULE_0__["default"](o, children);
  }

  /**
   * @returns {boolean}
   */
  static isComponent() {
    return true;
  }
};

/* harmony default export */ __webpack_exports__["default"] = (component);


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
class PrivateStore {
  constructor() {
    this.store = {};
  }

  /**
   * setItem
   * @param {string} key
   * @param {*} value
   * @returns {*}
   */
  setItem(key, value) {
    if (typeof this.store[key] === 'undefined') {
      this.createItemWrapper(key);
    }
    this.store[key].value = value;
    this.triggerListeners(key);
    return value;
  }

  /**
   * getItem
   * @param {string} key
   * @returns {*}
   */
  getItem(key) {
    return this.store[key].value;
  }

  /**
   * addListener
   * @param {string} key
   * @param {Listener} listener
   * @returns {Listener}
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
    item.listeners.forEach(listener => listener.handleUpdate(item.value));
  }
}


/***/ }),

/***/ "./src/component/utils/Renderer.js":
/*!*****************************************!*\
  !*** ./src/component/utils/Renderer.js ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Renderer; });
class Renderer {
  /**
   * @param {Component} component
   */
  constructor(component) {
    this.component = component;
    this.html = document.createDocumentFragment();
    this.node = {};
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    this.html.appendChild(this.node = this.component.$view);
    this.html.destroy = this.node.destroy = () => this.component.destroy();
    return this.html;
  }

  /**
   * @returns {HTMLElement}
   */
  destroyHtml() {
    if (this.node.childNodes) {
      this.node.childNodes.forEach(childNode => {
        this.node.removeChild(childNode);
      });
    }

    if (this.html.childNodes) {
      this.html.childNodes.forEach(childNode => {
        this.html.removeChild(childNode);
      });
    }

    this.html = document.createDocumentFragment();
    this.node = {};

    return this.node;
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
  MIX: {},
  HEADLESS_COMPONENTS: {},
  FROZEN_STATE: false,
  VERSION: '0.1.8',
  ACTIVE_COMPONENTS: {},
  HTML_CACHE: {},
};

/* harmony default export */ __webpack_exports__["default"] = (GLOBALS);


/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./consts/GLOBALS */ "./src/consts/GLOBALS.js");
/* harmony import */ var _r__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./r */ "./src/r/index.js");
/* harmony import */ var _listen__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./listen */ "./src/listen/index.js");
/* harmony import */ var _component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./component */ "./src/component/index.js");
/* harmony import */ var _mount__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./mount */ "./src/mount.js");
/* harmony import */ var _utils_remountActiveComponents__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils/remountActiveComponents */ "./src/utils/remountActiveComponents.js");







const Radi = {
  version: _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].VERSION,
  activeComponents: _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["default"].ACTIVE_COMPONENTS,
  r: _r__WEBPACK_IMPORTED_MODULE_1__["default"],
  listen: _listen__WEBPACK_IMPORTED_MODULE_2__["default"],
  l: _listen__WEBPACK_IMPORTED_MODULE_2__["default"],
  component: _component__WEBPACK_IMPORTED_MODULE_3__["default"],
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

if (window) window.$Radi = Radi;

/* harmony default export */ __webpack_exports__["default"] = (Radi);


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
class Listener {
  /**
   * @param {Component} component
   * @param {...string} path
   */
  constructor(component, ...path) {
    this.component = component;
    [this.key] = path;
    this.childPath = path.slice(1, path.length);
    this.value = null;
    this.changeListeners = [];
    this.processValue = value => value;

    this.component.addListener(this.key, this);
    this.handleUpdate(this.component[this.key]);
  }

  /**
   * @param {*} value
   */
  handleUpdate(value) {
    this.value = this.processValue(this.getShallowValue(value), this.value);
    this.changeListeners.forEach(changeListener => changeListener(this.value));
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
    if (!this.childPath) return value;
    let shallowValue = value;
    /*eslint-disable*/
    for (const pathNestingLevel of this.childPath) {
      shallowValue = shallowValue[pathNestingLevel];
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


/**
 * @param {Component} component
 * @param {string} id
 * @returns {HTMLElement|Node}
 */
const mount = (component, id) => {
  const container = typeof id === 'string' ? document.getElementById(id) : id;
  const rendered =
    component instanceof _component_Component__WEBPACK_IMPORTED_MODULE_0__["default"] ? component.render() : component;
  container.appendChild(rendered);
  return rendered;
};

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
/* harmony import */ var _component_Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../component/Component */ "./src/component/Component.js");
/* harmony import */ var _listen_Listener__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../listen/Listener */ "./src/listen/Listener.js");
/* harmony import */ var _appendChildren__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./appendChildren */ "./src/r/appendChildren.js");
/* harmony import */ var _utils_appendListenerToElement__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/appendListenerToElement */ "./src/r/utils/appendListenerToElement.js");
/* eslint-disable no-param-reassign */






/**
 * @param {HTMLElement} element
 * @returns {function(*)}
 */
const appendChild = element => child => {
  if (!child && typeof child !== 'number') {
    // Needs to render every child, even empty ones to preserve dom hierarchy
    child = '';
  }

  if (child instanceof _component_Component__WEBPACK_IMPORTED_MODULE_0__["default"]) {
    element.appendChild(child.render());
    return;
  }

  if (child instanceof _listen_Listener__WEBPACK_IMPORTED_MODULE_1__["default"]) {
    Object(_utils_appendListenerToElement__WEBPACK_IMPORTED_MODULE_3__["default"])(child, element);
    return;
  }

  if (Array.isArray(child)) {
    Object(_appendChildren__WEBPACK_IMPORTED_MODULE_2__["default"])(element, child);
    return;
  }

  // Handles lazy loading components
  if (typeof child === 'function') {
    const placeholder = document.createElement('div');
    const el = element.appendChild(placeholder);
    child().then(local => {
      if (typeof local.default === 'function'
        && local.default.isComponent
        && local.default.isComponent()) {
        /*eslint-disable*/
        appendChild(el)(new local.default());
        /* eslint-enable */
      } else {
        appendChild(el)(local.default);
      }
    }).catch(() => {
      // We don't have to do anything
    });
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
  if (typeof Query.isComponent === 'function' && Query.isComponent()) {
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
/* harmony import */ var _utils_AttributeListener__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/AttributeListener */ "./src/r/utils/AttributeListener.js");
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

    if (key === 'style') {
      Object(_setStyles__WEBPACK_IMPORTED_MODULE_0__["default"])(element, value);
      continue;
    }

    if (value instanceof _listen_Listener__WEBPACK_IMPORTED_MODULE_1__["default"]) {
      new _utils_AttributeListener__WEBPACK_IMPORTED_MODULE_2__["default"]({
        attributeKey: key,
        listener: value,
        element,
      }).attach();
      continue;
    }

    // Handles events 'on<event>'
    if (key.substring(0, 2).toLowerCase() === 'on') {
      element[key] = value;
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
    return this;
  }

  /**
   * @param {*} value
   */
  handleValueChange(value) {
    Object(_setAttributes__WEBPACK_IMPORTED_MODULE_0__["default"])(this.element, { [this.attributeKey]: value });
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
    /* eslint-disable */
    for (const node of newNode) {
      // If listenerAsNode[0] is undefined we're dealing with a fragment so we
      // can just append
      if (!this.listenerAsNode[0]) {
        this.element.appendChild(node);
        continue;
      }
      // TODO: Finish dom transformer and swap it with Node replacement
      this.element.insertBefore(node, this.listenerAsNode[0]);
    }

    for (const node of this.listenerAsNode) {
      var treeWalker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_ELEMENT,
        el => el && typeof el.destroy === 'function',
        false);

      var el;
      while((el = treeWalker.nextNode())) {
        el.destroy();
      }

      node.remove();
    }

    this.listenerAsNode = newNode;
    /* eslint-enable */
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
  if (typeof query === 'string') return document.createElement(query);
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
/* harmony import */ var _swapNode__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./swapNode */ "./src/r/utils/swapNode.js");




/**
 * @param {*} value - Value of the listener
 * @returns {Node[]}
 */
const listenerToNode = value => {
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes).map(childNode => Object(_swapNode__WEBPACK_IMPORTED_MODULE_2__["default"])(childNode));
  }

  const element = document.createDocumentFragment();
  Object(_appendChildren__WEBPACK_IMPORTED_MODULE_0__["default"])(element, Object(_ensureArray__WEBPACK_IMPORTED_MODULE_1__["default"])(value));
  return listenerToNode(element);
};

/* harmony default export */ __webpack_exports__["default"] = (listenerToNode);


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

/***/ "./src/r/utils/swapNode.js":
/*!*********************************!*\
  !*** ./src/r/utils/swapNode.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * @param {*} oldNode - Node to be swapped
 * @returns {Node}
 */
const swapNode = oldNode => {

  const newNode = oldNode;

  oldNode = newNode.cloneNode(true);

  // TODO: Need to destroy all childs of oldNode with smth like .destroy();
  oldNode.remove();

  return newNode;
};

/* harmony default export */ __webpack_exports__["default"] = (swapNode);


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


/***/ })

/******/ });
//# sourceMappingURL=main.bundle.js.map