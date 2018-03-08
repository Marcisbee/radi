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

/***/ "./src/consts/GLOBALS.js":
/*!*******************************!*\
  !*** ./src/consts/GLOBALS.js ***!
  \*******************************/
/*! exports provided: GLOBALS */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GLOBALS", function() { return GLOBALS; });
// export const REGISTERED = {};
// export const MIX = {};
// export let FROZEN_STATE = false;
// export const RL = "(".charCodeAt(0);
// export const RR = ")".charCodeAt(0);
// export let IDS = 0;
// export const VERSION = "0.1.8";
// export const ACTIVE_COMPONENTS = [];

const GLOBALS = {
  IDS: 0,
  REGISTERED: {},
  MIX: {},
  FROZEN_STATE: false,
  RL: "(".charCodeAt(0),
  RR: ")".charCodeAt(0),
  IDS: 0,
  VERSION: "0.1.8",
  ACTIVE_COMPONENTS: [],
  HTML_CACHE: {},
  R_KEYS: 0
};


/***/ }),

/***/ "./src/consts/REGEX.js":
/*!*****************************!*\
  !*** ./src/consts/REGEX.js ***!
  \*****************************/
/*! exports provided: COMMENTS, FIND_L */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "COMMENTS", function() { return COMMENTS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FIND_L", function() { return FIND_L; });
const COMMENTS = /(?:\/\*(?:[\s\S]*?)\*\/)|(?:^\s*\/\/(?:.*)$)/gm;
const FIND_L = /\bl\(/g;


/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! exports provided: isString, isNumber, isFunction, isNode, isWatchable, isCondition, isComponent, ensureEl, getEl, text, mount, list, link, cond, ll, register, Radi, setAttr, radiArgs, afterAppendChild, updateBind */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isString", function() { return isString; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isNumber", function() { return isNumber; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isFunction", function() { return isFunction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isNode", function() { return isNode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isWatchable", function() { return isWatchable; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isCondition", function() { return isCondition; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isComponent", function() { return isComponent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ensureEl", function() { return ensureEl; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getEl", function() { return getEl; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "text", function() { return text; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "mount", function() { return mount; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "list", function() { return list; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "link", function() { return link; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cond", function() { return cond; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ll", function() { return ll; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "register", function() { return register; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Radi", function() { return Radi; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setAttr", function() { return setAttr; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "radiArgs", function() { return radiArgs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "afterAppendChild", function() { return afterAppendChild; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateBind", function() { return updateBind; });
/* harmony import */ var _consts_REGEX__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./consts/REGEX */ "./src/consts/REGEX.js");
/* harmony import */ var _utilities_clone__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utilities/clone */ "./src/utilities/clone.js");
/* harmony import */ var _utilities_createElement__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utilities/createElement */ "./src/utilities/createElement.js");
/* harmony import */ var _utilities_arrayMods__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utilities/arrayMods */ "./src/utilities/arrayMods.js");
/* harmony import */ var _utilities_unmountAll__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utilities/unmountAll */ "./src/utilities/unmountAll.js");
/* harmony import */ var _utilities_mountAll__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utilities/mountAll */ "./src/utilities/mountAll.js");
/* harmony import */ var _utilities_radiMutate__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./utilities/radiMutate */ "./src/utilities/radiMutate.js");
/* harmony import */ var _utilities_setStyle__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./utilities/setStyle */ "./src/utilities/setStyle.js");
/* harmony import */ var _utilities_r__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./utilities/r */ "./src/utilities/r.js");
/* harmony import */ var _utilities_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./utilities/component */ "./src/utilities/component.js");
/* harmony import */ var _utilities_ComponentClass__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./utilities/ComponentClass */ "./src/utilities/ComponentClass.js");
/* harmony import */ var _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./consts/GLOBALS */ "./src/consts/GLOBALS.js");













function isString(a) {
  return typeof a === "string";
}

function isNumber(a) {
  return typeof a === "number";
}

function isFunction(a) {
  return typeof a === "function";
}

function isNode(a) {
  return a && a.nodeType;
}

function isWatchable(a) {
  return a && a instanceof NW;
}

function isCondition(a) {
  return a && a instanceof Condition;
}

function isComponent(a) {
  return a && a.__radi;
}

function ensureEl(parent) {
  return isString(parent) ? html(parent) : getEl(parent);
}

