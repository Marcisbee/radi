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

// Object.defineProperties(Object, {
// 	relocate: {
// 		configurable: true,
// 		enumerable: false,
// 		value: function relocate(what, wit) {
// 			for (var key in wit) {
// 				const end = wit[key]
// 				var change = false
// 				if (end && typeof end === 'object' && !(end instanceof Radi)) {
// 					if (typeof what[key] === 'undefined') what[key] = end.constructor()
// 					Object.relocate(what[key], end)
// 					change = true
// 				} else {
// 					if (what[key] !== end) {
// 						change = true
// 						what[key] = end
// 					}
// 				}
// 				if (change) populateOne(what, key)
// 			}
// 		},
// 		writable: true
// 	}
// });
//
// var arrayProxy = function arrayProxy() {
// 	var l1 = this[0].length,
// 			arr = clone(this[0]),
// 			// arr = this[0],
// 			ret = Array.prototype[this[1]].apply(arr, arguments),
// 			l2 = arr.length,
// 			diff = l2 - l1
//
// 	this[0].length = l2
//
// 	if (diff < 0) {
// 		for (var i = l1; i > l1 + diff; i--) {
// 			delete this[0][(i-1)+'__ob__']
// 			delete this[0][(i-1)]
// 		}
// 	}
//
// 	Object.relocate(this[0], arr)
//
// 	if (diff !== 0) {
// 		this[0]._r_set(diff, this[0])
// 	}
//
// 	return ret
// }
//
// var arrayRules = function arrayRules(item, def) {
// 	// TODO: Creaete _r_set loop with array of bucket
// 	// var bucket = []
// 	var bucket = () => {},
// 		a = (v) => ({ value: function () { return arrayProxy.apply([this, v], arguments) } })
// 	def._r_set = { value: function (v) { if (frozenState) return false; bucket(v, item) } }
// 	def._r_get = { value: function (cb) { bucket = cb } }
// 	def.push = a('push')
// 	def.pop = a('pop')
// 	def.splice = a('splice')
// 	def.shift = a('shift')
// 	def.unshift = a('unshift')
// 	def.reverse = a('reverse')
// }
//
// var populateOne = function populateOne(item, ii) {
// 	if (typeof item[ii + '__ob__'] !== 'undefined') return false
//
// 	var def = { __r: { value: true } }
//
// 	// If input is an Array
// 	if (isArray(item) && typeof item.__r === 'undefined' && !item.__r) {
// 		arrayRules(item, def)
// 	}
//
// 	def[ii + '__ob__'] = { value: watchable(item, ii), configurable: true }
//
// 	if (typeof item[ii] === 'object') populate(item[ii])
//
// 	return Object.defineProperties(item, def)
// }
//
// // Add watchers to every object and array
// var populate = function populate(item) {
// 	if (item && typeof item === 'object') {
// 		var def = { __r: { value: true } }
//
// 		// If input is an Array
// 		if (isArray(item)) {
// 			if (typeof item.__r === 'undefined' && !item.__r) {
// 				arrayRules(item, def)
// 			}
//
// 			for (var ii in item) {
// 				// Add watchable
// 				// Should not be able to reconfigure this
// 				if (typeof item[ii + '__ob__'] === 'undefined') {
// 					def[ii + '__ob__'] = { value: watchable(item, ii), configurable: true }
// 					populate(item[ii])
// 				}
// 			}
//
// 		} else
// 		// If input is an Object
// 		if (isObject(item)) {
//
// 			for (var ii in item) {
// 				// Add watchable
// 				// Should not be able to reconfigure this
// 				if (typeof item[ii + '__ob__'] === 'undefined') {
// 					def[ii + '__ob__'] = { value: watchable(item, ii), configurable: true }
// 					populate(item[ii])
// 				}
// 			}
//
// 		}
//
// 		return Object.defineProperties(item, def)
// 	} else { return false }
// }






// NEW CODE
const WATCH = {}

var getwatch = function(path) {
	return WATCH[path] || (WATCH[path] = [])
}

var watch = function(path, fn) {
	if (Array.isArray(path)) {
		for (var i = 0; i < path.length; i++) {
			getwatch(path[i]).push(fn)
		}
	}
	return getwatch(path).push(fn)
}

var trigger = function(path) {
	var list = getwatch(path), len = list.length
	for (var i = 0; i < len; i++) {
		list[i]()
	}
}

