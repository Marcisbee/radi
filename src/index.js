export const version = '0.0.5';

var es = new EventSpitter;

// es.on('this.list', function(e) {
// 	console.log( "1 I was triggered by event " + e );
// })
//
// es.on('this.list', function(e) {
// 	console.log( "2 I was triggered by event " + e );
// })

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
				if (change) {
					populateOne(what, key)
				}
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
	// var bucket = () => {},
	// 	a = (v) => ({ value: function () { return arrayProxy.apply([this, v], arguments) } })
	// def._r_set = { value: function (v) { if (frozenState) return false; bucket(v, item) } }
	// def._r_get = { value: function (cb) { bucket = cb } }
	// def.push = a('push')
	// def.pop = a('pop')
	// def.splice = a('splice')
	// def.shift = a('shift')
	// def.unshift = a('unshift')
	// def.reverse = a('reverse')
}

// var populateOne = function populateOne(item, ii) {
// 	if (typeof item[ii + '__ob__'] !== 'undefined') return false
//
// 	var def = { __r: { value: true } }
//
// 	if (typeof item.__path === 'undefined') def.__path = { value: item.__path + '.' + ii }
//
// 	var ret = Object.defineProperties(item, def);
//
// 	if (typeof item[ii] === 'object') populate(item[ii], item.__path + '.' + ii)
//
// 	return ret
// }

var populateOne = function populateOne(item, path) {
	if (typeof item !== 'object' || !item) return false
	if (path === 'this.$view') return false
	if (path === 'this.$props') return false
	if (path === 'this.$state') return false
	if (path === 'this.$link') return false
	if (path === 'this.$html') return false
	// if (typeof item[ii + '__ob__'] !== 'undefined') return false

	var def = { __r: { value: true } }

	if (typeof item.__path === 'undefined') def.__path = { value: path }

	var ret = Object.defineProperties(item, def);

	if (typeof item === 'object')
		for (var ii in item) {
			if (typeof item === 'object')
				populateOne(item[ii], path + '.' + ii)
		}

	// if (typeof item === 'object') populate(item[ii], path)

	return ret
}

// Add watchers to every object and array
var populate = function populate(item, pr) {
	var path = (typeof pr === 'undefined') ? 'this' : pr;
	if (item && typeof item === 'object') {
		var def = { __r: { value: true } }

		if (typeof item.__path === 'undefined') def.__path = { value: path }

		var ret = Object.defineProperties(item, def)

		for (var ii in item) {
			populate(item[ii], path + '.' + ii)
		}

		// // If input is an Array
		// if (isArray(item)) {
		// 	// if (typeof item.__r === 'undefined' && !item.__r) {
		// 	// 	arrayRules(item, def)
		// 	// }
		//
		// 	for (var ii in item) {
		// 		// Add watchable
		// 		// Should not be able to reconfigure this
		// 		// if (typeof item[ii + '__ob__'] === 'undefined') {
		// 			// def[ii + '__ob__'] = { value: watchable(item, ii), configurable: true }
		// 			populate(item[ii], path + '.' + ii)
		// 		// }
		// 	}
		//
		// } else
		// // If input is an Object
		// if (isObject(item)) {
		//
		// 	for (var ii in item) {
		// 		// Add watchable
		// 		// Should not be able to reconfigure this
		// 		// if (typeof item[ii + '__ob__'] === 'undefined') {
		// 			// def[ii + '__ob__'] = { value: watchable(item, ii), configurable: true }
		// 			populate(item[ii], path + '.' + ii)
		// 		// }
		// 	}
		//
		// }

		return ret
	} else { return false }
}

// const WATCH = {}
//
// var getwatch = function(path) {
// 	return WATCH[path] || (WATCH[path] = [])
// }
//
// var watch = function(path, fn) {
// 	if (Array.isArray(path)) {
// 		for (var i = 0; i < path.length; i++) {
// 			getwatch(path[i]).push(fn)
// 		}
// 	}
// 	return getwatch(path).push(fn)
// }
//
// var trigger = function(path) {
// 	var list = getwatch(path), len = list.length
// 	for (var i = 0; i < len; i++) {
// 		list[i]()
// 	}
// }