function getEl(parent) {
  return (
    (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el)
  );
}

function text(str) {
  return document.createTextNode(str);
}

const mount = function(comp, id) {
  const where = id.constructor === String ? document.getElementById(id) : id;
  var out = comp instanceof _utilities_ComponentClass__WEBPACK_IMPORTED_MODULE_10__["Component"] ? comp.__radi().$render() : comp;
  where.appendChild(out);
  return out;
};

var emptyNode = text("");

const list = function(data, act) {
  if (!data) return "";
  var SELF = this;

  var link,
    fragment = document.createDocumentFragment(),
    toplink = emptyNode.cloneNode();

  fragment.appendChild(toplink);

  var ret = [];
  var cache = data.source[data.prop] || [];
  var cacheLen = cache.length || 0;

  if (Array.isArray(cache)) {
    for (var i = 0; i < cacheLen; i++) {
      fragment.appendChild(act.call(SELF, cache[i], i));
    }
  } else {
    var i = 0;
    for (var key in cache) {
      fragment.appendChild(act.call(SELF, cache[key], key, i));
      i++;
    }
  }

  link = fragment.lastChild;

  var w = function(a, b) {
    if (a > 0) {
      var len = b.length;
      var start = len - a;
      for (var i = start; i < len; i++) {
        fragment.appendChild(act.call(SELF, b[i], i));
      }
      var temp = fragment.lastChild;
      link.parentElement.insertBefore(fragment, link.nextSibling);
      link = temp;
    } else if (a < 0) {
      for (var i = 0; i < Math.abs(a); i++) {
        var templink = link.previousSibling;
        link.parentElement.removeChild(link);
        link = templink;
      }
    }
  };

  if (cache.__path) {
    var len = cacheLen;
    SELF.$e.on(cache.__path, function(e, v) {
      w(v.length - len, v);
      len = v.length;
    });
  }

  return fragment;
};

function set(path, source, value) {
  if (typeof path === "string") path = path.split(".");
  path.shift();
  var prop = path.splice(-1);
  for (var i = 0; i < path.length; i++) {
    source = source[path[i]];
  }
  return (source[prop] = value);
}

function NW(source, prop, parent) {
  this.path = source.__path + "." + prop;
  this.get = () => source[prop];
  this.set = value => set(this.path.split("."), parent(), value);
  this.source = source;
  this.prop = prop;
  this.parent = parent;
}

var linkNum = 0;

const link = function(fn, watch, txt) {
  var args = { s: null, a: [], t: [], f: fn.toString() },
    SELF = this;

  if (
    txt.length === 1 &&
    fn
      .toString()
      .replace(/(function \(\)\{ return |\(|\)|\; \})/g, "")
      .trim() === txt[0]
  ) {
    return new NW(watch[0][0], watch[0][1], function() {
      return SELF;
    });
  }

  var len = watch.length;

  args.s = fn.call(this);
  args.a = new Array(len);
  args.t = new Array(len);
  args.__path = "$link-" + linkNum;
  linkNum += 1;

  for (var i = 0; i < len; i++) {
    args.a[i] = watch[i][0][watch[i][1]];
    args.t[i] = "$rdi[" + i + "]";
    args.f = args.f.replace(txt[i], args.t[i]);
    // args.f = args.f.replace(new RegExp(txt[i], 'g'), args.t[i]);
    (function(path, args, p, i) {
      SELF.$e.on(path, (e, v) => {
        args.a[i] = v;
        var cache = args.f.call(SELF, args.a);

        if (args.s !== cache) {
          args.s = cache;
          SELF.$e.emit(p, args.s);
        }
      });
    })(watch[i][0].__path + "." + watch[i][1], args, args.__path + ".s", i);
  }

  args.f = new Function("$rdi", "return " + args.f + "();");

  if (len <= 0) return args.s;
  return new NW(args, "s", function() {
    return SELF;
  });
};

function cond(a, e) {
  return new Condition(a, e, this);
}