var watchable = function (fn, deps) {
	return new Watchable(fn, deps, this)
}

var Watchable = function Watchable (fn, deps, source) {
	// console.log(deps)
	this.fn = fn
	this.deps = deps
	// this.watch = watch.bind(null, this.deps, this.fn)
}

var dep = watchable





// var dsc = Object.getOwnPropertyDescriptor
// var watcher = function watcher(targ, prop, handler) {
// 	var oldval = targ[prop],
// 		prev = (typeof dsc(targ, prop) !== 'undefined') ? dsc(targ, prop).set : null,
// 		setter = function (newval) {
// 			if (frozenState) return false
// 			if (oldval !== newval) {
// 				if (isObject(newval)) {
//
// 					Object.relocate(oldval, newval)
// 				} else
// 				if (isArray(newval)) {
// 					var diff = newval.length - oldval.length
// 					oldval.length = newval.length
//
// 					Object.relocate(oldval, newval)
// 					newval = diff
// 				} else {
// 					oldval = newval
// 				}
// 				if (typeof prev === 'function') prev(newval)
// 				handler.call(targ, prop, oldval, newval)
// 			} else {
// 				return false
// 			}
// 		}
//
// 	if (delete targ[prop]) {
// 		Object.defineProperty(targ, prop, {
// 			get: function () {
// 				return oldval;
// 			},
// 			set: setter,
// 			enumerable: true,
// 			configurable: true
// 		})
// 	}
// }


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



// function copy(target, source) {
// 	var obj = {}
//
// 	for (var i in target) obj[i] = target[i]
// 	for (var i in source) obj[i] = source[i]
//
// 	return obj
// }
//
// function set(path, value, source) {
// 	var target = {}
// 	if (path.length) {
// 		target[path[0]] =
// 			path.length > 1 ? set(path.slice(1), value, source[path[0]]) : value
// 		return copy(source, target)
// 	}
// 	return value
// }

function triggerChanges(a, b, path) {
	if (typeof a === 'object' && typeof a === typeof b) {
		var len = {
			a: (isObject(a)) ? Object.keys(a).length : a.length,
			b: (isObject(b)) ? Object.keys(b).length : b.length
		}
		if (len.a !== len.b) {
			// console.warn('Change in length detected', path)
			trigger(path)
		} else if (JSON.stringify(a) !== JSON.stringify(b)) {
			// console.warn('Change in array detected', path)
			trigger(path)
		}
		for (var prop in a) {
			triggerChanges(a[prop], b[prop], path + '.' + prop)
		}
	} else if (JSON.stringify(a) !== JSON.stringify(b)) {
		// console.warn('Change in value detected', path)
		trigger(path)
	}
}

function get(path, source) {
	for (var i = 0; i < path.length; i++) {
		source = source[path[i]]
	}
	return source
}



function getDiff(a, b){
	var diff = (isArray(a) ? [] : {});
	var changes = []
  recursiveDiff(a, b, diff, 'this', changes);
	// console.warn(changes)
  return changes;
}

function recursiveDiff(a, b, node, path, changes){
  for (var prop in a) {
    // console.log(prop, 1);
    if (typeof b[prop] === 'undefined') {
			changes.push(path + '.' + prop)
      addNode(prop, '[[removed]]', node);
    } else if (JSON.stringify(a[prop]) !== JSON.stringify(b[prop])) {
      // console.log(typeof b[prop], 2);
      // if value
      if (typeof b[prop] !== 'object' || b[prop] === null) {
				changes.push(path + '.' + prop)
        addNode(prop, b[prop], node);
        // console.log("(added)", 3);
    	} else {
        // if array
        if (isArray(b[prop])) {
					changes.push(path + '.' + prop)
					addNode(prop, [], node);
					recursiveDiff(a[prop], b[prop], node[prop], path + '.' + prop, changes);
        }
        // if object
        else {
					changes.push(path + '.' + prop)
          addNode(prop, {}, node);
          recursiveDiff(a[prop], b[prop], node[prop], path + '.' + prop, changes);
        }
      }
    }
  }
}

function addNode(prop, value, parent) {
  parent[prop] = value;
}






var ids = 0;
const activeComponents = [];