// var watchable = function (fn, deps) {
// 	return new Watchable(fn, deps, this)
// }
//
// var Watchable = function Watchable (fn, deps, source) {
// 	// console.log(deps)
// 	this.fn = fn
// 	this.deps = deps
// 	// this.watch = watch.bind(null, this.deps, this.fn)
// }
//
// var dep = watchable

var watchable = function (data, prop) { return new Watchable(data, prop) }

var Watchable = function Watchable (data, prop) {
	var temp = data;

	this.watch = function watch (c) {
		var cache = temp[prop]
		// if (temp.__path) {
			es.on(temp.__path + '.' + prop, function(e) {
				if (temp[prop] === cache) return false
				c(temp[prop], cache)
				cache = temp[prop]
			})
		// }
		// watcher(temp, prop, (p, prev, next) => {
		// 	// c(next, prev)
		// 	return next
		// })
	}

	this.prop = prop

	this.path = data.__path + '.' + prop

	this.data = function data () {
		return temp
	}

	this.get = function get () {
		return temp[prop]
	}
}

var dsc = Object.getOwnPropertyDescriptor
var watcher = function watcher(targ, prop, handler) {
	// console.warn('Watcher', targ, targ.__path, prop)
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
				// TODO: Make actual triggers
				// if (typeof targ.__path !== 'undefined') {
				// 	console.warn('Trigger', targ.__path + '.' + prop)
				// 	es.emit(targ.__path + '.' + prop)
				// }
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


// function triggerChanges(a, b, path) {
// 	if (!(a === null && b === null))
// 		if (JSON.stringify(a) !== JSON.stringify(b)) {
// 			// Found difference in data
// 			if (Array.isArray(b) && b.length < a.length && !b.length) {
// 				//
// 			} else
// 			if (typeof a === 'object' && typeof a === typeof b) {
// 				for (var prop in a) {
// 					triggerChanges(a[prop], b[prop], path + '.' + prop)
// 				}
// 			} else {
// 				// Simple value
// 				console.warn('Change in value detected', path)
// 				es.emit(path, b)
// 			}
// 		}
// 		if (typeof a === 'object' && typeof a === typeof b) {
// 			var len = {
// 				a: (isObject(a)) ? Object.keys(a).length : a.length,
// 				b: (isObject(b)) ? Object.keys(b).length : b.length
// 			}
// 			if (len.a !== len.b) {
// 				console.warn('Change in length detected', path)
// 				es.emit(path, b)
// 			} else if (JSON.stringify(a) !== JSON.stringify(b)) {
// 				console.warn('Change in object detected', path)
// 				es.emit(path, b)
// 			}
// 			for (var prop in a) {
// 				triggerChanges(a[prop], b[prop], path + '.' + prop)
// 			}
// 		} else if (JSON.stringify(a) !== JSON.stringify(b)) {
// 			console.warn('Change in value detected', path)
// 			es.emit(path, b)
// 		}
// }


function triggerChanges(a, b, path) {
	if (path === 'this.$view'
		|| path === 'this.$props'
		|| path === 'this.$state'
		|| path === 'this.$link'
		|| path === 'this.$html') return false
  for (var prop in a) {
		var p = path + '.' + prop
    if (typeof b[prop] === 'undefined') {
			// console.warn('Change in value detected', p)
			es.emit(p, b[prop])
    } else if (JSON.stringify(a[prop]) !== JSON.stringify(b[prop])) {
      // console.log(typeof b[prop], 2);
      // if value
      if (typeof b[prop] !== 'object' || b[prop] === null) {
				// console.warn('Change in value detected', p)
				es.emit(p, b[prop])
    	} else {
        // if array
        if (isArray(b[prop])) {
					// console.warn('Change in value detected', p)
					es.emit(p, b[prop])
					triggerChanges(a[prop], b[prop], p);
        }
        // if object
        else {
					// console.warn('Change in value detected', p)
					es.emit(p, b[prop])
          triggerChanges(a[prop], b[prop], p);
        }
      }
    }
  }
}


var ids = 0;
export const activeComponents = [];

var Radi = function(o) {
	var SELF = {}

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
				o.props[i].watch(function (a) {
					SELF[i] = a;
				});
			} else {
				SELF[i] = o.props[i];
			}
		} else {
			throw new Error('[Radi.js] Err: Trying to write prop for reserved variable `' + i + '`');
		}
	}

	populate(SELF);
	// SELF = clone(SELF)

	for (var i in o.actions) {
		if (typeof SELF[i] === 'undefined') {
			SELF[i] = (function() {
				if (frozenState) return null
				var old = clone(SELF)
				var b = this.apply(SELF, arguments)
				populateOne(SELF, 'this');
				triggerChanges(old, SELF, 'this')
				return b
			}).bind(o.actions[i]);

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

	// for (var i in o.actions) {
	// 	if (typeof SELF[i] === 'undefined') {
	// 		const act = o.actions[i];
	// 		SELF[i] = function () { return (frozenState) ? function () {} : act.apply(SELF, arguments) };
	//
	// 		(function(i) {
	// 			Object.defineProperty(SELF[i], 'props', {
	// 				value() {
	// 					var args = arguments;
	// 					return function () { return (frozenState) ? function () {} : SELF[i].apply(SELF, args, arguments) }
	// 				}
	// 			});
	// 		})(i)
	// 	} else {
	// 		throw new Error('[Radi.js] Error: Trying to write action for reserved variable `' + i + '`');
	// 	}
	// }

	SELF.$id = ids++;
	SELF.$name = o.name;
	SELF.$state = o.state || {};
	SELF.$props = o.props || {};
	SELF.$actions = o.actions || {};
	SELF.$html = document.createDocumentFragment();

	// Object.assign(SELF, SELF.$state)
	// Object.assign(SELF, linkedActions(SELF.$actions))

	SELF.$view = new Function('r','list','l','cond','return ' + o.$view)(
		r.bind(SELF), list.bind(SELF), l.bind(SELF), cond.bind(SELF)
	)

	SELF.$link = SELF.$view()
	// SELF.$link.unmount = SELF.unmount.bind(SELF)
	SELF.$html.appendChild(SELF.$link)

	SELF.$render = function() {
		SELF.mount()
		return SELF.$html
	}

	// SELF.$html.destroy = function () {
	// 	const oldRootElem = SELF.$link.parentElement;
	// 	const newRootElem = oldRootElem.cloneNode(false);
	// 	oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
	// 	SELF.unmount();
	// 	oldRootElem.parentNode.removeChild(oldRootElem);
	// }

	SELF.mount = function () {
		console.log('MOUNT', SELF.$name)
		if (typeof SELF.$actions.onMount === 'function') {
			SELF.$actions.onMount.call(SELF)
		}
		activeComponents.push(SELF);
	}

	SELF.unmount = function () {
		console.log('UNMOUNT', SELF.$name)
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
	}

	SELF.$link.unmount = SELF.unmount.bind(SELF)
	SELF.$link.mount = SELF.mount.bind(SELF)
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

var unmountAll = function unmountAll(el) {
	if (typeof el.unmount === 'function') el.unmount()
	if (el.children && el.children.length > 0) {
		for (var i = 0; i < el.children.length; i++) {
			unmountAll(el.children[i])
		}
	}
}

var mountAll = function mountAll(el) {
	if (typeof el.mount === 'function') el.mount()
	if (el.children && el.children.length > 0) {
		for (var i = 0; i < el.children.length; i++) {
			mountAll(el.children[i])
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
			var cache = arg2.get()
			el.value = cache;
			el['oninput'] = function () { arg2.source[arg2.prop] = cache = el.value; es.emit(arg2.path, el.value) };
			arg2.watch(function (a) {
				if (cache !== a)
					radiMutate(() => {
						el.value = a;
					});
			});
		} else if (isFunction(arg2)) {
			el[arg1] = function (e) { arg2.call(self, e); };
		} else if (isWatchable(arg2)) {
			var temp = arg2.get()
			if (isFunction(temp)) {
				el[arg1] = function (e) { arg2.get().call(self, e); };
			} else {
				el.setAttribute(arg1, arg2.get());
				// Update bind
				arg2.watch(function (a) {
					radiMutate(() => {
						el.setAttribute(arg1, a);
					});
				});
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

var ensureEl = function (parent) { return isString(parent) ? html(parent) : getEl(parent); };
var getEl = function (parent) { return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el); };

var isString = function (a) { return typeof a === 'string'; };
var isNumber = function (a) { return typeof a === 'number'; };
var isFunction = function (a) { return typeof a === 'function'; };

var isNode = function (a) { return a && a.nodeType; };
var isWatchable = function (a) { return a && a instanceof NW; };
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
			element.appendChild(arg.__radi().$render());
		} else if (isCondition(arg)) {
			var arg2 = arg.__do(), a, id = arg2.id
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
			(function(arg){arg.watch(function(v) {
				var arg2 = arg.__do(), b
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
				unmountAll(a)
				a.parentNode.replaceChild(b, a)
				a = b
				mountAll(a)
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
			var cache = arg.get()
			let z = text(cache);
			element.appendChild(z);

			// Update bind
			if (arg.path) {
				(function(cache){es.on(arg.path, function(e, v) {
					if (v === cache) return false
					radiMutate(() => {
						z.textContent = v;
					});
					cache = v
				})})(cache)
			}
			// arg.watch((a) => {
			// 	console.warn('Change received', arg.path, arg, arg.prop)
			// 	radiMutate(() => {
			// 		z.textContent = a;
			// 	});
			// });
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
		// var obs = (m.length > 0) ? m.join('__ob__,') + '__ob__' : '';
		var obs = []
		for (var i = 0; i < m.length; i++) {
			var temp = m[i].split('.')
			if (temp.length > 1) {
				var last = temp.splice(-1)[0]
				obs.push('[' + temp + ', "' + last + '"]')
			}
		}
		var obs = obs.join(',');
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
	var out = (comp instanceof Component) ? comp.__radi().$render() : comp;
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
	var cache = data.source[data.prop]

	if (isArray(cache)) {
		for (var i = 0; i < cache.length; i++) {
			// cache[i+'__ob__'].watch((v) => {})
			fragment.appendChild(
				act.call(SELF, cache[i], i)
			)
		}
	} else {
		var i = 0
		for (var key in cache) {
			// cache[i+'__ob__'].watch((v) => {})
			fragment.appendChild(
				act.call(SELF, cache[key], key, i)
			)
			i++
		}
	}

	link = fragment.lastChild;

	var w = function(a, b) {
		if (a > 0) {
			var start = b.length - a
			for (var i = start; i < b.length; i++) {
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

	// var cache = data.get()
	if (data.path) {
		var len = cache.length
		es.on(data.path, function(e, v) {
			w(v.length - len, v)
			len = v.length
		})
	}

	// if (data.watch) data.watch(w)
	// if (data.get && data.get()._r_get) data.get()._r_get(w)

	return fragment;
}


function NW(source, prop) {
  this.path = source.__path + '.' + prop;
  this.get = () => (source[prop]);
  this.source = source;
  this.prop = prop;
	var path = this.path;
	this.watch = function watch (c) {
		var cache = source[prop]
		if (path) {
			es.on(path, function(e) {
				if (source[prop] === cache) return false
				c(source[prop], cache)
				cache = source[prop]
			})
		}
	}
}

export const link = function (fn, watch, txt) {
	var args = { s: null }, SELF = this, n, f = fn.bind(this);

	if (txt.length === 1 && fn.toString()
				.replace(/(function \(\)\{ return |\(|\)|\; \})/g, '')
				.trim() === txt[0]) {
		return new NW(watch[0][0], watch[0][1])
	}

	for (var i = 0; i < watch.length; i++) {
		var item = watch[i][0][watch[i][1]];
		if (isWatchable(item)) {
			n = true;
			watch[i].watch(function () {
				args.s = f(SELF);
			});
		}
	}

	args.s = f(SELF);

	if (!n) return args.s;
	return new NW(args, 's');
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

export const freeze = () => { frozenState = true }
export const unfreeze = () => {
	frozenState = false

	for (var ii = 0; ii < activeComponents.length; ii++) {
		if (typeof activeComponents[ii].onMount === 'function') {
			activeComponents[ii].onMount.call(activeComponents[ii])
		}
	}
}
