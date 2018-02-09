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

      var module = cache[name] = new newRequire.Module;

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

  function Module() {
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({9:[function(require,module,exports) {
var global = (1,eval)("this");
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.router = {})));
}(this, (function (exports) { 'use strict';
  var radi
  // if (typeof radi === 'undefined') { console.warn('[Radi.js Router] Err: Radi.js package not found'); return false; }

	const COLON = ':'.charCodeAt(0)
  var cr, crg, lr, ld

	var parseRoute = function parseRoute(route) {
		var parts = route.split('/'), end = [], p = []
		for (var i = 0; i < parts.length; i++) {
			if (COLON === parts[i].charCodeAt(0)) {
				end.push('([^\/]+?)')
				p.push(parts[i].substr(1))
			} else if (parts[i] !== '') {
				end.push(parts[i])
			}
		}
		return [new RegExp('^/' + end.join('/') + '(?:\/(?=$))?$', 'i'), p]
	}

	var parseAllRoutes = function parseAllRoutes(arr) {
		var len = arr.length, ret = new Array(len)
		for (var i = len - 1; i >= 0; i--) {
			ret[i] = parseRoute(arr[i])
		}
		return ret
	}

	class Route {
		constructor(curr, match, routes, key) {
			var m = curr.match(match[0])
			this.path = curr
			this.key = key
			this.params = {}
			for (var i = 0; i < match[1].length; i++) {
				this.params[match[1][i]] = m[i + 1]
			}
			this.cmp = routes[key]
		}
	}

  function router(src) {
    radi = src
    return function(ro) {
  	  function getRoute(curr) {
    		if (lr === curr) return ld
    		if (!cr) cr = Object.keys(ro.routes)
    		if (!crg) crg = parseAllRoutes(cr)

    		for (var i = 0; i < crg.length; i++) {
    			if (crg[i][0].test(curr)) {
    				ld = new Route(curr, crg[i], ro.routes, cr[i])
    				break
    			}
    		}
    		return ld
    	}

      window.r_routes = ro.routes
      window.r_before = ro.beforeEach || true
      window.r_after = ro.afterEach || null

      var conds = ''
      for (var route in ro.routes) {
        conds = conds.concat(`cond(
          l(this.active === '${route}' && (r_before === true || r_before('${route}',2))),
          function () { var ret = r('div', new r_routes['${route}']()); if(r_after)r_after(); return ret; }
        ).`)
      }
      if (conds !== '') conds = conds.concat('else(\'Error 404\')')

      var fn = `return r('div', ${conds})`

      return radi.component({
        name: 'radi-router',
        view: new Function(fn),
        state: {
          // _radi_no_debug: true,
          location: window.location.hash.substr(1),
          active: null
        },
        actions: {
          onMount() {
            window.onhashchange = this.hashChange
            this.hashChange()
          },
          hashChange() {
            this.location = window.location.hash.substr(1)
            var a = getRoute(this.location)
            if (a) {
              this.active = a.key
            }
            console.log('[radi-router] Route change', a)
          }
        }
      })
    };
  };

  exports.default = router;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],4:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.r = r;
exports.component = component;
exports.use = use;
const version = exports.version = '0.1.1';

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var FIND_L = /\bl\(/g;
var RL = '('.charCodeAt(0);
var RR = ')'.charCodeAt(0);
var HASH = '#'.charCodeAt(0);
var DOT = '.'.charCodeAt(0);

var TAGNAME = 0;
var ID = 1;
var CLASSNAME = 2;

var frozenState = false;

function isArray(o) {
	return Array.isArray(o) === true;
}

if (!Array.isArray) {
	Array.isArray = function (arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	};
}

function clone(obj) {
	var i, ret, ret2;
	if (typeof obj === "object") {
		if (obj === null) return obj;
		if (Object.prototype.toString.call(obj) === "[object Array]") {
			var len = obj.length;
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
}

function parseQuery(query) {
	var tag = null;
	var id = null;
	var className = null;
	var mode = TAGNAME;
	var buffer = '';

	for (var i = 0; i <= query.length; i++) {
		var char = query.charCodeAt(i);
		var isHash = char === HASH;
		var isDot = char === DOT;
		var isEnd = !char;

		if (isHash || isDot || isEnd) {
			if (mode === TAGNAME) {
				if (i === 0) {
					tag = 'div';
				} else {
					tag = buffer;
				}
			} else if (mode === ID) {
				id = buffer;
			} else {
				if (className) {
					className += ' ' + buffer;
				} else {
					className = buffer;
				}
			}

			if (isHash) {
				mode = ID;
			} else if (isDot) {
				mode = CLASSNAME;
			}

			buffer = '';
		} else {
			buffer += query[i];
		}
	}

	return { tag: tag, id: id, className: className };
};

function createElement(query, ns) {
	var ref = parseQuery(query);
	var tag = ref.tag;
	var id = ref.id;
	var className = ref.className;
	var element = ns ? document.createElementNS(ns, tag) : document.createElement(tag);

	if (id) {
		element.id = id;
	}

	if (className) {
		if (ns) {
			element.setAttribute('class', className);
		} else {
			element.className = className;
		}
	}

	return element;
};

var arrayMods = function (v, s) {
	if (!isArray(v) || v.__radi) return false;
	// if (v.__radi) return false
	return Object.defineProperties(v, {
		__radi: { value: true },
		reverse: { value: s.bind('reverse') },
		push: { value: s.bind('push') },
		splice: { value: s.bind('splice') },
		pop: { value: s.bind('pop') },
		shift: { value: s.bind('shift') }
	});
};

var ids = 0;
const activeComponents = exports.activeComponents = [];

function Radi(o) {
	var SELF = {
		__path: 'this'
	};

	function populate(to, path) {
		var ret;
		if (typeof to !== 'object' || !to) return false;
		ret = typeof to.__path === 'undefined' ? Object.defineProperty(to, '__path', { value: path }) : false;
		for (var ii in to) {
			if (to.hasOwnProperty(ii) && !Object.getOwnPropertyDescriptor(to, ii).set) {
				if (typeof to[ii] === 'object') populate(to[ii], path + '.' + ii);
				// Initiate watcher if not already watched
				watcher(to, ii, path.concat('.').concat(ii));
				// Trigger changes for this path
				SELF.$e.emit(path + '.' + ii, to[ii]);
			}
		}
		return ret;
	}

	Object.defineProperty(SELF, '$e', {
		enumerable: false,
		value: {
			WATCH: {},
			get(path) {
				return SELF.$e.WATCH[path] || (SELF.$e.WATCH[path] = []);
			},
			on(path, fn) {
				if (frozenState) return null;
				return SELF.$e.get(path).push(fn);
			},
			emit(path, r) {
				if (frozenState) return null;
				var list = SELF.$e.get(path),
				    len = list.length;
				for (var i = 0; i < len; i++) {
					list[i](path, r);
				}
			}
		}
	});

	function watcher(targ, prop, path) {
		var oldval = targ[prop],
		    setter = function (newval) {
			if (oldval !== newval) {
				if (Array.isArray(oldval)) {
					var ret;
					if (this && this.constructor === String) {
						ret = Array.prototype[this].apply(oldval, arguments);
					} else {
						oldval = newval;
						arrayMods(oldval, setter);
					}

					populate(oldval, path);
					SELF.$e.emit(path, oldval);
					return ret;
				} else if (typeof newval === 'object') {
					oldval = clone(newval);
					populate(oldval, path);
					SELF.$e.emit(path, oldval);
				} else {
					oldval = newval;
					populate(oldval, path);
					SELF.$e.emit(path, oldval);
				}
				return newval;
			} else {
				return false;
			}
		};

		if (Array.isArray(oldval)) arrayMods(oldval, setter);

		if (delete targ[prop]) {
			Object.defineProperty(targ, prop, {
				get: function () {
					return oldval;
				},
				set: setter,
				enumerable: true,
				configurable: true
			});
		}
	}

	for (var i in o.state) {
		if (typeof SELF[i] === 'undefined') {
			SELF[i] = o.state[i];
		} else {
			throw new Error('[Radi.js] Err: Trying to write state for reserved variable `' + i + '`');
		}
	}

	for (var i in o.props) {
		if (typeof SELF[i] === 'undefined') {
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
			throw new Error('[Radi.js] Err: Trying to write prop for reserved variable `' + i + '`');
		}
	}

	populate(SELF, 'this');

	for (var i in o.actions) {
		if (typeof SELF[i] === 'undefined') {
			SELF[i] = function () {
				if (frozenState) return null;
				return o.actions[this].apply(SELF, arguments);
			}.bind(i);
		} else {
			throw new Error('[Radi.js] Error: Trying to write action for reserved variable `' + i + '`');
		}
	}

	Object.defineProperties(SELF, {
		$id: {
			enumerable: false,
			value: ids++
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
			value: new Function('r', 'list', 'll', 'cond', 'return ' + o.$view)(r.bind(SELF), list.bind(SELF), ll.bind(SELF), cond.bind(SELF))
		},
		$render: {
			enumerable: false,
			value: function () {
				SELF.mount();
				return SELF.$html;
			}
		}
	});

	Object.defineProperty(SELF, '$link', {
		enumerable: false,
		value: SELF.$view()
	});

	SELF.$html.appendChild(SELF.$link);

	SELF.$html.destroy = function () {
		const oldRootElem = SELF.$link.parentElement;
		const newRootElem = oldRootElem.cloneNode(false);
		oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
		SELF.unmount();
		oldRootElem.parentNode.removeChild(oldRootElem);
	};

	SELF.mount = function () {
		if (typeof SELF.$actions.onMount === 'function') {
			SELF.$actions.onMount.call(SELF);
		}
		activeComponents.push(SELF);
	};

	SELF.unmount = function () {
		if (typeof SELF.$actions.onDestroy === 'function') {
			SELF.$actions.onDestroy.call(SELF);
		}
		for (var i = 0; i < activeComponents.length; i++) {
			if (activeComponents[i].$id === SELF.$id) {
				activeComponents.splice(i, 1);
				break;
			}
		}
		return SELF.$link;
	};

	SELF.$link.unmount = SELF.unmount.bind(SELF);
	SELF.$link.mount = SELF.mount.bind(SELF);

	return SELF;
}

function unmountAll(el) {
	if (typeof el.unmount === 'function') el.unmount();
	if (el.children && el.children.length > 0) {
		for (var i = 0; i < el.children.length; i++) {
			unmountAll(el.children[i]);
		}
	}
}

function mountAll(el) {
	if (typeof el.mount === 'function') el.mount();
	if (el.children && el.children.length > 0) {
		for (var i = 0; i < el.children.length; i++) {
			mountAll(el.children[i]);
		}
	}
}

function radiMutate(c) {
	c();
}

function setStyle(view, arg1, arg2) {
	var self = this;
	var el = getEl(view);

	if (isWatchable(arg2)) {
		var cache = arg2.get();
		el.style[arg1] = cache;

		// Update bind
		(function (cache, arg1, arg2) {
			self.$e.on(arg2.path, function (e, v) {
				if (v === cache) return false;
				radiMutate(() => {
					el.style[arg1] = v;
				});
				cache = v;
			});
		})(cache, arg1, arg2);
	} else if (arg2 !== undefined) {
		el.style[arg1] = arg2;
	} else if (isString(arg1)) {
		el.setAttribute('style', arg1);
	} else {
		for (var key in arg1) {
			setStyle.call(this, el, key, arg1[key]);
		}
	}
};

function setAttr(view, arg1, arg2) {
	var self = this;
	var el = getEl(view);

	if (arg2 !== undefined) {
		if (arg1 === 'style') {
			setStyle.call(this, el, arg2);
		} else if (arg1 === 'model' && isWatchable(arg2)) {
			var cache = arg2.get();
			el.value = cache;
			el['oninput'] = function () {
				arg2.source[arg2.prop] = cache = el.value;self.$e.emit(arg2.path, el.value);
			};
			// Update bind
			(function (cache, arg1, arg2) {
				self.$e.on(arg2.path, function (e, v) {
					if (v === cache) return false;
					radiMutate(() => {
						el.value = v;
					});
					cache = v;
				});
			})(cache, arg1, arg2);
		} else if (isFunction(arg2)) {
			el[arg1] = function (e) {
				arg2.call(self, e);
			};
		} else if (isWatchable(arg2)) {
			var temp = arg2.get();
			if (isFunction(temp)) {
				el[arg1] = function (e) {
					arg2.get().call(self, e);
				};
			} else {
				var cache = arg2.get();
				let z = el.setAttribute(arg1, cache);

				// Update bind
				(function (cache, arg1, arg2) {
					self.$e.on(arg2.path, function (e, v) {
						if (v === cache) return false;
						radiMutate(() => {
							el.setAttribute(arg1, v);
						});
						cache = v;
					});
				})(cache, arg1, arg2);
			}
		} else {
			el.setAttribute(arg1, arg2);
		}
	} else {
		for (var key in arg1) {
			setAttr.call(this, el, key, arg1[key]);
		}
	}
};

var ensureEl = function (parent) {
	return isString(parent) ? html(parent) : getEl(parent);
};
var getEl = function (parent) {
	return parent.nodeType && parent || !parent.el && parent || getEl(parent.el);
};

var isString = function (a) {
	return typeof a === 'string';
};
var isNumber = function (a) {
	return typeof a === 'number';
};
var isFunction = function (a) {
	return typeof a === 'function';
};

var isNode = function (a) {
	return a && a.nodeType;
};
var isWatchable = function (a) {
	return a && a instanceof NW;
};
var isCondition = function (a) {
	return a && a instanceof Condition;
};
var isComponent = function (a) {
	return a && a.__radi;
};

const text = exports.text = function (str) {
	return document.createTextNode(str);
};

function radiArgs(element, args) {
	var self = this;
	for (var i = 0; i < args.length; i++) {
		var arg = args[i];

		if (arg !== 0 && !arg) {
			continue;
		}

		// support middleware
		if (isComponent(arg)) {
			element.appendChild(arg.__radi().$render());
		} else if (isCondition(arg)) {
			var arg2 = arg.__do(),
			    a,
			    id = arg2.id;
			if (isComponent(arg2.r)) {
				a = arg2.r.__radi().$render();
			} else if (typeof arg2.r === 'function') {
				a = arg2.r();
			} else if (isString(arg2.r) || isNumber(arg2.r)) {
				a = text(arg2.r);
			} else {
				a = arg2.r;
			}
			element.appendChild(a);
			(function (arg) {
				arg.watch(function (v) {
					var arg2 = arg.__do(),
					    b;
					if (id === arg2.id) return false;
					if (isComponent(arg2.r)) {
						b = arg2.r.__radi().$render();
					} else if (typeof arg2.r === 'function') {
						b = arg2.r();
					} else if (isString(arg2.r) || isNumber(arg2.r)) {
						b = text(arg2.r);
					} else {
						b = arg2.r;
					}
					unmountAll(a);
					a.parentNode.replaceChild(b, a);
					a = b;
					mountAll(a);
					id = arg2.id;
				});
			})(arg);
		} else if (typeof arg === 'function') {
			arg.call(this, element);
		} else if (isString(arg) || isNumber(arg)) {
			element.appendChild(text(arg));
		} else if (isNode(getEl(arg))) {
			element.appendChild(arg);
		} else if (Array.isArray(arg)) {
			radiArgs.call(this, element, arg);
		} else if (isWatchable(arg)) {
			var cache = arg.get();
			let z = text(cache);
			element.appendChild(z);

			// Update bind
			(function (cache, arg) {
				self.$e.on(arg.path, function (e, v) {
					if (v === cache) return false;
					radiMutate(() => {
						z.textContent = v;
					});
					cache = v;
				});
			})(cache, arg);
		} else if (typeof arg === 'object') {
			setAttr.call(this, element, arg);
		}
	}
}

var htmlCache = {};

function memoizeHTML(query) {
	return htmlCache[query] || (htmlCache[query] = createElement(query));
};

function r(query) {
	var args = [],
	    len = arguments.length - 1;
	while (len-- > 0) args[len] = arguments[len + 1];

	var element;

	if (isString(query)) {
		element = memoizeHTML(query).cloneNode(false);
	} else if (isNode(query)) {
		element = query.cloneNode(false);
	} else {
		element = document.createDocumentFragment();
	}

	radiArgs.call(this, element, args);

	return element;
};
r.extend = function (query) {
	var args = [],
	    len = arguments.length - 1;
	while (len-- > 0) args[len] = arguments[len + 1];

	var clone = memoizeHTML(query);

	return r.bind.apply(r, [this, clone].concat(args));
};

function component(o) {
	var fn = o.view.toString().replace(STRIP_COMMENTS, ''),
	    match = FIND_L.exec(fn),
	    cursor = 0;
	o.$view = '';

	while (match !== null) {
		var n = match.index,
		    all = match.input,
		    _l = 1,
		    _r = 0;

		const len = all.length;

		for (var i = n + 2; i < len; i++) {
			var char = all.charCodeAt(i);
			if (char === RL) {
				_l += 1;
			} else if (char === RR) {
				_r += 1;
			}
			if (_l === _r) break;
		}

		var found = all.substr(n, i + 1 - n);

		var m = found.match(/[a-zA-Z_$]+(?:\.\w+(?:\[.*\])?)+/g) || [];
		// var obs = (m.length > 0) ? m.join('__ob__,') + '__ob__' : '';
		var obs = [];
		for (var i = 0; i < m.length; i++) {
			var temp = m[i].split('.');
			if (temp.length > 1) {
				var last = temp.splice(-1)[0];
				obs.push('[' + temp.join('.') + ', "' + last + '"]');
			}
		}
		var obs = obs.join(',');
		var newString = 'll(function(){ return ' + found.substr(1) + '; },[' + obs + '], "' + m.join(',') + '")';

		o.$view = o.$view.concat(fn.substr(cursor, n - cursor)).concat(newString);
		cursor = n + found.length;

		match = FIND_L.exec(fn);
	}
	o.$view = o.$view.concat(fn.substr(cursor, fn.length - cursor));

	return Component.bind(this, o);
};
function Component(o) {
	this.o = {
		name: o.name,
		state: clone(o.state),
		props: clone(o.props),
		actions: o.actions,
		view: o.view,
		$view: o.$view
	};

	this.__radi = function () {
		return new Radi(this.o);
	};
};
Component.prototype.props = function props(p) {
	for (var k in p) {
		if (typeof this.o.props[k] === 'undefined') {
			console.warn('[Radi.js] Warn: Creating a prop `', k, '` that is not defined in component');
		}
		this.o.props[k] = p[k];
	}
	return this;
};

const mount = exports.mount = function (comp, id) {
	const where = id.constructor === String ? document.getElementById(id) : id;
	var out = comp instanceof Component ? comp.__radi().$render() : comp;
	where.appendChild(out);
	return out;
};

var emptyNode = text('');

const list = exports.list = function (data, act) {
	if (!data) return '';
	var SELF = this;

	var link,
	    fragment = document.createDocumentFragment(),
	    toplink = emptyNode.cloneNode();

	fragment.appendChild(toplink);

	var ret = [];
	var cache = data.source[data.prop];

	if (isArray(cache)) {
		for (var i = 0; i < cache.length; i++) {
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

	var w = function (a, b) {
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

	if (data.path) {
		var len = cache.length;
		SELF.$e.on(data.path, function (e, v) {
			w(v.length - len, v);
			len = v.length;
		});
	}

	return fragment;
};

function NW(source, prop, parent) {
	this.path = source.__path + '.' + prop;
	this.get = () => source[prop];
	this.source = source;
	this.prop = prop;
	this.parent = parent;
}

var linkNum = 0;

const link = exports.link = function (fn, watch, txt) {
	var args = { s: null, a: [], t: [], f: fn.toString() },
	    SELF = this;

	if (txt.length === 1 && fn.toString().replace(/(function \(\)\{ return |\(|\)|\; \})/g, '').trim() === txt[0]) {
		return new NW(watch[0][0], watch[0][1], function () {
			return SELF;
		});
	}

	var len = watch.length;

	args.s = fn.call(this);
	args.a = new Array(len);
	args.t = new Array(len);
	args.__path = '$link-' + linkNum;
	linkNum += 1;

	for (var i = 0; i < len; i++) {
		args.a[i] = watch[i][0][watch[i][1]];
		args.t[i] = '$rdi[' + i + ']';
		args.f = args.f.replace(txt[i], args.t[i]);
		// args.f = args.f.replace(new RegExp(txt[i], 'g'), args.t[i]);
		(function (path, args, p, i) {
			SELF.$e.on(path, (e, v) => {
				args.a[i] = v;
				var cache = args.f.call(SELF, args.a);

				if (args.s !== cache) {
					args.s = cache;
					SELF.$e.emit(p, args.s);
				}
			});
		})(watch[i][0].__path + '.' + watch[i][1], args, args.__path + '.s', i);
	}

	args.f = new Function('$rdi', 'return ' + args.f + '();');

	if (len <= 0) return args.s;
	return new NW(args, 's', function () {
		return SELF;
	});
};

const cond = exports.cond = function (a, e) {
	return new Condition(a, e, this);
};
var Condition = function Condition(a, e, SELF) {
	this.cases = [{ a: a, e: e }];
	this.w = [];
	this.cache = [];
	this.els = emptyNode.cloneNode();

	if (isWatchable(a)) {
		this.w.push(a);
	}

	this.watch = function (cb) {
		for (var w in this.w) {
			(function (w) {
				SELF.$e.on(this.w[w].path, e => {
					// console.log(this.w[w].path, this.cache[w] == v, this.cache[w], v)
					// if (this.cache[w] == v) return false;
					cb(this.w[w].get());
					// this.cache[w] = v;
				});
			}).call(this, w);
		}
	};

	this.__do = function () {
		var ret = { id: null };
		for (var c in this.cases) {
			var a = isWatchable(this.cases[c].a) ? this.cases[c].a.get() : this.cases[c].a;
			if (a) {
				ret.id = c;
				ret.r = this.cases[c].e;
				break;
			}
		}
		if (typeof ret.r === 'undefined') ret.r = this.els;
		return ret;
	};
};
Condition.prototype.elseif = function (a, e) {
	this.cases.push({ a: a, e: e });
	if (isWatchable(a)) {
		this.w.push(a);
	}
	return this;
};
Condition.prototype.cond = Condition.prototype.elseif;
Condition.prototype.else = function (e) {
	this.els = e;
	return this;
};

const l = exports.l = function (f) {
	return f;
};

const ll = exports.ll = function (f, w, c) {
	if (!w) {
		return f;
	} else {
		return link.call(this, f, w, c.split(','));
	}
};

const freeze = exports.freeze = () => {
	frozenState = true;
};
const unfreeze = exports.unfreeze = () => {
	frozenState = false;

	for (var ii = 0; ii < activeComponents.length; ii++) {
		if (typeof activeComponents[ii].onMount === 'function') {
			activeComponents[ii].onMount.call(activeComponents[ii]);
		}
	}
};

const pack = {
	activeComponents: activeComponents,
	r: r,
	l: l,
	cond: cond,
	component: component,
	mount: mount,
	freeze: freeze,
	unfreeze: unfreeze
};

window.$Radi = pack;

function use(plugin) {
	return plugin(pack);
}
},{}],19:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

/** @jsx r **/
var _require = require('../../../src/index.js'),
    r = _require.r,
    l = _require.l,
    component = _require.component,
    cond = _require.cond;

var state = {
  name: 'Marcis',
  newname: 'John'
};

var actions = {
  onMount: function onMount() {
    // Do something
  },
  rename: function rename(name) {
    this.name = name;
  }
};

var view = function view() {
  var _this = this;

  var name = l(this.name);

  return r(
    'div',
    null,
    r(
      'h2',
      null,
      l(name)
    ),
    r(
      'label',
      null,
      r(
        'strong',
        null,
        'New name:'
      ),
      r('input', { type: 'text', model: l(this.newname) })
    ),
    r(
      'button',
      { onclick: function onclick() {
          _this.rename(_this.newname);
        } },
      'Change'
    )
  );
};

exports.default = component({
  name: 'index',
  view: view,
  state: state,
  actions: actions
});
},{"../../../src/index.js":4}],20:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

/** @jsx r **/
var _require = require('../../../src/index.js'),
    r = _require.r,
    l = _require.l,
    component = _require.component,
    cond = _require.cond;

var view = function view() {
  var name = l(this.name);

  return r(
    'div',
    null,
    r(
      'h4',
      null,
      'This is FOO'
    )
  );
};

exports.default = component({
  name: 'foo',
  view: view
});
},{"../../../src/index.js":4}],15:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require('../pages/index.js');

var _index2 = _interopRequireDefault(_index);

var _foo = require('../pages/foo.js');

var _foo2 = _interopRequireDefault(_foo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  return {
    routes: {
      '/': _index2.default,
      '/foo': _foo2.default
    }
    // beforeEach(from, to) {
    //   console.log('beforeEach', arguments)
    //   if (from === '/foo') {
    //     return false
    //   } else {
    //     return true
    //   }
    // },
    // afterEach(from, to) {
    //   // After
    // },
  };
};
},{"../pages/index.js":19,"../pages/foo.js":20}],5:[function(require,module,exports) {
'use strict';

var _radiRouter = require('../../src/radi-router.js');

var _radiRouter2 = _interopRequireDefault(_radiRouter);

var _routes = require('./routes');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @jsx r **/
var _require = require('../../src/index.js'),
    r = _require.r,
    l = _require.l,
    component = _require.component,
    mount = _require.mount,
    use = _require.use;

var _router = use(_radiRouter2.default);

window.Router = _router((0, _routes2.default)());

var view = function view() {
  return r(
    'div',
    null,
    r(
      'a',
      { href: '#/' },
      'Index'
    ),
    r('br', null),
    r(
      'a',
      { href: '#/foo' },
      'Foo'
    ),
    r('br', null),
    r(
      'a',
      { href: '#/error' },
      'Error'
    ),
    r('br', null),
    r('br', null),
    new Router()
  );
};

var main = component({
  name: 'root',
  view: view
});

module.exports = main;
},{"../../src/radi-router.js":9,"./routes":15,"../../src/index.js":4}],3:[function(require,module,exports) {
'use strict';

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('../../src/index.js'),
    mount = _require.mount,
    r = _require.r;

var app = mount(new _app2.default(), 'app');

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(function () {
    // Before restarting the app, we create a new root element and dispose the old one
    app.destroy();
  });
}
},{"./app":5,"../../src/index.js":4}],21:[function(require,module,exports) {

var global = (1, eval)('this');
var OldModule = module.bundle.Module;
function Module() {
  OldModule.call(this);
  this.hot = {
    accept: function (fn) {
      this._acceptCallback = fn || function () {};
    },
    dispose: function (fn) {
      this._disposeCallback = fn;
    }
  };
}

module.bundle.Module = Module;

if (!module.bundle.parent && typeof WebSocket !== 'undefined') {
  var hostname = '' || location.hostname;
  var ws = new WebSocket('ws://' + hostname + ':' + '57183' + '/');
  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      data.assets.forEach(function (asset) {
        hmrApply(global.require, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.require, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + 'data.error.stack');
    }
  };
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(+k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  if (cached && cached.hot._disposeCallback) {
    cached.hot._disposeCallback();
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallback) {
    cached.hot._acceptCallback();
    return true;
  }

  return getParents(global.require, id).some(function (id) {
    return hmrAccept(global.require, id);
  });
}
},{}]},{},[21,3])
//# sourceMappingURL=/dist/f470e32213ff6bdea0639fe4f134c72b.map