var Radi = function(o) {
	var SELF = {
		$id: ids++,
		$state: clone(o.state),
		$props: o.props,
		$actions: o.actions,
		$html: document.createDocumentFragment(),
		$view: null,
		$link: null
	}

	var remap = function(o, n) {
		triggerChanges(o, n, 'this')
		// var changed = getDiff(o, n)
		// // var trie = []
		// // window.requestAnimationFrame(() => {
		// for (var i in changed) {
		// 	// var step = changed[i].split('.'), len = step.length
		// 	trigger(changed[i])
		//
		// 	// if (len <= 1) continue;
		// 	//
		// 	// var last = step.shift()
		// 	// for (var s = 0; s < len - 1; s++) {
		// 	// 	last = last + '.' + step.shift()
		// 	// 	if (tried.indexOf(last) < 0) {
		// 	// 		trigger(last)
		// 	// 		tried.push(last)
		// 	// 	}
		// 	// }
		// }
	// })
	}

	SELF.$set = function $set(path, value) {
		var p = path.replace('this.', '').split('.'),
			target = SELF
		for (var i = 0; i < p.length - 1; i++) {
			target = SELF[p[i]]
		}
		target[p[i]] = value
		trigger(path)
		return value
	}

	var linkedActions = function(a) {
		var n = {}
		for (var i in a) {
			n[i] = (function() {
				var old = clone(SELF)
				var b = this.apply(SELF, arguments)
				remap(old, SELF)
				return b
			}).bind(a[i])
		}
		return n
	}

	Object.assign(SELF, SELF.$state)
	Object.assign(SELF, linkedActions(SELF.$actions))

	SELF.$view = new Function('r','list','l','cond','return ' + o.$view)(
		r.bind(SELF), list.bind(SELF), l.bind(SELF), cond.bind(SELF)
	)

	SELF.$render = function() {
		SELF.$link = SELF.$view()
		SELF.$html.appendChild(SELF.$link)
		SELF.mount()
		return SELF.$html
	}

	// if (SELF.$link instanceof Component || Array.isArray(SELF.$link)) {
	// 	SELF.$link = r.call(SELF, null, SELF.$link);
	// }
	// SELF.$html.appendChild(SELF.$link);
	//
	// SELF.$html.destroy = (function () {
	// 	const oldRootElem = SELF.$link.parentElement;
	// 	const newRootElem = oldRootElem.cloneNode(false);
	// 	oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
	// 	SELF.unmount();
	// 	oldRootElem.parentNode.removeChild(oldRootElem);
	// }).bind(SELF);

	SELF.mount = function () {
		if (typeof SELF.$actions.onMount === 'function') {
			SELF.$actions.onMount.call(SELF)
		}
		activeComponents.push(SELF);
	};

	SELF.unmount = function () {
		if (typeof SELF.$actions.onDestroy === 'function') {
			SELF.$actions.onDestroy.call(SELF)
		}
		for (var i = 0; i < activeComponents.length; i++) {
			if (activeComponents[i].$id === SELF.$id) {
				activeComponents.splice(i, 1);
				break;
			}
		}
		return SELF.$link;
	};

	// SELF.$link.unmount = SELF.unmount.bind(SELF)
	// SELF.$remount = function () {
	// 	this.mount();
	// 	return this.link
	// }
	// SELF.$out = function () {
	// 	this.mount();
	// 	return this.$html;
	// }

	return SELF
}