function Condition(a, e, SELF) {
  this.cases = [{ a: a, e: e }];
  this.w = [];
  this.cache = [];
  this.els = emptyNode.cloneNode();

  if (isWatchable(a)) {
    this.w.push(a);
  }

  this.watch = function(cb) {
    for (var w in this.w) {
      (function(w) {
        SELF.$e.on(this.w[w].path, (e, v) => {
          cb(v);
        });
      }.call(this, w));
    }
  };

  this.__do = function() {
    var ret = { id: null };
    for (var c in this.cases) {
      var a = isWatchable(this.cases[c].a)
        ? this.cases[c].a.get()
        : this.cases[c].a;
      if (a) {
        ret.id = c;
        ret.r = this.cases[c].e;
        break;
      }
    }
    if (typeof ret.r === "undefined") ret.r = this.els;
    return ret;
  };
}

Condition.prototype.elseif = function(a, e) {
  this.cases.push({ a: a, e: e });
  if (isWatchable(a)) {
    this.w.push(a);
  }
  return this;
};

Condition.prototype.cond = Condition.prototype.elseif;

Condition.prototype.else = function(e) {
  this.els = e;
  return this;
};

function ll(f, w, c) {
  return w ? link.call(this, f, w, c.split(",")) : f;
}

const _Radi = {
  version: _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].VERSION,
  activeComponents: _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].ACTIVE_COMPONENTS,
  r: _utilities_r__WEBPACK_IMPORTED_MODULE_8__["r"],
  l: f => f,
  cond: cond,
  component: _utilities_component__WEBPACK_IMPORTED_MODULE_9__["component"],
  mount: mount,
  freeze: () => {
    _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].FROZEN_STATE = true;
  },
  unfreeze: () => {
    _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].FROZEN_STATE = false;

    for (var ii = 0; ii < _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].ACTIVE_COMPONENTS.length; ii++) {
      if (typeof _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].ACTIVE_COMPONENTS[ii].onMount === "function") {
        _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].ACTIVE_COMPONENTS[ii].onMount.call(
          _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].ACTIVE_COMPONENTS[ii]
        );
      }
    }
  }
};

window.$Radi = _Radi;

function register(c) {
  var cmp = new c();
  var n = cmp.o.name;
  if (!n) {
    console.warn("[Radi.js] Warn: Cannot register component without name");
  } else {
    if (typeof _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].REGISTERED[n] !== "undefined")
      console.warn(
        "[Radi.js] Warn: Component with name '" + n + "' beeing replaced"
      );
    _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].REGISTERED[n] = c;
  }
}

