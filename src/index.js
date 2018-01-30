export const version = '0.0.2';

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

var _op = Object.prototype,
isObject = function (o) { return o && o.__proto__ === _op },
isArray = function (o) { return Array.isArray(o) === true }

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

Object.defineProperties(Object, {
	relocate: {
		configurable: true,
		enumerable: false,
		value: function relocate(what, wit) {
			for (var key in wit) {
				const end = wit[key]
				var change = false
				if (end && typeof end === 'object' && !(end instanceof Radi)) {
					if (typeof what[key] === 'undefined') what[key] = end.constructor()
					Object.relocate(what[key], end)
					change = true
				} else {
					if (what[key] !== end) {
						change = true
						what[key] = end
					}
				}
				if (change) populateOne(what, key)
			}
		},
		writable: true
	}
});

var arrayProxy = function arrayProxy() {
	var l1 = this[0].length,
			arr = clone(this[0]),
			// arr = this[0],
			ret = Array.prototype[this[1]].apply(arr, arguments),
			l2 = arr.length,
			diff = l2 - l1

	this[0].length = l2

	if (diff < 0) {
		for (var i = l1; i > l1 + diff; i--) {
			delete this[0][(i-1)+'__ob__']
			delete this[0][(i-1)]
		}
	}

	Object.relocate(this[0], arr)

	if (diff !== 0) {
		this[0]._r_set(diff, this[0])
	}

	return ret
}

var arrayRules = function arrayRules(item, def) {
	// TODO: Creaete _r_set loop with array of bucket
	// var bucket = []
	var bucket = () => {},
		a = (v) => ({ value: function () { return arrayProxy.apply([this, v], arguments) } })
	def._r_set = { value: function (v) { if (frozenState) return false; bucket(v, item) } }
	def._r_get = { value: function (cb) { bucket = cb } }
	def.push = a('push')
	def.pop = a('pop')
	def.splice = a('splice')
	def.shift = a('shift')
	def.unshift = a('unshift')
	def.reverse = a('reverse')
}

var populateOne = function populateOne(item, ii) {
	if (typeof item[ii + '__ob__'] !== 'undefined') return false

	var def = { __r: { value: true } }

	// If input is an Array
	if (isArray(item) && typeof item.__r === 'undefined' && !item.__r) {
		arrayRules(item, def)
	}

	def[ii + '__ob__'] = { value: watchable(item, ii), configurable: true }

	if (typeof item[ii] === 'object') populate(item[ii])

	return Object.defineProperties(item, def)
}

// Add watchers to every object and array
var populate = function populate(item) {
	if (item && typeof item === 'object') {
		var def = { __r: { value: true } }

		// If input is an Array
		if (isArray(item)) {
			if (typeof item.__r === 'undefined' && !item.__r) {
				arrayRules(item, def)
			}

			for (var ii in item) {
				// Add watchable
				// Should not be able to reconfigure this
				if (typeof item[ii + '__ob__'] === 'undefined') {
					def[ii + '__ob__'] = { value: watchable(item, ii), configurable: true }
					populate(item[ii])
				}
			}

		} else
		// If input is an Object
		if (isObject(item)) {

			for (var ii in item) {
				// Add watchable
				// Should not be able to reconfigure this
				if (typeof item[ii + '__ob__'] === 'undefined') {
					def[ii + '__ob__'] = { value: watchable(item, ii), configurable: true }
					populate(item[ii])
				}
			}

		}

		return Object.defineProperties(item, def)
	} else { return false }
}

var watchable = function (data, prop) { return new Watchable(data, prop) }

var Watchable = function Watchable (data, prop) {
	var temp = data;

	this.watch = function watch (c) {
		watcher(temp, prop, (p, prev, next) => {
			c(next, prev)
			return next
		})
	}

	this.prop = prop
	this.data = function data () {
		return temp
	}

	this.get = function get () {
		return temp[prop]
	}
}