// class Radi {
// 	constructor(o) {
// 		var state = o.state || {},
// 			props = o.props || {},
// 			actions = o.actions || {},
// 			view = o.view;
//
// 		this.$id = ids++;
//
// 		this.$this = {};
// 		var SELF = this.$this;
//
// 		for (var k in state) {
// 			if (typeof SELF[k] === 'undefined') {
// 				SELF[k] = state[k];
// 			} else {
// 				throw new Error('[Radi.js] Err: Trying to write state for reserved variable `' + k + '`');
// 			}
// 		}
//
// 		for (var k in props) {
// 			if (typeof SELF[k] === 'undefined') {
// 				if (isWatchable(props[k])) {
// 					SELF[k] = props[k].get();
// 					props[k].watch(function (a) {
// 						SELF[k] = a;
// 					});
// 				} else {
// 					SELF[k] = props[k];
// 				}
// 			} else {
// 				throw new Error('[Radi.js] Err: Trying to write prop for reserved variable `' + k + '`');
// 			}
// 		}
//
// 		// populate(SELF);
// 		var data = SELF;
//
// 		for (var k in actions) {
// 			if (typeof SELF[k] === 'undefined') {
// 				const act = actions[k];
// 				SELF[k] = function () { return (frozenState) ? function () {} : act.apply(SELF, arguments) };
//
// 				(function(SELF, k) {
// 					Object.defineProperty(SELF[k], 'props', {
// 						value() {
// 							var args = arguments;
// 							return function () { return (frozenState) ? function () {} : SELF[k].apply(SELF, args, arguments) }
// 						}
// 					});
// 				})(SELF, k)
// 			} else {
// 				throw new Error('[Radi.js] Error: Trying to write action for reserved variable `' + k + '`');
// 			}
// 		}
//
// 		SELF.$id = this.$id;
// 		SELF.$name = o.name;
// 		SELF.$state = state;
// 		SELF.$props = props;
// 		SELF.$actions = actions;
// 		// SELF.$data = data;
//
// 		this.$html = document.createDocumentFragment();
//
// 		this.$view = new Function(
// 			'r',
// 			'list',
// 			'l',
// 			'cond',
// 			// 'return ' + output
// 			'return ' + o.$view
// 		)(
// 			r.bind(SELF),
// 			list.bind(SELF),
// 			l.bind(SELF),
// 			cond.bind(SELF)
// 		);
//
// 		// console.log(this.$view);
//
// 		this.$link = this.$view.apply(SELF);
//
// 		if (this.$link instanceof Component || Array.isArray(this.$link)) {
// 			this.$link = r.call(SELF, null, this.$link);
// 		}
// 		this.$html.appendChild(this.$link);
//
// 		this.$html.destroy = (function () {
// 			const oldRootElem = this.$link.parentElement;
// 			const newRootElem = oldRootElem.cloneNode(false);
// 			oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
// 			this.unmount();
// 			oldRootElem.parentNode.removeChild(oldRootElem);
// 		}).bind(this);
//
// 		this.mount = function () {
// 			if (typeof actions.onMount === 'function') {
// 				actions.onMount.call(SELF)
// 			}
// 			activeComponents.push(this);
// 		};
//
// 		this.unmount = function () {
// 			if (typeof actions.onDestroy === 'function') {
// 				actions.onDestroy.call(SELF)
// 			}
// 			for (var i = 0; i < activeComponents.length; i++) {
// 				if (activeComponents[i].$id === this.$id) {
// 					activeComponents.splice(i, 1);
// 					break;
// 				}
// 			}
// 			return this.$link;
// 		};
//
// 		this.$link.unmount = this.unmount.bind(this)
// 	}
//
// 	get remount() {
// 		this.mount();
// 		return this.link;
// 	}
//
// 	get out() {
// 		this.mount();
// 		return this.$html;
// 	}
// }