function Radi(o) {
  var SELF = {
    __path: "this"
  };

  // apply mixins
  for (var i in o.$mixins) {
    if (typeof SELF[i] === "undefined") {
      SELF[i] = o.$mixins[i];
    }
  }

  Object.defineProperties(SELF, {
    $mixins: {
      enumerable: false,
      value: o.$mixins
    },
    $mixins_keys: {
      enumerable: false,
      value: new RegExp(
        "^this\\.(" +
          Object.keys(o.$mixins)
            .join("|")
            .replace(/\$/g, "\\$")
            .replace(/\./g, "\\.") +
          ")"
      )
    },
    $e: {
      enumerable: false,
      value: {
        WATCH: {},
        get(path) {
          return SELF.$e.WATCH[path] || (SELF.$e.WATCH[path] = []);
        },
        on(path, fn) {
          if (_consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].FROZEN_STATE) return null;
          return SELF.$e.get(path).push(fn);
        },
        emit(path, r) {
          if (_consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].FROZEN_STATE) return null;
          var list = SELF.$e.get(path),
            len = list.length;
          for (var i = 0; i < len; i++) {
            list[i](path, r);
          }
        }
      }
    }
  });

  function populate(to, path) {
    var ret;
    if (typeof to !== "object" || !to) return false;
    ret =
      typeof to.__path === "undefined"
        ? Object.defineProperty(to, "__path", { value: path })
        : false;
    for (var ii in to) {
      var isMixin = SELF.$mixins_keys.test(path + "." + ii);
      if (
        to.hasOwnProperty(ii) &&
        !Object.getOwnPropertyDescriptor(to, ii).set
      ) {
        if (typeof to[ii] === "object") populate(to[ii], path + "." + ii);
        // Initiate watcher if not already watched
        watcher(to, ii, path.concat(".").concat(ii));
        // Trigger changes for this path
        SELF.$e.emit(path + "." + ii, to[ii]);
      } else if (isMixin) {
        watcher(to, ii, path.concat(".").concat(ii));
      }
    }
    return ret;
  }

  // TODO: Bring back multiple watcher sets
  var dsc = Object.getOwnPropertyDescriptor;
  function watcher(targ, prop, path) {
    var oldval = targ[prop],
      prev =
        typeof dsc(targ, prop) !== "undefined" ? dsc(targ, prop).set : null,
      setter = function(newval) {
        if (oldval !== newval) {
          if (Array.isArray(oldval)) {
            var ret;
            if (this && this.constructor === String) {
              ret = Array.prototype[this].apply(oldval, arguments);
            } else {
              oldval = newval;
              Object(_utilities_arrayMods__WEBPACK_IMPORTED_MODULE_3__["arrayMods"])(oldval, setter);
            }

            populate(oldval, path);
            SELF.$e.emit(path, oldval);
            if (typeof prev === "function") prev(newval);
            return ret;
          } else if (typeof newval === "object") {
            oldval = Object(_utilities_clone__WEBPACK_IMPORTED_MODULE_1__["clone"])(newval);
            populate(oldval, path);
            SELF.$e.emit(path, oldval);
          } else {
            oldval = newval;
            populate(oldval, path);
            SELF.$e.emit(path, oldval);
          }
          if (typeof prev === "function") prev(newval);
          return newval;
        } else {
          return false;
        }
      };

    if (Array.isArray(oldval)) Object(_utilities_arrayMods__WEBPACK_IMPORTED_MODULE_3__["arrayMods"])(oldval, setter);

    if (delete targ[prop]) {
      Object.defineProperty(targ, prop, {
        get: function() {
          return oldval;
        },
        set: setter,
        enumerable: true,
        configurable: true
      });
    }
  }

  for (var i in o.state) {
    if (typeof SELF[i] === "undefined") {
      SELF[i] = o.state[i];
    } else {
      throw new Error(
        "[Radi.js] Err: Trying to write state for reserved variable `" + i + "`"
      );
    }
  }

  for (var i in o.props) {
    if (typeof SELF[i] === "undefined") {
      if (isWatchable(o.props[i])) {
        SELF[i] = o.props[i].get();

        if (o.props[i].parent) {
          o.props[i].parent().$e.on(o.props[i].path, (e, a) => {
            SELF[i] = a;
          });
        }
      } else {
        SELF[i] = o.props[i];
      }
    } else {
      throw new Error(
        "[Radi.js] Err: Trying to write prop for reserved variable `" + i + "`"
      );
    }
  }

  populate(SELF, "this");

  for (var i in o.actions) {
    if (typeof SELF[i] === "undefined") {
      SELF[i] = function() {
        if (_consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].FROZEN_STATE) return null;
        return o.actions[this].apply(SELF, arguments);
      }.bind(i);
    } else {
      throw new Error(
        "[Radi.js] Error: Trying to write action for reserved variable `" +
          i +
          "`"
      );
    }
  }

  Object.defineProperties(SELF, {
    $id: {
      enumerable: false,
      value: _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].IDS++
    },
    $name: {
      enumerable: false,
      value: o.name
    },
    $state: {
      enumerable: false,
      value: o.state || {}
    },
    $props: {
      enumerable: false,
      value: o.props || {}
    },
    $actions: {
      enumerable: false,
      value: o.actions || {}
    },
    $html: {
      enumerable: false,
      value: document.createDocumentFragment()
    },
    $parent: {
      enumerable: false,
      value: null
    },
    $view: {
      enumerable: false,
      value: new Function("r", "list", "ll", "cond", "return " + o.$view)(
        _utilities_r__WEBPACK_IMPORTED_MODULE_8__["r"].bind(SELF),
        list.bind(SELF),
        ll.bind(SELF),
        cond.bind(SELF)
      )
    },
    $render: {
      enumerable: false,
      value: function() {
        SELF.mount();
        return SELF.$html;
      }
    }
  });

  Object.defineProperties(SELF, {
    $link: {
      enumerable: false,
      value: SELF.$view()
    }
  });

  SELF.$html.appendChild(SELF.$link);

  SELF.$html.destroy = function() {
    const oldRootElem = SELF.$link.parentElement;
    const newRootElem = oldRootElem.cloneNode(false);
    oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
    SELF.unmount();
    oldRootElem.parentNode.removeChild(oldRootElem);
  };

  SELF.mount = function() {
    if (typeof SELF.$actions.onMount === "function") {
      SELF.$actions.onMount.call(SELF);
    }
    _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].ACTIVE_COMPONENTS.push(SELF);
  };

  SELF.unmount = function() {
    if (typeof SELF.$actions.onDestroy === "function") {
      SELF.$actions.onDestroy.call(SELF);
    }
    for (var i = 0; i < _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].ACTIVE_COMPONENTS.length; i++) {
      if (_consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].ACTIVE_COMPONENTS[i].$id === SELF.$id) {
        _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_11__["GLOBALS"].ACTIVE_COMPONENTS.splice(i, 1);
        break;
      }
    }
    return SELF.$link;
  };

  SELF.$link.unmount = SELF.unmount.bind(SELF);
  SELF.$link.mount = SELF.mount.bind(SELF);

  return SELF;
}

