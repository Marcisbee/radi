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
})({7:[function(require,module,exports) {

},{}],11:[function(require,module,exports) {
module.exports="d653c99fc740e22d8790593a747f1dc1.png";
},{}],12:[function(require,module,exports) {
module.exports="65f214ae46025a42c68a85595f538e46.svg";
},{}],10:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.r = r;
exports.component = component;
exports.cond = cond;
exports.l = l;
exports.ll = ll;
exports.freeze = freeze;
exports.unfreeze = unfreeze;
exports.use = use;
const version = exports.version = '0.1.2';

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

	Object.defineProperties(SELF, {
		$e: {
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
		}
	});

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

	Object.defineProperties(SELF, {
		$link: {
			enumerable: false,
			value: SELF.$view()
		}
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
				if (cache !== false) if (arg1 === 'html') {
					el.innerHTML = cache;
				} else {
					el.setAttribute(arg1, cache);
				}

				// Update bind
				(function (cache, arg1, arg2) {
					self.$e.on(arg2.path, function (e, v) {
						if (v === cache) return false;
						radiMutate(() => {
							if (v !== false) {
								if (arg1 === 'html') {
									el.innerHTML = v;
								} else {
									el.setAttribute(arg1, v);
								}
							} else {
								el.removeAttribute(arg1);
							}
						});
						cache = v;
					});
				})(cache, arg1, arg2);
			}
		} else {
			if (cache !== false) if (arg1 === 'html') {
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
	var cache = data.source[data.prop] || [];
	var cacheLen = cache.length || 0;

	if (isArray(cache)) {
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
		var len = cacheLen;
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

	this.watch = function (cb) {
		for (var w in this.w) {
			(function (w) {
				SELF.$e.on(this.w[w].path, (e, v) => {
					cb(v);
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
}
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

function l(f) {
	return f;
}

function ll(f, w, c) {
	if (!w) {
		return f;
	} else {
		return link.call(this, f, w, c.split(','));
	}
}

function freeze() {
	frozenState = true;
}
function unfreeze() {
	frozenState = false;

	for (var ii = 0; ii < activeComponents.length; ii++) {
		if (typeof activeComponents[ii].onMount === 'function') {
			activeComponents[ii].onMount.call(activeComponents[ii]);
		}
	}
}

const pack = {
	version: version,
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
},{}],16:[function(require,module,exports) {
var global = (1,eval)("this");
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {
'use strict';

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3] || ''
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer
          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ <>]+(@|:\/)[^ <>]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^<'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)([\s\S]*?[^`])\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|\\[\[\]]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = escape(
          cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1])
        );
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? this.options.sanitizer
          ? this.options.sanitizer(cap[0])
          : escape(cap[0])
        : cap[0]
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2].trim(), true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.text(escape(this.smartypants(cap[0])));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  if (!this.options.mangle) return text;
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return text;
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
      return text;
    }
  }
  if (this.options.baseUrl && !originIndependentUrl.test(href)) {
    href = resolveUrl(this.options.baseUrl, href);
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  if (this.options.baseUrl && !originIndependentUrl.test(href)) {
    href = resolveUrl(this.options.baseUrl, href);
  }
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

Renderer.prototype.text = function(text) {
  return text;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
	// explicitly match decimal, hex, and named HTML entities
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function resolveUrl(base, href) {
  if (!baseUrls[' ' + base]) {
    // we can ignore everything in base after the last slash of its path component,
    // but we might need to add _that_
    // https://tools.ietf.org/html/rfc3986#section-3
    if (/^[^:]+:\/*[^/]*$/.test(base)) {
      baseUrls[' ' + base] = base + '/';
    } else {
      baseUrls[' ' + base] = base.replace(/[^/]*$/, '');
    }
  }
  base = baseUrls[' ' + base];

  if (href.slice(0, 2) === '//') {
    return base.replace(/:[\s\S]*/, ':') + href;
  } else if (href.charAt(0) === '/') {
    return base.replace(/(:\/*[^/]*)[\s\S]*/, '$1') + href;
  } else {
    return base + href;
  }
}
var baseUrls = {};
var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occurred:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  sanitizer: null,
  mangle: true,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false,
  baseUrl: null
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

},{}],6:[function(require,module,exports) {
'use strict';

var _smallWhite = require('./assets/img/small-white.png');

var _smallWhite2 = _interopRequireDefault(_smallWhite);

var _github = require('./assets/svg/github.svg');

var _github2 = _interopRequireDefault(_github);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @jsx r **/
var _require = require('radi'),
    r = _require.r,
    l = _require.l,
    component = _require.component,
    mount = _require.mount,
    use = _require.use;

var marked = require('marked');
// import router from '../radi-router'
// import routes from './routes'


// window.RoutedContent = use(router)(routes())

var view = function view() {
  return r(
    'div',
    null,
    r(
      'div',
      { id: 'header' },
      r(
        'div',
        { 'class': 'wrapper' },
        r(
          'a',
          { href: '/' },
          r('img', { src: this.logo, height: '25', alt: 'Radi.js' })
        ),
        r(
          'div',
          { id: 'nav' },
          r(
            'a',
            { href: '#installation' },
            'Docs'
          ),
          r(
            'a',
            { href: this.slack, target: '_blank' },
            'Slack'
          ),
          r(
            'a',
            { href: this.githubLink, target: '_blank' },
            'GitHub'
          )
        )
      )
    ),
    r(
      'div',
      { id: 'hero' },
      r(
        'div',
        { 'class': 'wrapper' },
        r(
          'h1',
          null,
          'Fastest front-end framework.'
        ),
        r(
          'p',
          null,
          'Radi is a tiny (3kB minified & gzipped) javascript framework.'
        ),
        r(
          'p',
          null,
          'It\u2019s built quite differently from any other framework. It doesn\u2019t use any kind of diffing algorithm nor virtual dom which makes it really fast.'
        ),
        r(
          'a',
          { href: this.githubLink, target: '_blank', 'class': 'btn btn-white' },
          r('img', { src: this.github, alt: '' }),
          'Star on GitHub',
          cond(l(this.stars), r(
            'i',
            null,
            l(this.stars)
          ))
        ),
        r(
          'a',
          { href: '#installation', 'class': 'btn btn-green' },
          'Get started'
        )
      )
    ),
    r(
      'div',
      { id: 'main' },
      r('div', { 'class': 'wrapper markdown-body', html: l(this.md) })
    )
  );
};

var main = component({
  name: 'root',
  view: view,
  state: {
    githubLink: 'https://github.com/radi-js/radi',
    slack: 'https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ',
    logo: _smallWhite2.default,
    github: _github2.default,
    stars: null,
    md: 'Loading..'
  },
  actions: {
    onMount: function onMount() {
      var self = this;

      // Fetch github stars
      fetch('https://api.github.com/repos/radi-js/radi').then(function (response) {
        if (response.status !== 200) return;

        response.json().then(function (data) {
          self.stars = data.stargazers_count;
        });
      });

      // Fetch readme content
      fetch('https://api.github.com/repos/radi-js/radi/contents/README.md').then(function (response) {
        if (response.status !== 200) return;

        response.json().then(function (data) {
          self.md = marked('## Installation'.concat(atob(data.content).split('## Installation')[1]));
        });
      });
    }
  }
});

module.exports = main;
},{"./assets/img/small-white.png":11,"./assets/svg/github.svg":12,"radi":10,"marked":16}],4:[function(require,module,exports) {
'use strict';

require('./assets/stylus/main.styl');

var _app = require('./app.js');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('radi'),
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
},{"./assets/stylus/main.styl":7,"./app.js":6,"radi":10}]},{},[4])