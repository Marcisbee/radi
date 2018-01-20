(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.radi = {})));
}(this, (function (exports) { 'use strict';


  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  var FIND_L = /\bl\(/g;

  var RL = '('.charCodeAt(0);
  var RR = ')'.charCodeAt(0);
  var HASH = '#'.charCodeAt(0);
  var DOT = '.'.charCodeAt(0);

  var TAGNAME = 0;
  var ID = 1;
  var CLASSNAME = 2;

  function deepClone2(obj) {
    var i, ret, ret2;
    if (typeof obj === "object") {
      if (obj === null) return obj;
      if (Object.prototype.toString.call(obj) === "[object Array]") {
        ret = [];
        for (i = 0; i < obj.length; i++) {
          if (typeof obj[i] === "object") {
            ret2 = deepClone2(obj[i]);
          } else {
            ret2 = obj[i];
          }
          ret.push(ret2);
        }
      } else {
        ret = {};
        for (i in obj) {
          if (obj.hasOwnProperty(i)) {
            if (typeof(obj[i] === "object")) {
              ret2 = deepClone2(obj[i]);
            } else {
              ret2 = obj[i];
            }
            ret[i] = ret2;
          }
        }
      }
    } else {
      ret = obj;
    }

    return ret;
  }

  Object.defineProperties(Object, {
    // extend: {
    //   configurable: true,
    //   enumerable: false,
    //   value: function extend(what, wit) {
    //     if (!wit) return what;
    //     const extObj = (Array.isArray(wit)) ? [] : {}, witKeys = Object.keys(wit);
    //
    //     for (var i = 0; i < witKeys.length; i++) {
    //       const key = witKeys[i];
    //       const end = wit[key];
    //       extObj[key] = (end && (end.constructor === Object || end.constructor === Array)) ? Object.clone(end) : end;
    //     }
    //
    //     return extObj;
    //   },
    //   writable: true
    // },
    // clone: {
    //   configurable: true,
    //   enumerable: false,
    //   value: function clone(obj) {
    // 		return Object.extend((Array.isArray(obj)) ? [] : {}, obj);
    //   },
    //   writable: true
    // },
    relocate: {
      configurable: true,
      enumerable: false,
      value: function relocate(what, wit) {
        const witKeys = Object.keys(wit);

        for (var key in wit) {
          const end = wit[key];
          if (end && typeof end === 'object' && what.__radi !== true) {
            Object.relocate(what[key], end);
          } else {
            what[key] = end;
          }
        }
        // for (var i = 0; i < witKeys.length; i++) {
        //   const key = witKeys[i];
        //   const end = wit[key];
        //   if (end && typeof end === 'object' && what.__radi !== true) {
        //     Object.relocate(what[key], end);
        //   } else {
        //     what[key] = end;
        //   }
        // }

        return true;
      },
      writable: true
    }
  });

  var dsc = Object.getOwnPropertyDescriptor;

  var watcher = function watcher(targ, prop, handler) {
    var oldval = targ[prop],
      prev = (typeof dsc(targ, prop) !== 'undefined') ? dsc(targ, prop).set : null,
      setter = function (newval) {
        if (oldval !== newval) {
          oldval = newval;
          if (typeof prev === 'function') prev(newval);
          handler.call(targ, prop, oldval, newval);
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
          temp.push(deepClone2(this[i]));
          // temp.push(Object.clone(this[i]));
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

        Object.relocate(oldVal, newVal);

        dt[key].trigger(newVal.length-o, oldVal);
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperty(obj, key + '__ob__', {
      value: dt[key],
      configurable: true
    });

    Object.defineProperties(obj[key], {
      __radi: { value: true },
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
        Object.relocate(oldVal, newVal);
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperties(obj[key], {
      __radi: { value: true },
    });
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
          },
          data: {
            value: function() {
              return state[i];
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
    } else
    if (isWatchable(state[i])) {
      dt[i] = state[i];
    } else {
      dt[i] = watchable(state, i);
    }
  }

  function populate(dt, state) {
    for (var i in state) {
      if (!isWatchable(state[i])) {
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

    Object.defineProperty(data, prop + '__ob__', {
      value: this,
      configurable: true
    });

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
          return next;
        });
      };
      return applied;
    };

    this.get = function get () {
      return temp[prop];
    };
  };


  var ids = 0;

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

      var data = {};
      populate(data, SELF);

      for (var k in actions) {
        if (typeof SELF[k] === 'undefined') {
          const act = actions[k];
          SELF[k] = function () { return act.apply(SELF, arguments) };

          (function(SELF, k) {
            Object.defineProperty(SELF[k], 'props', {
              value() {
                var args = arguments;
                return function () { return SELF[k].apply(SELF, args, arguments) }
              }
            });
          })(SELF, k)
        } else {
          throw new Error('[Radi.js] Error: Trying to write action for reserved variable `' + k + '`');
        }
      }

      SELF.$id = this.$id;
      SELF.$state = state;
      SELF.$props = props;
      SELF.$actions = actions;
      SELF.$data = data;

      this.$html = document.createDocumentFragment();

      this.$view = new Function(
        'r',
        'list',
        'l',
        // 'return ' + output
        'return ' + o.$view
      )(
        r.bind(SELF),
        list.bind(SELF),
        l.bind(SELF),
      );

      // console.log(this.$view);

      this.$link = this.$view.apply(SELF);

      if (this.$link instanceof Component || Array.isArray(this.$link)) {
        this.$link = r.call(SELF, null, this.$link);
      }
      this.$html.appendChild(this.$link);

      this.mount = function () {
        if (typeof actions.onMount === 'function') {
          actions.onMount.call(SELF)
        }
      };

      this.unmount = function () {
        if (typeof actions.onDestroy === 'function') {
          actions.onDestroy.call(SELF)
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

  var r = function (query) {
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

  var component = function (o) {
    var fn = o.view.toString().replace(STRIP_COMMENTS, '')
    var match = FIND_L.exec(fn);
    var output = [];
    var cursor = 0;

    while (match !== null) {
      var n = match.index;
      var all = match.input;

      const len = all.length;
      var _l = 1, _r = 0;
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
      state: deepClone2(o.state),
      // state: Object.clone(o.state),
      props: deepClone2(o.props),
      // props: Object.clone(o.props),
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

  var mount = function (comp, id) {
    if (comp instanceof Component) {
      document.getElementById(id).appendChild( comp.__radi().out );
    } else {
      document.getElementById(id).appendChild( comp );
    }
  }

  var emptyNode = text('');

  var list = function (data, act) {
    if (!data) return '';
    var SELF = this;

    var link, fragment = document.createDocumentFragment(), toplink = emptyNode.cloneNode();

    fragment.appendChild(toplink);

    var ret = [];
    for (var i = 0; i < data.length; i++) {
      fragment.appendChild(
        act.call(SELF, data.data()[i], i)
      );
    }
    link = fragment.lastChild;

    data.watch(function(a, b) {
      if (a > 0) {
        var start = b.length - a;
        for (var i = start; i < b.length; i++) {
          popu(this, b, i);
          fragment.appendChild(
            act.call(SELF, data.data()[i], i)
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
    });

    return fragment;
  }

  var link = function (fn, watch, txt) {
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

  var condition = function (a, e) {
    var repl = emptyNode.cloneNode();
    var temp = e;
    var element;

    if (isWatchable(a)) {
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

  var l = function (f, w, c) {
    if (!w) {
      return f;
    } else {
      return link.call(this, f, w, c.split(','));
    }
  }

  exports.r = r;
  exports.l = l;
  exports.list = list;
  exports.link = link;
  exports.text = text;
  exports.mount = mount;
  exports.condition = condition;
  exports.component = component;

  Object.defineProperty(exports, '__esModule', { value: true });
})));