function setAttr(view, arg1, arg2) {
  var self = this;
  var el = getEl(view);

  if (arg2 !== undefined) {
    if (arg1 === "style") {
      _utilities_setStyle__WEBPACK_IMPORTED_MODULE_7__["setStyle"].call(this, el, arg2);
    } else if (arg1 === "model" && isWatchable(arg2)) {
      var cache = arg2.get();
      el.value = cache;
      el["oninput"] = function() {
        arg2.set(el.value);
        cache = el.value;
        self.$e.emit(arg2.path, el.value);
      };
      // Update bind
      (function(cache, arg1, arg2) {
        self.$e.on(arg2.path, function(e, v) {
          if (v === cache) return false;
          Object(_utilities_radiMutate__WEBPACK_IMPORTED_MODULE_6__["radiMutate"])(
            () => {
              el.value = v;
            },
            el.key,
            "attr1"
          );
          cache = v;
        });
      })(cache, arg1, arg2);
    } else if (isFunction(arg2)) {
      el[arg1] = function(e) {
        arg2.call(self, e);
      };
    } else if (isWatchable(arg2)) {
      var temp = arg2.get();
      if (isFunction(temp)) {
        el[arg1] = function(e) {
          arg2.get().call(self, e);
        };
      } else {
        var cache = arg2.get();
        if (cache !== false)
          if (arg1 === "html") {
            el.innerHTML = cache;
          } else {
            el.setAttribute(arg1, cache);
          }

        // Update bind
        (function(cache, arg1, arg2) {
          self.$e.on(arg2.path, function(e, v) {
            if (v === cache) return false;
            Object(_utilities_radiMutate__WEBPACK_IMPORTED_MODULE_6__["radiMutate"])(
              () => {
                if (v !== false) {
                  if (arg1 === "html") {
                    el.innerHTML = v;
                  } else {
                    el.setAttribute(arg1, v);
                  }
                } else {
                  el.removeAttribute(arg1);
                }
              },
              el.key,
              "attr2"
            );
            cache = v;
          });
        })(cache, arg1, arg2);
      }
    } else {
      if (cache !== false)
        if (arg1 === "html") {
          el.innerHTML = arg2;
        } else {
          el.setAttribute(arg1, arg2);
        }
    }
  } else {
    for (var key in arg1) {
      setAttr.call(this, el, key, arg1[key]);
    }
  }
}

function radiArgs(element, args) {
  const self = this;

  args.forEach((arg, i) => {
    if (!arg) return;

    // support middleware
    if (isComponent(arg)) {
      element.appendChild(arg.__radi().$render());
    } else if (isCondition(arg)) {
      var arg2 = arg.__do(),
        a,
        id = arg2.id;
      if (isComponent(arg2.r)) {
        a = arg2.r.__radi().$render();
      } else if (typeof arg2.r === "function") {
        a = arg2.r();
      } else if (isString(arg2.r) || isNumber(arg2.r)) {
        a = text(arg2.r);
      } else {
        a = arg2.r;
      }
      element.appendChild(a);
      afterAppendChild(arg, id, a);
    } else if (typeof arg === "function") {
      debugger;
      arg.call(this, element);
    } else if (isString(arg) || isNumber(arg)) {
      element.appendChild(text(arg));
    } else if (isNode(getEl(arg))) {
      element.appendChild(arg);
    } else if (Array.isArray(arg)) {
      radiArgs.call(this, element, arg);
    } else if (isWatchable(arg)) {
      var cache = arg.get();
      var z = text(cache);
      element.appendChild(z);

      // Update bind
      updateBind(self, z, element)(cache, arg);
    } else if (typeof arg === "object") {
      setAttr.call(this, element, arg);
    }
  });
}

