(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.radi = {})));
}(this, (function (exports) { 'use strict';

  var mapKeys = function (source, deep, baseKey, arrIndex) {
    var base = baseKey || '';
    var index = (arrIndex || 0) + 1;
    var deli = ['[\'', '\']'];

    var keysMap = base ? 't' + base : '';

    if (Array.isArray(source)) {
      keysMap += base ? ' = [];' : '';
    } else {
      var deli = ['.', ''];
      keysMap += base ? ' = {};' : '';
    }

    // Iterate over object keys
    for (var key in source) {
      if (!source.hasOwnProperty(key)) {
        continue;
      }

      var value = source[key];
      var path = base + deli[0] + key + deli[1]; // current key path

      if (deep && typeof value == 'object') {
        keysMap += mapKeys(value, deep, path, index);
      } else {
        keysMap += 't' + path + ' = s' + path + ';';
      }
    }

    // console.log(keysMap);

    return keysMap;
  }

  var deepReplace = function (obj1, obj2) {
    for (var key in obj2) {
      if (!obj2.hasOwnProperty(key)) continue;
      if (obj1[key] && typeof obj1[key] === 'object' && !obj1[key].__radi) {
        deepReplace(obj1[key], obj2[key]);
      } else {
        obj1[key] = obj2[key];
      }
    }
    return true;
  }

  var deepCreate = function (obj) {
    var newobj = {};
    if (typeof Object.assign != 'function') {
      Object.assign(newobj, obj);
    } else {
      for (var key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        if (obj[key] && typeof obj[key] === 'object' && !obj[key].__radi) {
          newobj[key] = deepCreate(obj[key]);
        } else {
          newobj[key] = obj[key];
        }
      }
    }
    return newobj;
  }


  var dsc = Object.getOwnPropertyDescriptor;

  var watcher = function watcher(targ, prop, handler) {
    var oldval = targ[prop],
      prev = (typeof dsc(targ, prop) !== 'undefined') ? dsc(targ, prop).set : null,
      setter = function (newval) {
        if (oldval !== newval) {
          if (typeof prev === 'function') prev(newval);
          handler.call(targ, prop, oldval, newval);
          oldval = newval;
        }
        else { return false }
      };

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


  var detector = function (f, tr) {
    return function () {
      var o = this.length;

      if (f === 'reverse' || f === 'splice') {
        var temp = [];
        for (var i = 0; i < this.length; i++) {
          temp.push(deepCreate(this[i]));
        }
        var out = Array.prototype[f].apply(temp, arguments);

        for (var i = 0; i < temp.length; i++) {
          this[i] = temp[i];
        }
        this.length = temp.length;

        if (f === 'splice') {
          var al = arguments.length - 2;
          var rl = out.length;
          tr(-(rl - al), this);
        } else {
          tr(this.length-o, this);
        }
      } else {
        var out = Array.prototype[f].apply(this, arguments);
        tr(this.length-o, this);
      }

      return out;
    }
  };

  var watchArray = function (dt, obj, key) {
    var oldVal = obj[key];

    Object.defineProperty(obj, key, {
      get: function () { return oldVal; },
      set: function (newVal) {
        var o = oldVal.length;

        deepReplace(oldVal, newVal);
        // console.log( new Function('src', FastClone._getKeyMap(newVal, true)) );

        dt[key].trigger(newVal.length-o, oldVal);
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperties(obj[key], {
      __radi: { value: true },
      // __clone: {
      //   writable: true,
      //   value: mapKeys(obj[key], false)
      // },
      // __clone: { value() {
        // mapKeys(obj, true)
        // var clonedArray = [];
        // if (obj.length) {
        //   var Clone = FastClone.factory(obj[0], true);
        //   for (var i = 0; i < obj.length; i++) {
        //     clonedArray.push(new Clone(obj[i]));
        //   }
        // }
        // return () => (clonedArray);
        // new Function('src', FastClone._getKeyMap(obj, true))
        // }
      // },
      push: { value: detector('push', dt[key].trigger) },
      splice: { value: detector('splice', dt[key].trigger) },
      pop: { value: detector('pop', dt[key].trigger) },
      reverse: { value: detector('reverse', dt[key].trigger) },
      shift: { value: detector('shift', dt[key].trigger) },
      unshift: { value: detector('unshift', dt[key].trigger) }
    });
  }

  var watchObject = function (obj, key) {
    var oldVal = obj[key];

    Object.defineProperty(obj, key, {
      get: function () { return oldVal; },
      set: function (newVal) {
        deepReplace(oldVal, newVal);
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperties(obj[key], {
      __radi: { value: true },
      // __clone: { value: FastClone._getKeyMap(obj[key], true) }
      // __clone: {
      //   writable: true,
      //   value: mapKeys(obj[key], false)
      // }
    });
  }


  var HASH = '#'.charCodeAt(0);
  var DOT = '.'.charCodeAt(0);

  var TAGNAME = 0;
  var ID = 1;
  var CLASSNAME = 2;

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

  function popu(dt, state, i) {
    if (state[i] && Array.isArray(state[i])) {
      dt[i] = [];
      (function (i) {
        var handler = function () {};
        Object.defineProperties(dt[i], {
          loop: {
            value: function(c) {
              return list(dt[i], c, state[i]);
            }
          },
          trigger: {
            value: function () { handler.apply(this, arguments); }
          },
          watch: {
            value: function(c) {
              handler = c;
            }
          }
        });
      })(i)
      if (!state[i].__radi)
        watchArray(dt, state, i);
      populate(dt[i], state[i]);
    } else
    if (state[i] && typeof state[i] === 'object') {
      dt[i] = {};
      if (!state[i].__radi)
        watchObject(state, i);
      populate(dt[i], state[i]);
    } else {
      dt[i] = watchable(state, i);
    }
  }

  function populate(dt, state) {
    for (var i in state) {
      if (!(state[i] instanceof Watchable)) {
        popu(dt, state, i);
      } else {
        dt[i] = state[i];
      }
    }
  }

  var watchable = function (data, prop) {
    return new Watchable(data, prop);
  };

  var Watchable = function Watchable (data, prop) {
    var temp = data;

    this.watch = function watch (c) {
      watcher(temp, prop, (p, prev, next) => {
        c(next);
        return next;
      });
    };

    this.prop = prop;
    this.data = function data () {
      return temp;
    };

    this.apply = function data (fn) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
      var applied = this;
      applied.watch = function watch (c) {
        watcher(temp, prop, (p, prev, next) => {
          c((next)[fn](args));
          // c(([fn]).apply(next, args));
          // c(next);
          return next;
        });
      };
      return applied;
      // var args = [], len = arguments.length - 1;
      // while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
      // console.log('apply', args);
    };

    this.get = function get () {
      return temp[prop];
    };
  };



  class Radi {
    constructor(o) {
      var state = o.state || {},
        props = o.props || {},
        actions = o.actions || {},
        view = o.view;

      // for (var a in actions) {
      //   (function (a, s) {
      //     Object.defineProperty(actions[a], '__radistate', {
      //       get: function() {
      //         return s;
      //       }
      //     });
      //     Object.defineProperty(actions[a], '__radiactions', {
      //       get: function() {
      //         return actions;
      //       }
      //     });
      //   })(a, state)
      // }

      this.data = state;

      for (var k in props) {
        if (typeof this.data[k] === 'undefined') {
          if (typeof props[k] === 'function') {
            this.data[k] = props[k]();
          } else {
            this.data[k] = props[k];
          }
        } else {
          throw new Error('[Radi.js] Error: Trying to write prop `' + k + '` when same key already exists in state');
        }
        // props[k] = p[k]
        //   || ( (typeof o.props[k] === 'function') ? o.props[k]() : o.props[k] );
      }

      this.props = props;

      this.actions = actions;
      this.state = {};

      populate(this.state, this.data);

      this.html = document.createDocumentFragment();

      this.link = view.call(this, this.state, actions, r.bind(this), link.bind(this));
      if (this.link instanceof Component || Array.isArray(this.link)) {
        this.link = r.call(this, null, this.link);
      }
      // this.link = view(this.data, actions);
      this.html.appendChild(this.link);

      this.mount = function () {
        if (typeof actions.onMount === 'function') {
          actions.onMount.call(actions, this.data)
        }
      };

      this.unmount = function () {
        if (typeof actions.onDestroy === 'function') {
          actions.onDestroy.call(actions, this.data)
        }
        return this.link;
      };
    }

    get remount() {
      this.mount();
      return this.link;
    }

    get out() {
      this.mount();
      return this.html;
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

    if (arg2 !== undefined && arg2 instanceof Watchable) {
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
      } else if (arg1 === 'model' && arg2 instanceof Watchable) {
        el.value = arg2.get();
        el['oninput'] = function () { arg2.data()[arg2.prop] = el.value };
        arg2.watch(function (a) {
          radiMutate(() => {
            el.value = a;
          });
        });
      } else if (isFunction(arg2)) {
        el[arg1] = function (e) { arg2.call(self.actions, self.data, e); };
      } else if (arg2 instanceof Watchable) {
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
  // var isComponent = function (a) { return a && a instanceof Radi; };
  // var isComponent = function (a) { return a && a instanceof Radi.constructor; };
  // var isComponent = function (a) { return a && a.__radi && a.__radi instanceof Radi.constructor; };
  var isComponent = function (a) { return a && a.__radi; };

  var text = function (str) { return document.createTextNode(str); };

  var radiArgs = function (element, args) {
    for (var i = 0; i < args.length; i++) {
      var arg = args[i];

      if (arg !== 0 && !arg) {
        continue;
      }

      // support middleware
      if (isComponent(arg)) {
        element.appendChild(arg.__radi().out);
      } else
      if (typeof arg === 'function') {
        arg.call(this, element);
      } else if (isString(arg) || isNumber(arg)) {
        element.appendChild(text(arg));
      } else if (isNode(getEl(arg))) {
        element.appendChild(arg);
      } else if (Array.isArray(arg)) {
        radiArgs.call(this, element, arg);
      } else if (arg instanceof Watchable) {
        let z = text(arg.get());
        element.appendChild(z);
        // Update bind
        arg.watch(function (a) {
          radiMutate(() => {
            // z.nodeValue = a;
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

  var r = function (query) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    var element;

    if (isString(query)) {
      element = memoizeHTML(query).cloneNode(false);
      // element = document.createElement(query).cloneNode(false);
    } else if (isNode(query)) {
      element = query.cloneNode(false);
    } else {
      element = document.createDocumentFragment();
      // throw new Error('[Radi.js] Error: At least one argument required');
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

  // var component = function (o) {
  //   return Component.bind(this, o);
  //   // return new Component(o);
  // };
  // class Component {
  //   constructor(o) {
  //     this.o = deepCreate(o);
  //     this.__radi = function() { return new Radi(this.o); };
  //   }
  //   props(p) {
  //     for (var k in p) {
  //       if (typeof this.o.props[k] === 'undefined') {
  //         console.warn('[Radi.js] Warn: Creating a prop `', k, '` that is not defined in component');
  //       }
  //       this.o.props[k] = p[k];
  //     }
  //     return this;
  //   }
  // }
  var component = function (o) {
    return Component.bind(this, o);
    // return new Component(o);
  };
  var Component = function Component (o) {
    this.o = deepCreate(o);
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
  // Component.extend = function (o) {
  //   return Component.bind(Component, o);
  // };

  // var component = function component (o) {
  //   console.log(o.props);
  //   var el = {};
  //   el.o = o;
  //   el.__radi = function() { return new Radi(el.o); };
  //   el.props = function (p) {
  //     for (var k in p) {
  //       if (typeof el.o.props[k] === 'undefined') {
  //         console.warn('[Radi.js] Warn: Creating a prop `', k, '` that is not defined in component');
  //       }
  //       el.o.props[k] = p[k];
  //     }
  //     return el;
  //   };
  //   return Component.bind(this, o);
  // }

  var mount = function (comp, id) {
    document.getElementById(id).appendChild( comp.__radi().out );
  }

  var list = function (data, act) {
    // if (typeof data === 'object' && data.watch) data = data.e;

    var link, fragment = document.createDocumentFragment(), toplink = text('');

    fragment.appendChild(toplink);

    var ret = [];
    for (var i = 0; i < data.length; i++) {
      fragment.appendChild(
        act(data[i], i)
      );
    }
    link = fragment.lastChild;



    data.watch(function(a, b) {
      if (a > 0) {
        var start = b.length - a;
        for (var i = start; i < b.length; i++) {
          popu(this, b, i);
          fragment.appendChild(
            act(this[i], i)
          );
        }
        var temp = fragment.lastChild;
        link.parentElement.insertBefore(fragment, link.nextSibling);
        link = temp;
        // b.__clone = mapKeys(b, false);
      } else
      if (a < 0) {
        for (var i = 0; i < Math.abs(a); i++) {
          var templink = link.previousSibling;
          link.parentElement.removeChild(link);
          link = templink;
        }
        // b.__clone = mapKeys(b, false);
      }
    });

    return fragment;
  }




  /**
  * Get the keys of the paramaters of a function.
  *
  * @param {function} method  Function to get parameter keys for
  * @return {array}
  */
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  var ARGUMENT_NAMES = /(?:^|,)\s*([^\s,=]+)/g;
  function getFunctionParameters ( func ) {
    var fnStr = func.replace(STRIP_COMMENTS, '');
    var argsList = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')'));
    var result = argsList.match( ARGUMENT_NAMES );

    if(result === null) {
      return null;
    } else {
      return result[0].replace(/[\s,]/g, '');
    }
  }

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  function inject(fn) {
    var fs = fn.toString();
    var arg = getFunctionParameters(fs);
    return fs.replace(STRIP_COMMENTS, '').match(new RegExp('(?:'+arg+'+[\\w$]*)(?:\\.[a-zA-Z_$]+[\\w$]*)+', 'g')).filter(onlyUnique);
    // return fs.replace(STRIP_COMMENTS, '').match(new RegExp('\\b(?:'+arg+'+?\\.)+\\S+\\b', 'g')).filter(onlyUnique);
  }


  var link = function (fn, state) {
    var args = { w: false, a: [], s: '' };
  	var watch = inject(fn);
  	var self = this;

  	for (var i = 0; i < watch.length; i++) {
  		var a1 = self.state[watch[i].replace('state.', '')];
  		if (a1 instanceof Watchable) {
        (function (args, i) {
          this.watch(function (v) {
  					// console.log(deState);
            // args.a[i] = v;
            window.requestAnimationFrame(() => {
  	          args.s = fn(self.data);
  					});
          });
        }).call(a1, args, i);
  		}
  	}

  	if (self) {
  		args.s = fn(self.data);
  	}

  	return watchable(args, 's');

  	// console.log(fn.prototype, fn);
  	// console.log(this, fn, watch);

    // for (var i = 0; i < arguments.length; i++) {
    //   var a1 = arguments[i];
    //   if (a1 instanceof Watchable) {
    //     args.w = true;
    //     (function (args, i) {
    //       this.watch(function (v) {
    //         args.a[i] = v;
    //         args.s = args.a.join('');
    //       });
    //     }).call(a1, args, i);
    //     args.a[i] = a1.get();
    //   } else {
    //     args.a[i] = a1;
    //   }
    // }
    // args.s = args.a.join('');
    // return (args.w) ? watchable(args, 's') : args.s;
  }

  var condition = function (a, e) {
    var repl = text('');
    var temp = e;
    var element;

    if (a instanceof Watchable) {
      element = (a.get()) ? temp : repl;
      a.watch((a) => {
        // radiMutate(() => {
          if (a) {
            if (isComponent(temp))
              repl.parentElement.replaceChild(temp.remount, repl);
            else
              repl.parentElement.replaceChild(temp, repl);
          } else {
            if (isComponent(temp))
              temp.link.parentElement.replaceChild(repl, temp.unmount());
            else {
              temp.parentElement.replaceChild(repl, temp);
            }
          }
        // });
      });
    } else {
      element = a && temp;
    }

    return element;
  }


  exports.r = r;
  exports.list = list;
  exports.link = link;
  exports.mount = mount;
  exports.condition = condition;
  exports.component = component;
  exports.text = text;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