var unmountAll = function unmountAll(el) {
	if (typeof el.unmount === 'function') el.unmount()
	if (el.children && el.children.length > 0) {
		for (var i = 0; i < el.children.length; i++) {
			unmountAll(el.children[i])
		}
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
		var cached = arg2.fn()
		el.style[arg1] = cached;

		// Update bind
		watch(arg2.deps, (function (cached) {
			var n = this()
			if (n !== cached) {
				radiMutate(() => {
					el.style[arg1] = n;
				});
				cached = n
			}
		}).bind(arg2.fn, cached))
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
			var cached = arg2.fn()
			el.value = cached
			el.oninput = function (e) {
				// console.log(e.target.value)
				if (Array.isArray(arg2.deps) && arg2.deps[0]) {
					self.$set(arg2.deps[0], e.target.value)
				}
			}
			// el['oninput'] = function () { arg2.data()[arg2.prop] = el.value };

			// if (Array.isArray(arg2.deps) && arg2.deps[0]) {
			// 	trigger(arg2.deps[0])
			// }

			// Update bind
			watch(arg2.deps, (function (cached) {
				var n = this()
				if (n !== cached) {
					radiMutate(() => {
						el.value = n
					});
					cached = n
				}
			}).bind(arg2.fn, cached))
		} else if (isFunction(arg2)) {
			el[arg1] = function (e) { arg2.call(self, e); };
		} else if (isWatchable(arg2)) {
			var cached = arg2.fn()
			el.setAttribute(arg1, cached);

			// Update bind
			watch(arg2.deps, (function (cached) {
				var n = this()
				if (n !== cached) {
					radiMutate(() => {
						el.setAttribute(arg1, n);
					});
					cached = n
				}
			}).bind(arg2.fn, cached))
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

const text = function (str) { return document.createTextNode(str); };

var radiArgs = function (element, args) {
	var self = this
	for (var i = 0; i < args.length; i++) {
		var arg = args[i];

		if (arg !== 0 && !arg) {
			continue;
		}

		// support middleware
		if (isComponent(arg)) {
			element.appendChild(arg.__radi().$render());
		// } else if (isCondition(arg)) {
		// 	var arg2 = arg.__do(), a, id = arg2.id
		// 	if (isComponent(arg2.r)) {
		// 		a = arg2.r.__radi().$render();
		// 	} else if (typeof arg2.r === 'function') {
		// 		a = arg2.r();
		// 	} else if (isString(arg2.r) || isNumber(arg2.r)) {
		// 		a = text(arg2.r);
		// 	} else {
		// 		a = arg2.r;
		// 	}
		// 	element.appendChild(a);
		// 	(function(arg){arg.watch(function(v) {
		// 		var arg2 = arg.__do(), b
		// 		if (id === arg2.id) return false
		// 		if (isComponent(arg2.r)) {
		// 			b = arg2.r.__radi().$render();
		// 		} else if (typeof arg2.r === 'function') {
		// 			b = arg2.r();
		// 		} else if (isString(arg2.r) || isNumber(arg2.r)) {
		// 			b = text(arg2.r);
		// 		} else {
		// 			b = arg2.r;
		// 		}
		// 		unmountAll(a)
		// 		a.parentNode.replaceChild(b, a)
		// 		a = b
		// 		id = arg2.id
		// 	})})(arg)
		} else if (typeof arg === 'function') {
			arg.call(this, element);
		} else if (isString(arg) || isNumber(arg)) {
			element.appendChild(text(arg));
		} else if (isNode(getEl(arg))) {
			element.appendChild(arg);
		} else if (Array.isArray(arg)) {
			radiArgs.call(this, element, arg);
		} else if (isWatchable(arg)) {
			var cached = arg.fn() + ' ((' + arg.deps[0] + '))'
			let z = text(cached)
			element.appendChild(z);

			// Update bind
			watch(arg.deps[0], (function (cached, z) {
				console.log(this.fn.call(self), this.fn(), element, z)
				var n = this.fn()
				if (n !== cached) {
					radiMutate(() => {
						z.textContent = n;
					});
					cached = n
				}
			}).bind(arg, cached, z))
		} else if (typeof arg === 'object') {
			setAttr.call(this, element, arg);
		}

	}
}

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
		// var obs = (m.length > 0) ? m.join('__ob__,') + '__ob__' : '';
		// var newString = 'l(function(){ return ' + found.substr(1) + '; },[' + obs + '], "' + m.join(',') + '")';
		// var newString = 'dep(function(){ return ' + found.substr(1) + '; }, "' + m.join(',') + '".split(","))';

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

const mount = function (comp, id) {
	const where = (id.constructor === String) ? document.getElementById(id) : id;
	var out = (comp instanceof Component) ? comp.__radi().$render() : comp;
	where.appendChild(out);
	return out;
}

var emptyNode = text('');

const list = function (array, fn) {
	if (!array) return '';
	var SELF = this;

	console.log(SELF, array)

	var link, fragment = document.createDocumentFragment(), toplink = emptyNode.cloneNode();
	fragment.appendChild(toplink);

	var ret = [];
	if (array instanceof Watchable) {
		var ret = array.fn()
		var path = array.deps[0]

		var cached = ret.length

		watch(path, function () {
			var n = array.fn(), len = n.length
			if (len !== cached) {
				// radiMutate(() => {
					console.log('changed', len - cached)
				// });
				var z = len - cached
				cached = len
				w(z, n)
			}
		})
	}

	link = fragment.lastChild;

	var w = function(a, b) {
		console.warn(a)
		if (a > 0) {
			var start = b.length - a
			var p = link.parentElement
			for (var i = start; i < b.length; i++) {
				var current = fn.call(SELF, b[i], i);
				fragment.appendChild(
					current
				);
				(function(path, i, current) {
					watch(path + '.' + i, function () {
						// radiMutate(() => {
							var temp = fn.call(SELF, b[i], i)
							p.replaceChild(temp, current);
							current = temp
							// console.log('changed 222', i, current)
						// });
					})
				})(path, i, current)
				// b[i+'__ob__'].watch((v) => {})
				// fragment.appendChild(
				// 	current
				// )
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

	console.warn(ret)

	// 	var w = function(a, b) {
	// 	if (a > 0) {
	// 		var start = b.length - a
	// 		for (var i = start; i < b.length; i++) {
	// 			b[i+'__ob__'].watch((v) => {})
	// 			fragment.appendChild(
	// 				act.call(SELF, b[i], i)
	// 			)
	// 		}
	// 		var temp = fragment.lastChild
	// 		link.parentElement.insertBefore(fragment, link.nextSibling)
	// 		link = temp
	// 	} else
	// 	if (a < 0) {
	// 		for (var i = 0; i < Math.abs(a); i++) {
	// 			var templink = link.previousSibling
	// 			link.parentElement.removeChild(link)
	// 			link = templink
	// 		}
	// 	}
	// }
	//
	// if (data.watch) data.watch(w)


	return fragment
}

// const list_old = function (data, act) {
// 	if (!data) return '';
// 	var SELF = this;
//
// 	var link, fragment = document.createDocumentFragment(), toplink = emptyNode.cloneNode();
//
// 	fragment.appendChild(toplink);
//
// 	var ret = [];
// 	var inst = data.get()
//
// 	if (isArray(inst)) {
// 		for (var i = 0; i < inst.length; i++) {
// 			inst[i+'__ob__'].watch((v) => {})
// 			fragment.appendChild(
// 				act.call(SELF, inst[i], i)
// 			)
// 		}
// 	} else {
// 		var i = 0
// 		for (var key in inst) {
// 			inst[i+'__ob__'].watch((v) => {})
// 			fragment.appendChild(
// 				act.call(SELF, inst[key], key, i)
// 			)
// 			i++
// 		}
// 	}
//
// 	link = fragment.lastChild;
//
// 	var w = function(a, b) {
// 		if (a > 0) {
// 			var start = b.length - a
// 			for (var i = start; i < b.length; i++) {
// 				b[i+'__ob__'].watch((v) => {})
// 				fragment.appendChild(
// 					act.call(SELF, b[i], i)
// 				)
// 			}
// 			var temp = fragment.lastChild
// 			link.parentElement.insertBefore(fragment, link.nextSibling)
// 			link = temp
// 		} else
// 		if (a < 0) {
// 			for (var i = 0; i < Math.abs(a); i++) {
// 				var templink = link.previousSibling
// 				link.parentElement.removeChild(link)
// 				link = templink
// 			}
// 		}
// 	}
//
// 	if (data.watch) data.watch(w)
// 	if (data.get && data.get()._r_get) data.get()._r_get(w)
//
// 	return fragment;
// }

// const link = function (fn, watch, txt) {
// 	var args = { s: null }, SELF = this, n, f = fn.bind(this);
//
// 	if (txt.length === 1 && fn.toString()
// 				.replace(/(function \(\)\{ return |\(|\)|\; \})/g, '')
// 				.trim() === txt[0]) {
// 		return watch[0];
// 	}
//
// 	for (var i = 0; i < watch.length; i++) {
// 		if (isWatchable(watch[i])) {
// 			n = true;
// 			watch[i].watch(function () {
// 				args.s = f(SELF);
// 			});
// 		}
// 	}
//
// 	args.s = f(SELF);
//
// 	if (!n) return args.s;
// 	return watchable(args, 's');
// }

const cond = function (a, e) {
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

const l = function (f, w, c) {
	if (!w) {
		return f
	} else {
		return link.call(this, f, w, c.split(','))
	}
}

// const use = function (plug) {
// 	if (typeof window.radi[plug] === 'function') {
// 		window.radi[plug]()
// 	} else {
// 		console.warn('[Radi.js] Warn: Cannot find plugin `', plug)
// 	}
// }

const freeze = () => { frozenState = true }
const unfreeze = () => {
	frozenState = false

	for (var ii = 0; ii < activeComponents.length; ii++) {
		if (typeof activeComponents[ii].$this.onMount === 'function') {
			activeComponents[ii].$this.onMount.call(activeComponents[ii].$this)
		}
	}
}