const afterAppendChild = (arg, id, a) => {
  arg.watch(function(v) {
    const arg2 = arg.__do();
    let b = null;

    if (id === arg2.id) return false;
    if (isComponent(arg2.r)) {
      b = arg2.r.__radi().$render();
    } else if (typeof arg2.r === "function") {
      b = arg2.r();
    } else if (isString(arg2.r) || isNumber(arg2.r)) {
      b = text(arg2.r);
    } else {
      b = arg2.r;
    }

    Object(_utilities_unmountAll__WEBPACK_IMPORTED_MODULE_4__["unmountAll"])(a);
    a.parentNode.replaceChild(b, a);
    a = b;
    Object(_utilities_mountAll__WEBPACK_IMPORTED_MODULE_5__["mountAll"])(a);
    id = arg2.id;
  });
};

const updateBind = (self, z, element) => (cache, arg) => {
  self.$e.on(arg.path, updateBundInnerFn(cache, z, element));
};

// TODO: Rename and understand.
const updateBundInnerFn = (cache, z, element) => (e, v) => {
  if (v === cache) return false;

  cache = v;

  Object(_utilities_radiMutate__WEBPACK_IMPORTED_MODULE_6__["radiMutate"])(
    () => {
      z.textContent = v;
    },
    element.key,
    "text"
  );
};


/***/ }),

/***/ "./src/utilities/ComponentClass.js":
/*!*****************************************!*\
  !*** ./src/utilities/ComponentClass.js ***!
  \*****************************************/
/*! exports provided: Component */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Component", function() { return Component; });
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index */ "./src/index.js");
/* harmony import */ var _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../consts/GLOBALS */ "./src/consts/GLOBALS.js");
/* harmony import */ var _clone__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./clone */ "./src/utilities/clone.js");




function Component(o) {
  this.o = {
    name: o.name,
    state: Object(_clone__WEBPACK_IMPORTED_MODULE_2__["clone"])(o.state),
    props: Object(_clone__WEBPACK_IMPORTED_MODULE_2__["clone"])(o.props),
    actions: o.actions,
    view: o.view,
    $view: o.$view,
    $mixins: this.$mixins || {}
  };

  this.__radi = function() {
    return new _index__WEBPACK_IMPORTED_MODULE_0__["Radi"](this.o);
  };
}

Component.prototype.props = function props(p) {
  for (var k in p) {
    if (typeof this.o.props[k] === "undefined") {
      console.warn(
        "[Radi.js] Warn: Creating a prop `",
        k,
        "` that is not defined in component"
      );
    }
    this.o.props[k] = p[k];
  }
  return this;
};

Component.prototype.$mixins = {};




/***/ }),

/***/ "./src/utilities/arrayMods.js":
/*!************************************!*\
  !*** ./src/utilities/arrayMods.js ***!
  \************************************/
/*! exports provided: arrayMods */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "arrayMods", function() { return arrayMods; });
const arrayMods = (v, s) => {
  if (!Array.isArray(v) || v.__radi) return false;
  return Object.defineProperties(v, {
    __radi: { value: true },
    reverse: { value: s.bind("reverse") },
    push: { value: s.bind("push") },
    splice: { value: s.bind("splice") },
    pop: { value: s.bind("pop") },
    shift: { value: s.bind("shift") }
  });
};


/***/ }),

/***/ "./src/utilities/clone.js":
/*!********************************!*\
  !*** ./src/utilities/clone.js ***!
  \********************************/
/*! exports provided: clone */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clone", function() { return clone; });
const clone = obj => {
  let i, ret, ret2;
  if (typeof obj === "object") {
    if (obj === null) return obj;
    if (Object.prototype.toString.call(obj) === "[object Array]") {
      let len = obj.length;
      ret = new Array(len);
      for (i = 0; i < len; i++) {
        if (typeof obj[i] === "object") {
          ret[i] = clone(obj[i]);
        } else {
          ret[i] = obj[i];
        }
      }
    } else {
      ret = {};
      for (i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (typeof (obj[i] === "object")) {
            ret[i] = clone(obj[i]);
          } else {
            ret[i] = obj[i];
          }
        }
      }
    }
  } else {
    ret = obj;
  }

  return ret;
};


/***/ }),

