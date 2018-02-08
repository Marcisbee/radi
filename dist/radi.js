(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.radi = {})));
}(this, (function (exports) { 'use strict';

const version = '0.1.0';

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

var isArray = function (o) { return Array.isArray(o) === true };

function clone(obj) {
	var i, ret;
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
					if (typeof(obj[i] === "object")) {
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
}

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
}

if (!Array.isArray) {
	Array.isArray = function(arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	};
}

var arrayMods = function (v, s) {
	if (v.__radi) return false
	return Object.defineProperties(v, {
		__radi: { value: true },
		reverse: { value: s.bind('reverse') },
		push: { value: s.bind('push') },
		splice: { value: s.bind('splice') },
		pop: { value: s.bind('pop') },
		shift: { value: s.bind('shift') }
	})
};

var ids = 0;
const activeComponents = [];

var Radi = function(o) {
	var SELF = {
		$state: {},
		__path: 'this'
	};

	function addpath(target, path) {
		if (typeof target.__path === 'undefined') Object.defineProperty(target, '__path', { value: path });
	}

	function addwatch(target, prop) {
		if (!Object.getOwnPropertyDescriptor(target, prop).set) watcher(target, prop);
	}

	function apply(target, object) {
		if (typeof target !== 'object' || !target) return object;
		var path = target.__path;

		for (var i in object) {
			if (typeof object[i] === 'object') {
				if (typeof target[i] === 'undefined') {
					target[i] = (isArray(object[i])) ? [] : {};
					addpath(target[i], path.concat('.').concat(i));
				}
				apply(target[i], object[i]);
				// console.log('APPLY 1', path.concat('.').concat(i), target[i])
				// SELF.$e.emit(path.concat('.').concat(i), target[i]);
			} else {
				// var c = (target[i] === object[i]);
				target[i] = object[i];
				// if (c) SELF.$e.emit(path.concat('.').concat(i), target[i]);
			}
			addwatch(target, i);
		}
	}

	// function populate(to, path) {
	// 	if (typeof to !== 'object' || !to
	// 		|| /^this\.\$(?:parent|view|props|actions|state|link|e|html)$/.test(path)) return false;
	//   var ret = (typeof to.__path === 'undefined') ? Object.defineProperty(to, '__path', { value: path }) : false;
	//   for (var ii in to) {
	//     if (!Object.getOwnPropertyDescriptor(to, ii).set) {
	//       if (typeof to[ii] === 'object') populate(to[ii], path + '.' + ii)
	//       // Initiate watcher if not already watched
	//       watcher(to, ii)
	//       // Trigger changes for this path
	// 			SELF.$e.emit(path + '.' + ii, to[ii])
	//     }
	//   }
	// 	return ret
	// }
	//

	SELF.$e = {
		WATCH: {},
		get(path) {
			return SELF.$e.WATCH[path] || (SELF.$e.WATCH[path] = [])
		},
		on(path, fn) {
			return SELF.$e.get(path).push(fn)
		},
		emit(path, r) {
			var list = SELF.$e.get(path), len = list.length;
			for (var i = 0; i < len; i++) {
				list[i](path, r);
			}
		}
	};

	function watcher(targ, prop, handler) {
	  var oldval = targ[prop],
	    path = targ.__path + '.' + prop,
	    setter = function (newval) {
	      if (oldval !== newval) {
	        if (Array.isArray(oldval)) {
						var ret;
	          if (this && this.constructor === String) {
							var newval = clone(oldval);
							ret = Array.prototype[this].apply(newval, arguments);
						}

						var l1 = oldval.length;
						var l2 = newval.length;
						var diff = l2 - l1;

						if (diff < 0) {
							for (var i = l1; i > l1 + diff; i--) {
								delete oldval[(i-1)];
							}
						}
						oldval.length = l2;
						apply(oldval, newval);

						// populate(oldval, path);
						SELF.$e.emit(path, oldval);
						return ret;
	        } else if (typeof newval === 'object') {
						// oldval = clone(newval)
						// for (var i in newval) {
							apply(oldval, newval);
						// }
						// populate(oldval, path);
						SELF.$e.emit(path, oldval);
	        } else {
	          oldval = newval;
						// populate(oldval, path);
						SELF.$e.emit(path, oldval);
	        }
	        return newval
	      } else {
	        return false
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
		if (typeof SELF.$state[i] === 'undefined') {
			SELF.$state[i] = o.state[i];
		} else {
			throw new Error('[Radi.js] Err: Trying to write state for reserved variable `' + i + '`');
		}
	}

	for (var i in o.props) {
		if (typeof SELF.$state[i] === 'undefined') {
			if (isWatchable(o.props[i])) {
				SELF.$state[i] = o.props[i].get();

				if (o.props[i].parent) {
					o.props[i].parent().$e.on(o.props[i].path, (e, a) => {
						SELF.$state[i] = a;
					});
				}
			} else {
				SELF.$state[i] = o.props[i];
			}
		} else {
			throw new Error('[Radi.js] Err: Trying to write prop for reserved variable `' + i + '`');
		}
	}

	// var __slice = [].slice
	// SELF.$e = {
	// 	subscriptions: [],
	// 	on(matcher, cbk) {
	// 		var _base, _ref, _ref1, _ref2;
	//
	// 		if ((_ref1 = this.subscriptions) == null) {
	// 			this.subscriptions = {};
	// 		}
	// 		if ((_ref2 = (_base = this.subscriptions)[matcher]) == null) {
	// 			_base[matcher] = [];
	// 		}
	// 		this.subscriptions[matcher].push(cbk);
	//
	// 		return this;
	// 	},
	// 	listeners(evt) {
	// 		var callbacks, key, subscription, _ref, _ref1;
	//
	// 		if ((_ref = this.subscriptions) == null) {
	// 			this.subscriptions = {};
	// 		}
	// 		callbacks = this.subscriptions[evt] || [];
	// 		_ref1 = this.regexpSubscriptions;
	// 		for (key in _ref1) {
	// 			subscription = _ref1[key];
	// 			if (subscription.regexp.test(evt)) {
	// 				callbacks = callbacks.concat(subscription.callbacks);
	// 			}
	// 		}
	// 		return callbacks;
	// 	},
	// 	emit() {
	// 		var args, cbk, evt, _i, _len, _ref;
	//
	// 		evt = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
	// 		_ref = this.listeners(evt);
	// 		for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	// 			cbk = _ref[_i];
	// 			cbk.call.apply(cbk, [this, evt].concat(__slice.call(args)));
	// 		}
	// 		return this;
	// 	},
	// 	off(matcher, cbk) {
	// 		var c, cbks, i, _i, _len, _ref;
	//
	// 		if (matcher == null) {
	// 			this.subscriptions = {};
	// 			this.regexpSubscriptions = {};
	// 		} else {
	// 			if (cbk == null) {
	// 				if ((_ref = this.subscriptions) != null) {
	// 					delete _ref[matcher];
	// 				}
	// 			} else {
	// 				cbks = this.subscriptions[matcher] || [];
	// 				for (i = _i = 0, _len = cbks.length; _i < _len; i = ++_i) {
	// 					c = cbks[i];
	// 					if (c === cbk) {
	// 						cbks.splice(i, 1);
	// 					}
	// 				}
	// 			}
	// 		}
	// 		return this;
	// 	}
	// }

	apply(SELF, SELF.$state);

	// populate(SELF, 'this');

	for (var i in o.actions) {
		if (typeof SELF[i] === 'undefined') {
			SELF[i] = (function() {
				if (frozenState) return null
				return o.actions[this].apply(SELF, arguments);
				// populateOne(SELF, 'this');
				// triggerChanges(old, SELF, 'this')
				// return b
			}).bind(i);

			// (function(i) {
			// 	Object.defineProperty(SELF[i], 'props', {
			// 		value() {
			// 			var args = arguments;
			// 			return function () { return (frozenState) ? function () {} : SELF[i].apply(SELF, args, arguments) }
			// 		}
			// 	});
			// })(i)
		} else {
			throw new Error('[Radi.js] Error: Trying to write action for reserved variable `' + i + '`');
		}
	}

	SELF.$id = ids++;
	SELF.$name = o.name;
	SELF.$state = o.state || {};
	SELF.$props = o.props || {};
	SELF.$actions = o.actions || {};
	SELF.$html = document.createDocumentFragment();
	SELF.$parent = null;

	SELF.$view = new Function('r','list','ll','cond','return ' + o.$view)(
		r.bind(SELF), list.bind(SELF), ll.bind(SELF), cond.bind(SELF)
	);

	SELF.$link = SELF.$view();
	SELF.$html.appendChild(SELF.$link);

	SELF.$render = function() {
		SELF.mount();
		return SELF.$html
	};

	// SELF.$html.destroy = function () {
	// 	const oldRootElem = SELF.$link.parentElement;
	// 	const newRootElem = oldRootElem.cloneNode(false);
	// 	oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
	// 	SELF.unmount();
	// 	oldRootElem.parentNode.removeChild(oldRootElem);
	// }

	SELF.mount = function () {
		// console.log('MOUNT', SELF.$name)
		if (typeof SELF.$actions.onMount === 'function') {
			SELF.$actions.onMount.call(SELF);
		}
		activeComponents.push(SELF);
	};

	SELF.unmount = function () {
		// console.log('UNMOUNT', SELF.$name)
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

	return SELF
};

var radiMutate = function (c) {
	// // window.requestAnimationFrame(() => {
	// 	// window.requestAnimationFrame(() => {
			c();
	// 	// });
	// // });
};

var setStyle = function (view, arg1, arg2) {
	var self = this;
	var el = getEl(view);

	if (isWatchable(arg2)) {
		var cache = arg2.get();
		el.style[arg1] = cache;

		// Update bind
		(function(cache, arg1, arg2){
			self.$e.on(arg2.path, function(e, v) {
				if (v === cache) return false
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

var setAttr = function (view, arg1, arg2) {
	var self = this;
	var el = getEl(view);

	if (arg2 !== undefined) {
		if (arg1 === 'style') {
			setStyle.call(this, el, arg2);
		} else if (arg1 === 'model' && isWatchable(arg2)) {
			var cache = arg2.get();
			el.value = cache;
			el['oninput'] = function () { arg2.source[arg2.prop] = cache = el.value; self.$e.emit(arg2.path, el.value); };
			// Update bind
			(function(cache, arg1, arg2){
				self.$e.on(arg2.path, function(e, v) {
					if (v === cache) return false
					radiMutate(() => {
						el.value = v;
					});
					cache = v;
				});
			})(cache, arg1, arg2);
		} else if (isFunction(arg2)) {
			el[arg1] = function (e) { arg2.call(self, e); };
		} else if (isWatchable(arg2)) {
			var temp = arg2.get();
			if (isFunction(temp)) {
				el[arg1] = function (e) { arg2.get().call(self, e); };
			} else {
				var cache = arg2.get();
				let z = el.setAttribute(arg1, cache);

				// Update bind
				(function(cache, arg1, arg2){
					self.$e.on(arg2.path, function(e, v) {
						if (v === cache) return false
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

var getEl = function (parent) { return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el); };

var isString = function (a) { return typeof a === 'string'; };
var isNumber = function (a) { return typeof a === 'number'; };
var isFunction = function (a) { return typeof a === 'function'; };

var isNode = function (a) { return a && a.nodeType; };
var isWatchable = function (a) { return a && a instanceof NW; };
var isCondition = function (a) { return a && a instanceof Condition; };
var isComponent = function (a) { return a && a.__radi; };

const text = function (str) { return document.createTextNode(str); };

var radiArgs = function (element, args) {
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
			var arg2 = arg.__do(), a, id = arg2.id;
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
			(function(arg){
				arg.watch(function(v) {
					var arg2 = arg.__do(), b;
					if (id === arg2.id) return false
					if (isComponent(arg2.r)) {
						b = arg2.r.__radi().$render();
					} else if (typeof arg2.r === 'function') {
						b = arg2.r();
					} else if (isString(arg2.r) || isNumber(arg2.r)) {
						b = text(arg2.r);
					} else {
						b = arg2.r;
					}
					// unmountAll(a)
					a.parentNode.replaceChild(b, a);
					a = b;
					// mountAll(a)
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
			(function(cache, arg){
				self.$e.on(arg.path, function(e, v) {
					if (v === cache) return false
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
};

var htmlCache = {};

var memoizeHTML = function (query) { return htmlCache[query] || (htmlCache[query] = createElement(query)); };

const r = function (query) {
	var args = [], len = arguments.length - 1;
	while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

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
	var args = [], len = arguments.length - 1;
	while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

	var clone = memoizeHTML(query);

	return r.bind.apply(r, [ this, clone ].concat( args ));
};

const component = function (o) {
	var fn = o.view.toString().replace(STRIP_COMMENTS, '');
	var match = FIND_L.exec(fn);
	// var output = [];
	var output = '';
	var cursor = 0;

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
			} else
			if (char === RR) {
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

		// output.push(fn.substr(cursor, n - cursor));
		output = output.concat(fn.substr(cursor, n - cursor));
		// output.push(newString);
		output = output.concat(newString);
		cursor = n + found.length;

		match = FIND_L.exec(fn);
	}
	// output.push(fn.substr(cursor, fn.length - cursor));
	output = output.concat(fn.substr(cursor, fn.length - cursor));
	// o.$view = output.join('');
	o.$view = output;

	return Component.bind(this, o);
};
var Component = function Component (o) {
	this.o = {
		name: o.name,
		state: clone(o.state),
		props: clone(o.props),
		actions: o.actions,
		view: o.view,
		$view: o.$view,
	};

	this.__radi = function() { return new Radi(this.o); };
};
Component.prototype.props = function props (p) {
	for (var k in p) {
		if (typeof this.o.props[k] === 'undefined') {
			console.warn('[Radi.js] Warn: Creating a prop `', k, '` that is not defined in component');
		}
		this.o.props[k] = p[k];
	}
	return this;
};

const mount = function (comp, id) {
	const where = (id.constructor === String) ? document.getElementById(id) : id;
	var out = (comp instanceof Component) ? comp.__radi().$render() : comp;
	where.appendChild(out);
	return out;
};

var emptyNode = text('');

const list = function (data, act) {
	if (!data) return '';
	var SELF = this;

	var link, fragment = document.createDocumentFragment(), toplink = emptyNode.cloneNode();

	fragment.appendChild(toplink);

	var cache = data.source[data.prop];

	if (isArray(cache)) {
		for (var i = 0; i < cache.length; i++) {
			fragment.appendChild(
				act.call(SELF, cache[i], i)
			);
		}
	} else {
		var i = 0;
		for (var key in cache) {
			fragment.appendChild(
				act.call(SELF, cache[key], key, i)
			);
			i++;
		}
	}

	link = fragment.lastChild;

	var w = function(a, b) {
		if (a > 0) {
			var len = b.length;
			var start = len - a;
			for (var i = start; i < len; i++) {
				fragment.appendChild(
					act.call(SELF, data.source[data.prop][i], i)
				);
			}
			var temp = fragment.lastChild;
			link.parentElement.insertBefore(fragment, link.nextSibling);
			link = temp;
		} else
		if (a < 0) {
			for (var i = 0; i < Math.abs(a); i++) {
				var templink = link.previousSibling;
				link.parentElement.removeChild(link);
				link = templink;
			}
		}
	};

	if (data.path) {
		var len = cache.length;
		SELF.$e.on(data.path, function(e, v) {
			w(v.length - len, v);
			len = v.length;
		});
	}

	return fragment;
};


function NW(source, prop, path, parent) {
  this.path = ((path) ? path : source.__path) + '.' + prop;
  this.get = () => (source[prop]);
  this.source = source;
  this.prop = prop;
  this.parent = () => (parent);
}

var linkNum = 0;

const link = function (fn, watch, txt) {
	var args = {}, SELF = this;

	if (txt.length === 1 && fn.toString()
				.replace(/(function \(\)\{ return |\(|\)|\; \})/g, '')
				.trim() === txt[0]) {
		return new NW(watch[0][0], watch[0][1])
	}

	var len = watch.length;

	args.s = fn.call(SELF);
	args.__path = '$link-' + (linkNum++);

	for (var i = 0; i < len; i++) {
		(function(path, args, p, i) {
			SELF.$e.on(path, (e) => {
				var cache = fn.call(SELF);

				if (args.s !== cache) {
					args.s = cache;
					SELF.$e.emit(p, args.s);
				}
			});
		})(watch[i][0].__path + '.' + watch[i][1], args, args.__path.concat('.s'), i);
	}

	if (len <= 0) return args.s;
	return new NW(args, 's', null, this);
};

// export const link = function (fn, watch, txt) {
// 	var args = {s: null,a: [],t: [],f: fn.toString()}, SELF = this;
//
// 	if (txt.length === 1 && fn.toString()
// 				.replace(/(function \(\)\{ return |\(|\)|\; \})/g, '')
// 				.trim() === txt[0]) {
// 		return new NW(watch[0][0], watch[0][1], null, this)
// 	}
//
// 	var len = watch.length
//
// 	args.s = fn.call(this);
// 	args.a = new Array(len);
// 	args.t = new Array(len);
// 	args.__path = '$link-' + linkNum;
// 	linkNum += 1;
//
// 	for (var i = 0; i < len; i++) {
// 		args.a[i] = watch[i][0][watch[i][1]];
// 		args.t[i] = '$rdi[' + i + ']';
// 		args.f = args.f.replace(txt[i], args.t[i]);
// 		// args.f = args.f.replace(new RegExp(txt[i], 'g'), args.t[i]);
// 		(function(path, args, p, i) {
// 			SELF.$e.on(path, (e, v) => {
// 				args.a[i] = v;
// 				var cache = args.f.call(SELF, args.a)
//
// 				if (args.s !== cache) {
// 					args.s = cache;
// 					SELF.$e.emit(p, args.s);
// 				}
// 			});
// 		})(watch[i][0].__path + '.' + watch[i][1], args, args.__path + '.s', i)
// 	}
//
// 	args.f = new Function('$rdi', 'return ' + args.f + '();')
//
// 	if (len <= 0) return args.s;
// 	return new NW(args, 's', args.__path, this);
// }

const cond = function (a, e) {
	return new Condition(a, e, this)
};
var Condition = function Condition (a, e, SELF) {
	this.cases = [{a:a,e:e}];
	this.w = [];
	this.cache = [];
	this.els = emptyNode.cloneNode();

	if (isWatchable(a)) { this.w.push(a); }

	this.watch = function(cb) {
		// console.log('LOAD WATCH', this.w);
		for (var w in this.w) {
			// this.cache[w] = this.w[w].get();
			(function(w) {
				SELF.$e.on(this.w[w].path, (e) => {
					// console.log(this.w[w].path, this.cache[w] == v, this.cache[w], v)
					// if (this.cache[w] == v) return false;
					cb(this.w[w].get());
					// this.cache[w] = v;
				});
			}).call(this,w);
		}
	};

	this.__do = function() {
		var ret = {id: null};
		for (var c in this.cases) {
			var a = isWatchable(this.cases[c].a) ? this.cases[c].a.get() : this.cases[c].a;
			if (a) {
				ret.id = c;
				ret.r = this.cases[c].e;
				break
			}
		}
		if (typeof ret.r === 'undefined') ret.r = this.els;
		return ret
	};
};
Condition.prototype.elseif = function (a, e) {
	this.cases.push({a:a,e:e});
	if (isWatchable(a)) { this.w.push(a); }
	return this
};
Condition.prototype.cond = Condition.prototype.elseif;
Condition.prototype.else = function (e) {
	this.els = e;
	return this
};

const l = function (f) {
	return f
};

const ll = function (f, w, c) {
	if (!w) {
		return f
	} else {
		return link.call(this, f, w, c.split(','))
	}
};

const freeze = () => { frozenState = true; };
const unfreeze = () => {
	frozenState = false;

	for (var ii = 0; ii < activeComponents.length; ii++) {
		if (typeof activeComponents[ii].onMount === 'function') {
			activeComponents[ii].onMount.call(activeComponents[ii]);
		}
	}
};

exports.version = version;
exports.activeComponents = activeComponents;
exports.text = text;
exports.r = r;
exports.component = component;
exports.mount = mount;
exports.list = list;
exports.link = link;
exports.cond = cond;
exports.l = l;
exports.ll = ll;
exports.freeze = freeze;
exports.unfreeze = unfreeze;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=radi.js.map