var dsc = Object.getOwnPropertyDescriptor
var watcher = function watcher(targ, prop, handler) {
	var oldval = targ[prop],
		prev = (typeof dsc(targ, prop) !== 'undefined') ? dsc(targ, prop).set : null,
		setter = function (newval) {
			if (frozenState) return false
			if (oldval !== newval) {
				if (isObject(newval)) {

					Object.relocate(oldval, newval)
				} else
				if (isArray(newval)) {
					var diff = newval.length - oldval.length
					oldval.length = newval.length

					Object.relocate(oldval, newval)
					newval = diff
				} else {
					oldval = newval
				}
				if (typeof prev === 'function') prev(newval)
				handler.call(targ, prop, oldval, newval)
			} else {
				return false
			}
		}

	if (delete targ[prop]) {
		Object.defineProperty(targ, prop, {
			get: function () {
				return oldval;
			},
			set: setter,
			enumerable: true,
			configurable: true
		})
	}
}


var parseQuery = function (query) {
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

var createElement = function (query, ns) {
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

if (!Array.isArray) {
	Array.isArray = function(arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	};
}


var ids = 0;
export const activeComponents = [];

class Radi {
	constructor(o) {
		var state = o.state || {},
			props = o.props || {},
			actions = o.actions || {},
			view = o.view;

		this.$id = ids++;

		this.$this = {};
		var SELF = this.$this;

		for (var k in state) {
			if (typeof SELF[k] === 'undefined') {
				SELF[k] = state[k];
			} else {
				throw new Error('[Radi.js] Err: Trying to write state for reserved variable `' + k + '`');
			}
		}

		for (var k in props) {
			if (typeof SELF[k] === 'undefined') {
				if (isWatchable(props[k])) {
					SELF[k] = props[k].get();
					props[k].watch(function (a) {
						SELF[k] = a;
					});
				} else {
					SELF[k] = props[k];
				}
			} else {
				throw new Error('[Radi.js] Err: Trying to write prop for reserved variable `' + k + '`');
			}
		}

		populate(SELF);
		var data = SELF;

		for (var k in actions) {
			if (typeof SELF[k] === 'undefined') {
				const act = actions[k];
				SELF[k] = function () { return (frozenState) ? function () {} : act.apply(SELF, arguments) };

				(function(SELF, k) {
					Object.defineProperty(SELF[k], 'props', {
						value() {
							var args = arguments;
							return function () { return (frozenState) ? function () {} : SELF[k].apply(SELF, args, arguments) }
						}
					});
				})(SELF, k)
			} else {
				throw new Error('[Radi.js] Error: Trying to write action for reserved variable `' + k + '`');
			}
		}

		SELF.$id = this.$id;
		SELF.$name = o.name;
		SELF.$state = state;
		SELF.$props = props;
		SELF.$actions = actions;
		// SELF.$data = data;

		this.$html = document.createDocumentFragment();

		this.$view = new Function(
			'r',
			'list',
			'l',
			'cond',
			// 'return ' + output
			'return ' + o.$view
		)(
			r.bind(SELF),
			list.bind(SELF),
			l.bind(SELF),
			cond.bind(SELF)
		);

		// console.log(this.$view);

		this.$link = this.$view.apply(SELF);

		if (this.$link instanceof Component || Array.isArray(this.$link)) {
			this.$link = r.call(SELF, null, this.$link);
		}
		this.$html.appendChild(this.$link);

		this.$html.destroy = (function () {
			const oldRootElem = this.$link.parentElement;
			const newRootElem = oldRootElem.cloneNode(false);
			oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
			this.unmount();
			oldRootElem.parentNode.removeChild(oldRootElem);
		}).bind(this);

		this.mount = function () {
			if (typeof actions.onMount === 'function') {
				actions.onMount.call(SELF)
			}
			activeComponents.push(this);
		};

		this.unmount = function () {
			if (typeof actions.onDestroy === 'function') {
				actions.onDestroy.call(SELF)
			}
			for (var i = 0; i < activeComponents.length; i++) {
				if (activeComponents[i].$id === this.$id) {
					activeComponents.splice(i, 1);
					break;
				}
			}
			return this.$link;
		};
	}

	get remount() {
		this.mount();
		return this.link;
	}

	get out() {
		this.mount();
		return this.$html;
	}
}

var radiMutate = function (c) {
	// window.requestAnimationFrame(() => {
		// window.requestAnimationFrame(() => {
			c();
		// });
	// });
}

var setStyle = function (view, arg1, arg2) {
	var el = getEl(view);

	if (isWatchable(arg2)) {
		el.style[arg1] = arg2.get();
		// Update bind
		arg2.watch((a) => {
			radiMutate(() => {
				el.style[arg1] = a;
			});
		});
	} else if (arg2 !== undefined) {
		el.style[arg1] = arg2;
	} else if (isString(arg1)) {
		el.setAttribute('style', arg1);
	} else {
		for (var key in arg1) {
			setStyle(el, key, arg1[key]);
		}
	}
};

var setAttr = function (view, arg1, arg2) {
	var self = this;
	var el = getEl(view);

	if (arg2 !== undefined) {
		if (arg1 === 'style') {
			setStyle(el, arg2);
		} else if (arg1 === 'model' && isWatchable(arg2)) {
			el.value = arg2.get();
			el['oninput'] = function () { arg2.data()[arg2.prop] = el.value };
			arg2.watch(function (a) {
				radiMutate(() => {
					el.value = a;
				});
			});
		} else if (isFunction(arg2)) {
			el[arg1] = function (e) { arg2.call(self, e); };
		} else if (isWatchable(arg2)) {
			el.setAttribute(arg1, arg2.get());
			// Update bind
			arg2.watch(function (a) {
				radiMutate(() => {
					el.setAttribute(arg1, a);
				});
			});
		} else {
			el.setAttribute(arg1, arg2);
		}
	} else {
		for (var key in arg1) {
			setAttr.call(this, el, key, arg1[key]);
		}
	}
};

var ensureEl = function (parent) { return isString(parent) ? html(parent) : getEl(parent); };
var getEl = function (parent) { return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el); };

var isString = function (a) { return typeof a === 'string'; };
var isNumber = function (a) { return typeof a === 'number'; };
var isFunction = function (a) { return typeof a === 'function'; };

var isNode = function (a) { return a && a.nodeType; };
var isWatchable = function (a) { return a && a instanceof Watchable; };
var isCondition = function (a) { return a && a instanceof Condition; };
var isComponent = function (a) { return a && a.__radi; };

export const text = function (str) { return document.createTextNode(str); };

var radiArgs = function (element, args) {
	for (var i = 0; i < args.length; i++) {
		var arg = args[i];

		if (arg !== 0 && !arg) {
			continue;
		}

		// support middleware
		if (isComponent(arg)) {
			element.appendChild(arg.__radi().out);
		} else if (isCondition(arg)) {
			var arg2 = arg.__do(), a, id = arg2.id
			if (isComponent(arg2.r)) {
				a = arg2.r.__radi().out;
			} else if (typeof arg2.r === 'function') {
				a = arg2.r();
			} else if (isString(arg2.r) || isNumber(arg2.r)) {
				a = text(arg2.r);
			} else {
				a = arg2.r;
			}
			element.appendChild(a);
			(function(arg){arg.watch(function(v) {
				var arg2 = arg.__do(), b
				if (id === arg2.id) return false
				if (isComponent(arg2.r)) {
					b = arg2.r.__radi().out;
				} else if (typeof arg2.r === 'function') {
					b = arg2.r();
				} else if (isString(arg2.r) || isNumber(arg2.r)) {
					b = text(arg2.r);
				} else {
					b = arg2.r;
				}
				a.parentNode.replaceChild(b, a)
				a = b
				id = arg2.id
			})})(arg)
		} else if (typeof arg === 'function') {
			arg.call(this, element);
		} else if (isString(arg) || isNumber(arg)) {
			element.appendChild(text(arg));
		} else if (isNode(getEl(arg))) {
			element.appendChild(arg);
		} else if (Array.isArray(arg)) {
			radiArgs.call(this, element, arg);
		} else if (isWatchable(arg)) {
			let z = text(arg.get());
			element.appendChild(z);
			// Update bind
			arg.watch(function (a) {
				radiMutate(() => {
					z.textContent = a;
				});
			});
		} else if (typeof arg === 'object') {
			setAttr.call(this, element, arg);
		}

	}
}

var htmlCache = {};

var memoizeHTML = function (query) { return htmlCache[query] || (htmlCache[query] = createElement(query)); };

export const r = function (query) {
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

export const component = function (o) {
	var fn = o.view.toString().replace(STRIP_COMMENTS, '')
	var match = FIND_L.exec(fn);
	var output = [];
	var cursor = 0;

	while (match !== null) {
		var n = match.index,
			all = match.input,
			_l = 1,
			_r = 0

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
		var obs = (m.length > 0) ? m.join('__ob__,') + '__ob__' : '';
		var newString = 'l(function(){ return ' + found.substr(1) + '; },[' + obs + '], "' + m.join(',') + '")';

		output.push(fn.substr(cursor, n - cursor));
		output.push(newString);
		cursor = n + found.length;

		match = FIND_L.exec(fn);
	}
	output.push(fn.substr(cursor, fn.length - cursor));
	o.$view = output.join('');

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

export const mount = function (comp, id) {
	const where = (id.constructor === String) ? document.getElementById(id) : id;
	var out = (comp instanceof Component) ? comp.__radi().out : comp;
	where.appendChild(out);
	return out;
}

var emptyNode = text('');

export const list = function (data, act) {
	if (!data) return '';
	var SELF = this;

	var link, fragment = document.createDocumentFragment(), toplink = emptyNode.cloneNode();

	fragment.appendChild(toplink);

	var ret = [];
	var inst = data.get()

	if (isArray(inst)) {
		for (var i = 0; i < inst.length; i++) {
			inst[i+'__ob__'].watch((v) => {})
			fragment.appendChild(
				act.call(SELF, inst[i], i)
			)
		}
	} else {
		var i = 0
		for (var key in inst) {
			inst[i+'__ob__'].watch((v) => {})
			fragment.appendChild(
				act.call(SELF, inst[key], key, i)
			)
			i++
		}
	}

	link = fragment.lastChild;

	var w = function(a, b) {
		if (a > 0) {
			var start = b.length - a
			for (var i = start; i < b.length; i++) {
				b[i+'__ob__'].watch((v) => {})
				fragment.appendChild(
					act.call(SELF, b[i], i)
				)
			}
			var temp = fragment.lastChild
			link.parentElement.insertBefore(fragment, link.nextSibling)
			link = temp
		} else
		if (a < 0) {
			for (var i = 0; i < Math.abs(a); i++) {
				var templink = link.previousSibling
				link.parentElement.removeChild(link)
				link = templink
			}
		}
	}

	if (data.watch) data.watch(w)
	if (data.get && data.get()._r_get) data.get()._r_get(w)

	return fragment;
}

export const link = function (fn, watch, txt) {
	var args = { s: null }, SELF = this, n, f = fn.bind(this);

	if (txt.length === 1 && fn.toString()
				.replace(/(function \(\)\{ return |\(|\)|\; \})/g, '')
				.trim() === txt[0]) {
		return watch[0];
	}

	for (var i = 0; i < watch.length; i++) {
		if (isWatchable(watch[i])) {
			n = true;
			watch[i].watch(function () {
				args.s = f(SELF);
			});
		}
	}

	args.s = f(SELF);

	if (!n) return args.s;
	return watchable(args, 's');
}

export const cond = function (a, e) {
	return new Condition(a, e)
}
var Condition = function Condition (a, e) {
	this.cases = [{a:a,e:e}]
	this.w = []
	this.els = emptyNode.cloneNode()

	if (isWatchable(a)) { this.w.push(a) }

	this.watch = function(cb) {
		for (var w in this.w) {
			this.w[w].watch(cb)
		}
	}

	this.__do = function() {
		var ret = {id: null}
		for (var c in this.cases) {
			var a = isWatchable(this.cases[c].a) ? this.cases[c].a.get() : this.cases[c].a
			if (a) {
				ret.id = c
				ret.r = this.cases[c].e
				break
			}
		}
		if (typeof ret.r === 'undefined') ret.r = this.els
		return ret
	}
}
Condition.prototype.elseif = function (a, e) {
	this.cases.push({a:a,e:e})
	if (isWatchable(a)) { this.w.push(a) }
	return this
}
Condition.prototype.cond = Condition.prototype.elseif
Condition.prototype.else = function (e) {
	this.els = e
	return this
}

export const l = function (f, w, c) {
	if (!w) {
		return f
	} else {
		return link.call(this, f, w, c.split(','))
	}
}

export const use = function (plug) {
	if (typeof window.radi[plug] === 'function') {
		window.radi[plug]()
	} else {
		console.warn('[Radi.js] Warn: Cannot find plugin `', plug)
	}
}

export const freeze = () => { frozenState = true }
export const unfreeze = () => {
	frozenState = false

	for (var ii = 0; ii < activeComponents.length; ii++) {
		if (typeof activeComponents[ii].$this.onMount === 'function') {
			activeComponents[ii].$this.onMount.call(activeComponents[ii].$this)
		}
	}
}