/***/ "./src/utilities/component.js":
/*!************************************!*\
  !*** ./src/utilities/component.js ***!
  \************************************/
/*! exports provided: component */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "component", function() { return component; });
/* harmony import */ var _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../consts/GLOBALS */ "./src/consts/GLOBALS.js");
/* harmony import */ var _consts_REGEX__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../consts/REGEX */ "./src/consts/REGEX.js");
/* harmony import */ var _ComponentClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ComponentClass */ "./src/utilities/ComponentClass.js");




function component(o) {
  var fn = o.view.toString().replace(_consts_REGEX__WEBPACK_IMPORTED_MODULE_1__["COMMENTS"], ""),
    match = _consts_REGEX__WEBPACK_IMPORTED_MODULE_1__["FIND_L"].exec(fn),
    cursor = 0;
  o.$view = "";

  while (match !== null) {
    var n = match.index,
      all = match.input,
      _l = 1,
      _r = 0;

    const len = all.length;

    for (var i = n + 2; i < len; i++) {
      var char = all.charCodeAt(i);
      if (char === _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["GLOBALS"].RL) {
        _l += 1;
      } else if (char === _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["GLOBALS"].RR) {
        _r += 1;
      }
      if (_l === _r) break;
    }

    var found = all.substr(n, i + 1 - n);

    var m = found.match(/[a-zA-Z_$]+(?:\.[a-zA-Z_$]+(?:\[.*\])?)+/g) || [];
    // var obs = (m.length > 0) ? m.join('__ob__,') + '__ob__' : '';
    var obs = [];
    for (var i = 0; i < m.length; i++) {
      var temp = m[i].split(".");
      if (temp.length > 1) {
        var last = temp.splice(-1)[0];
        obs.push("[" + temp.join(".") + ', "' + last + '"]');
      }
    }
    var obs = obs.join(",");
    var newString =
      "ll(function(){ return " +
      found.substr(1) +
      "; },[" +
      obs +
      '], "' +
      m.join(",") +
      '")';

    o.$view = o.$view.concat(fn.substr(cursor, n - cursor)).concat(newString);
    cursor = n + found.length;

    match = _consts_REGEX__WEBPACK_IMPORTED_MODULE_1__["FIND_L"].exec(fn);
  }
  o.$view = o.$view.concat(fn.substr(cursor, fn.length - cursor));

  return _ComponentClass__WEBPACK_IMPORTED_MODULE_2__["Component"].bind(this, o);
}


/***/ }),

/***/ "./src/utilities/createElement.js":
/*!****************************************!*\
  !*** ./src/utilities/createElement.js ***!
  \****************************************/
/*! exports provided: createElement */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createElement", function() { return createElement; });
const createElement = (query, ns) => {
  return ns
    ? document.createElementNS(ns, query)
    : document.createElement(query);
};


/***/ }),

/***/ "./src/utilities/memoizeHTML.js":
/*!**************************************!*\
  !*** ./src/utilities/memoizeHTML.js ***!
  \**************************************/
/*! exports provided: memoizeHTML */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "memoizeHTML", function() { return memoizeHTML; });
/* harmony import */ var _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../consts/GLOBALS */ "./src/consts/GLOBALS.js");
/* harmony import */ var _createElement__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./createElement */ "./src/utilities/createElement.js");



const memoizeHTML = query => {
  return (
    _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["GLOBALS"].HTML_CACHE[query] ||
    (_consts_GLOBALS__WEBPACK_IMPORTED_MODULE_0__["GLOBALS"].HTML_CACHE[query] = Object(_createElement__WEBPACK_IMPORTED_MODULE_1__["createElement"])(query))
  );
};


/***/ }),

/***/ "./src/utilities/mountAll.js":
/*!***********************************!*\
  !*** ./src/utilities/mountAll.js ***!
  \***********************************/
/*! exports provided: mountAll */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "mountAll", function() { return mountAll; });
const mountAll = el => {
  if (typeof el.mount === "function") el.mount();
  if (el.children && el.children.length > 0) {
    for (var i = 0; i < el.children.length; i++) {
      mountAll(el.children[i]);
    }
  }
};


/***/ }),

/***/ "./src/utilities/r.js":
/*!****************************!*\
  !*** ./src/utilities/r.js ***!
  \****************************/
/*! exports provided: r */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "r", function() { return r; });
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index */ "./src/index.js");
/* harmony import */ var _memoizeHTML__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./memoizeHTML */ "./src/utilities/memoizeHTML.js");
/* harmony import */ var _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../consts/GLOBALS */ "./src/consts/GLOBALS.js");






function r(query) {
  var args = [],
    len = arguments.length - 1;
  while (len-- > 0) args[len] = arguments[len + 1];

  var element;

  if (Object(_index__WEBPACK_IMPORTED_MODULE_0__["isString"])(query)) {
    if (typeof _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_2__["GLOBALS"].REGISTERED[query] !== "undefined") {
      // TODO: Make props and childs looped,
      // aka don't assume that first obj are props
      var props = args[0] || {};
      return (element = new _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_2__["GLOBALS"].REGISTERED[query]().props(props));
    } else {
      element = Object(_memoizeHTML__WEBPACK_IMPORTED_MODULE_1__["memoizeHTML"])(query).cloneNode(false);
    }
  } else if (Object(_index__WEBPACK_IMPORTED_MODULE_0__["isNode"])(query)) {
    element = query.cloneNode(false);
  } else {
    element = document.createDocumentFragment();
  }

  element.key = _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_2__["GLOBALS"].R_KEYS;
  _consts_GLOBALS__WEBPACK_IMPORTED_MODULE_2__["GLOBALS"].R_KEYS += 1;

  _index__WEBPACK_IMPORTED_MODULE_0__["radiArgs"].call(this, element, args);

  return element;
}

r.extend = function(query) {
  var args = [],
    len = arguments.length - 1;
  while (len-- > 0) args[len] = arguments[len + 1];

  var clone = Object(_memoizeHTML__WEBPACK_IMPORTED_MODULE_1__["memoizeHTML"])(query);

  return r.bind.apply(r, [this, clone].concat(args));
};


/***/ }),

/***/ "./src/utilities/radiMutate.js":
/*!*************************************!*\
  !*** ./src/utilities/radiMutate.js ***!
  \*************************************/
/*! exports provided: radiMutate */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "radiMutate", function() { return radiMutate; });
const radiMutate = (c, key, type) => {
  c();
  // if (!lock) {
  // 	pipeline[key + '-' + type] = c
  // 	if (!pipequeued) setTimeout(render)
  // 	pipequeued = true
  // }
};


/***/ }),

/***/ "./src/utilities/setStyle.js":
/*!***********************************!*\
  !*** ./src/utilities/setStyle.js ***!
  \***********************************/
/*! exports provided: setStyle */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setStyle", function() { return setStyle; });
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index */ "./src/index.js");
/* harmony import */ var _radiMutate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./radiMutate */ "./src/utilities/radiMutate.js");





const setStyle = (view, arg1, arg2) => {
  var self = undefined;
  var el = Object(_index__WEBPACK_IMPORTED_MODULE_0__["getEl"])(view);

  if (Object(_index__WEBPACK_IMPORTED_MODULE_0__["isWatchable"])(arg2)) {
    var cache = arg2.get();
    el.style[arg1] = cache;

    // Update bind
    (function(cache, arg1, arg2) {
      self.$e.on(arg2.path, function(e, v) {
        if (v === cache) return false;
        Object(_radiMutate__WEBPACK_IMPORTED_MODULE_1__["radiMutate"])(
          () => {
            el.style[arg1] = v;
          },
          el.key,
          "style"
        );
        cache = v;
      });
    })(cache, arg1, arg2);
  } else if (arg2 !== undefined) {
    el.style[arg1] = arg2;
  } else if (Object(_index__WEBPACK_IMPORTED_MODULE_0__["isString"])(arg1)) {
    el.setAttribute("style", arg1);
  } else {
    for (var key in arg1) {
      setStyle.call(undefined, el, key, arg1[key]);
    }
  }
};


/***/ }),

/***/ "./src/utilities/unmountAll.js":
/*!*************************************!*\
  !*** ./src/utilities/unmountAll.js ***!
  \*************************************/
/*! exports provided: unmountAll */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "unmountAll", function() { return unmountAll; });
const unmountAll = el => {
  if (typeof el.unmount === "function") el.unmount();
  if (el.children && el.children.length > 0) {
    for (var i = 0; i < el.children.length; i++) {
      unmountAll(el.children[i]);
    }
  }
};


/***/ })

/******/ });
//# sourceMappingURL=main.bundle.js.map