/* eslint-disable no-param-reassign */

import * as REGEX from './consts/REGEX';
import { clone } from './utilities/clone';
import { arrayMods } from './utilities/arrayMods';
import { unmountAll } from './utilities/unmountAll';
import { mountAll } from './utilities/mountAll';
import { radiMutate } from './utilities/radiMutate';
import { setStyle } from './utilities/setStyle';
import { r } from './utilities/r';
import { component } from './utilities/component';
import { Component } from './utilities/ComponentClass';
import { GLOBALS } from './consts/GLOBALS';

export function isString(a) {
  return typeof a === 'string';
}

export function isNumber(a) {
  return typeof a === 'number';
}

export function isFunction(a) {
  return typeof a === 'function';
}

export function isNode(a) {
  return a && a.nodeType;
}

export function isWatchable(a) {
  return a && a instanceof NW;
}

export function isCondition(a) {
  return a && a instanceof Condition;
}

export function isComponent(a) {
  return a && a.__radi;
}


export function getEl(parent) {
  return (
    (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el)
  );
}

export function text(str) {
  return document.createTextNode(str);
}

export const mount = (comp, id) => {
  const where = id.constructor === String ? document.getElementById(id) : id;
  const out = comp instanceof Component ? comp.__radi().$render() : comp;
  where.appendChild(out);
  return out;
};

const emptyNode = text('');

export const list = (data, act) => {
  if (!data) return '';
  const SELF = this;

  let link;
  const fragment = document.createDocumentFragment();
  const toplink = emptyNode.cloneNode();

  fragment.appendChild(toplink);

  const cache = data.source[data.prop] || [];
  const cacheLen = cache.length || 0;

  if (Array.isArray(cache)) {
    for (let i = 0; i < cacheLen; i++) {
      fragment.appendChild(act.call(SELF, cache[i], i));
    }
  } else {
    let i = 0;
    for (const key in cache) { // eslint-disable-line
      fragment.appendChild(act.call(SELF, cache[key], key, i));
      i++;
    }
  }

  link = fragment.lastChild;

  const w = (a, b) => {
    if (a > 0) {
      const len = b.length;
      const start = len - a;
      for (let i = start; i < len; i++) {
        fragment.appendChild(act.call(SELF, b[i], i));
      }
      const temp = fragment.lastChild;
      link.parentElement.insertBefore(fragment, link.nextSibling);
      link = temp;
    } else if (a < 0) {
      for (let i = 0; i < Math.abs(a); i++) {
        const templink = link.previousSibling;
        link.parentElement.removeChild(link);
        link = templink;
      }
    }
  };

  if (cache.__path) {
    let len = cacheLen;
    SELF.$e.on(cache.__path, (e, v) => {
      w(v.length - len, v);
      len = v.length;
    });
  }

  return fragment;
};

export function set(path, source, value) {
  if (typeof path === 'string') path = path.split('.');
  path.shift();
  const prop = path.splice(-1);
  for (let i = 0; i < path.length; i++) {
    source = source[path[i]];
  }
  return (source[prop] = value);
}

export function NW(source, prop, parent) {
  this.path = `${source.__path}.${prop}`;
  this.get = () => source[prop];
  this.set = value => set(this.path.split('.'), parent(), value);
  this.source = source;
  this.prop = prop;
  this.parent = parent;
}

let linkNum = 0;

export const link = function (fn, watch, txt) {
  let args = {
      s: null, a: [], t: [], f: fn.toString(),
    },
    SELF = this;

  if (
    txt.length === 1 &&
    fn
      .toString()
      .replace(/(function \(\)\{ return |\(|\)|\; \})/g, '')
      .trim() === txt[0]
  ) {
    return new NW(watch[0][0], watch[0][1], (() => SELF));
  }

  const len = watch.length;

  args.s = fn.call(this);
  args.a = new Array(len);
  args.t = new Array(len);
  args.__path = `$link-${linkNum}`;
  linkNum += 1;

  for (let i = 0; i < len; i++) {
    args.a[i] = watch[i][0][watch[i][1]];
    args.t[i] = `$rdi[${i}]`;
    args.f = args.f.replace(txt[i], args.t[i]);
    // args.f = args.f.replace(new RegExp(txt[i], 'g'), args.t[i]);
    (function (path, args, p, i) {
      SELF.$e.on(path, (e, v) => {
        args.a[i] = v;
        const cache = args.f.call(SELF, args.a);

        if (args.s !== cache) {
          args.s = cache;
          SELF.$e.emit(p, args.s);
        }
      });
    }(`${watch[i][0].__path}.${watch[i][1]}`, args, `${args.__path}.s`, i));
  }

  args.f = new Function('$rdi', `return ${args.f}();`);

  if (len <= 0) return args.s;
  return new NW(args, 's', (() => SELF));
};

export function cond(a, e) {
  return new Condition(a, e, this);
}

export function Condition(a, e, SELF) {
  this.cases = [{ a, e }];
  this.w = [];
  this.cache = [];
  this.els = emptyNode.cloneNode();

  if (isWatchable(a)) {
    this.w.push(a);
  }

  this.watch = function (cb) {
    for (const w in this.w) {
      (function (w) {
        SELF.$e.on(this.w[w].path, (e, v) => {
          cb(v);
        });
      }.call(this, w));
    }
  };

  this.__do = function () {
    const ret = { id: null };
    for (const c in this.cases) {
      const a = isWatchable(this.cases[c].a)
        ? this.cases[c].a.get()
        : this.cases[c].a;
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
  this.cases.push({ a, e });
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

export function ll(f, w, c) {
  return w ? link.call(this, f, w, c.split(',')) : f;
}

export const _Radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  l: f => f,
  cond,
  component,
  mount,
  freeze: () => {
    GLOBALS.FROZEN_STATE = true;
  },
  unfreeze: () => {
    GLOBALS.FROZEN_STATE = false;

    for (let ii = 0; ii < GLOBALS.ACTIVE_COMPONENTS.length; ii++) {
      if (typeof GLOBALS.ACTIVE_COMPONENTS[ii].onMount === 'function') {
        GLOBALS.ACTIVE_COMPONENTS[ii].onMount.call(GLOBALS.ACTIVE_COMPONENTS[ii]);
      }
    }
  },
};

window.$Radi = _Radi;

export function register(c) {
  const cmp = new c();
  const n = cmp.o.name;
  if (!n) {
    console.warn('[Radi.js] Warn: Cannot register component without name');
  } else {
    if (typeof GLOBALS.REGISTERED[n] !== 'undefined') {
      console.warn(`[Radi.js] Warn: Component with name '${n}' beeing replaced`);
    }
    GLOBALS.REGISTERED[n] = c;
  }
}

export function Radi(o) {
  const SELF = {
    __path: 'this',
  };

  // apply mixins
  for (var i in o.$mixins) {
    if (typeof SELF[i] === 'undefined') {
      SELF[i] = o.$mixins[i];
    }
  }

  Object.defineProperties(SELF, {
    $mixins: {
      enumerable: false,
      value: o.$mixins,
    },
    $mixins_keys: {
      enumerable: false,
      value: new RegExp(`^this\\.(${
        Object.keys(o.$mixins)
          .join('|')
          .replace(/\$/g, '\\$')
          .replace(/\./g, '\\.')
      })`),
    },
    $e: {
      enumerable: false,
      value: {
        WATCH: {},
        get(path) {
          return SELF.$e.WATCH[path] || (SELF.$e.WATCH[path] = []);
        },
        on(path, fn) {
          if (GLOBALS.FROZEN_STATE) return null;
          return SELF.$e.get(path).push(fn);
        },
        emit(path, r) {
          if (GLOBALS.FROZEN_STATE) return null;
          let list = SELF.$e.get(path),
            len = list.length;
          for (let i = 0; i < len; i++) {
            list[i](path, r);
          }
        },
      },
    },
  });

  function populate(to, path) {
    let ret;
    if (typeof to !== 'object' || !to) return false;
    ret =
      typeof to.__path === 'undefined'
        ? Object.defineProperty(to, '__path', { value: path })
        : false;
    for (const ii in to) {
      const isMixin = SELF.$mixins_keys.test(`${path}.${ii}`);
      if (
        to.hasOwnProperty(ii) &&
        !Object.getOwnPropertyDescriptor(to, ii).set
      ) {
        if (typeof to[ii] === 'object') populate(to[ii], `${path}.${ii}`);
        // Initiate watcher if not already watched
        watcher(to, ii, path.concat('.').concat(ii));
        // Trigger changes for this path
        SELF.$e.emit(`${path}.${ii}`, to[ii]);
      } else if (isMixin) {
        watcher(to, ii, path.concat('.').concat(ii));
      }
    }
    return ret;
  }

  // TODO: Bring back multiple watcher sets
  const dsc = Object.getOwnPropertyDescriptor;
  function watcher(targ, prop, path) {
    var oldval = targ[prop],
      prev =
        typeof dsc(targ, prop) !== 'undefined' ? dsc(targ, prop).set : null,
      setter = function (newval) {
        if (oldval !== newval) {
          if (Array.isArray(oldval)) {
            let ret;
            if (this && this.constructor === String) {
              ret = Array.prototype[this].apply(oldval, arguments);
            } else {
              oldval = newval;
              arrayMods(oldval, setter);
            }

            populate(oldval, path);
            SELF.$e.emit(path, oldval);
            if (typeof prev === 'function') prev(newval);
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
          if (typeof prev === 'function') prev(newval);
          return newval;
        }
        return false;
      };

    if (Array.isArray(oldval)) arrayMods(oldval, setter);

    if (delete targ[prop]) {
      Object.defineProperty(targ, prop, {
        get() {
          return oldval;
        },
        set: setter,
        enumerable: true,
        configurable: true,
      });
    }
  }

  for (var i in o.state) {
    if (typeof SELF[i] === 'undefined') {
      SELF[i] = o.state[i];
    } else {
      throw new Error(`[Radi.js] Err: Trying to write state for reserved variable \`${i}\``);
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
      throw new Error(`[Radi.js] Err: Trying to write prop for reserved variable \`${i}\``);
    }
  }

  populate(SELF, 'this');

  for (var i in o.actions) {
    if (typeof SELF[i] === 'undefined') {
      SELF[i] = function () {
        if (GLOBALS.FROZEN_STATE) return null;
        return o.actions[this].apply(SELF, arguments);
      }.bind(i);
    } else {
      throw new Error(`[Radi.js] Error: Trying to write action for reserved variable \`${
        i
      }\``);
    }
  }

  Object.defineProperties(SELF, {
    $id: {
      enumerable: false,
      value: GLOBALS.IDS++,
    },
    $name: {
      enumerable: false,
      value: o.name,
    },
    $state: {
      enumerable: false,
      value: o.state || {},
    },
    $props: {
      enumerable: false,
      value: o.props || {},
    },
    $actions: {
      enumerable: false,
      value: o.actions || {},
    },
    $html: {
      enumerable: false,
      value: document.createDocumentFragment(),
    },
    $parent: {
      enumerable: false,
      value: null,
    },
    $view: {
      enumerable: false,
      value: new Function('r', 'list', 'll', 'cond', `return ${o.$view}`)(
        r.bind(SELF),
        list.bind(SELF),
        ll.bind(SELF),
        cond.bind(SELF),
      ),
    },
    $render: {
      enumerable: false,
      value() {
        SELF.mount();
        return SELF.$html;
      },
    },
  });

  Object.defineProperties(SELF, {
    $link: {
      enumerable: false,
      value: SELF.$view(),
    },
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
    GLOBALS.ACTIVE_COMPONENTS.push(SELF);
  };

  SELF.unmount = function () {
    if (typeof SELF.$actions.onDestroy === 'function') {
      SELF.$actions.onDestroy.call(SELF);
    }
    for (let i = 0; i < GLOBALS.ACTIVE_COMPONENTS.length; i++) {
      if (GLOBALS.ACTIVE_COMPONENTS[i].$id === SELF.$id) {
        GLOBALS.ACTIVE_COMPONENTS.splice(i, 1);
        break;
      }
    }
    return SELF.$link;
  };

  SELF.$link.unmount = SELF.unmount.bind(SELF);
  SELF.$link.mount = SELF.mount.bind(SELF);

  return SELF;
}

export function setAttr(view, arg1, arg2) {
  const self = this;
  const el = getEl(view);

  if (arg2 !== undefined) {
    if (arg1 === 'style') {
      setStyle.call(this, el, arg2);
    } else if (arg1 === 'model' && isWatchable(arg2)) {
      var cache = arg2.get();
      el.value = cache;
      el.oninput = function () {
        arg2.set(el.value);
        cache = el.value;
        self.$e.emit(arg2.path, el.value);
      };
      // Update bind
      (function (cache, arg1, arg2) {
        self.$e.on(arg2.path, (e, v) => {
          if (v === cache) return false;
          radiMutate(
            () => {
              el.value = v;
            },
            el.key,
            'attr1',
          );
          cache = v;
        });
      }(cache, arg1, arg2));
    } else if (isFunction(arg2)) {
      el[arg1] = function (e) {
        arg2.call(self, e);
      };
    } else if (isWatchable(arg2)) {
      const temp = arg2.get();
      if (isFunction(temp)) {
        el[arg1] = function (e) {
          arg2.get().call(self, e);
        };
      } else {
        var cache = arg2.get();
        if (cache !== false) {
          if (arg1 === 'html') {
            el.innerHTML = cache;
          } else {
            el.setAttribute(arg1, cache);
          }
        }

        // Update bind
        (function (cache, arg1, arg2) {
          self.$e.on(arg2.path, (e, v) => {
            if (v === cache) return false;
            radiMutate(
              () => {
                if (v !== false) {
                  if (arg1 === 'html') {
                    el.innerHTML = v;
                  } else {
                    el.setAttribute(arg1, v);
                  }
                } else {
                  el.removeAttribute(arg1);
                }
              },
              el.key,
              'attr2',
            );
            cache = v;
          });
        }(cache, arg1, arg2));
      }
    } else if (cache !== false) {
      if (arg1 === 'html') {
        el.innerHTML = arg2;
      } else {
        el.setAttribute(arg1, arg2);
      }
    }
  } else {
    for (const key in arg1) {
      setAttr.call(this, el, key, arg1[key]);
    }
  }
}

export function radiArgs(element, args) {
  const self = this;

  args.forEach((arg, i) => {
    if (!arg) return;

    // support middleware
    if (isComponent(arg)) {
      element.appendChild(arg.__radi().$render());
    } else if (isCondition(arg)) {
      let arg2 = arg.__do(),
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
      afterAppendChild(arg, id, a);
    } else if (typeof arg === 'function') {
      arg.call(this, element);
    } else if (isString(arg) || isNumber(arg)) {
      element.appendChild(text(arg));
    } else if (isNode(getEl(arg))) {
      element.appendChild(arg);
    } else if (Array.isArray(arg)) {
      radiArgs.call(this, element, arg);
    } else if (isWatchable(arg)) {
      const cache = arg.get();
      const z = text(cache);
      element.appendChild(z);

      // Update bind
      updateBind(self, z, element)(cache, arg);
    } else if (typeof arg === 'object') {
      setAttr.call(this, element, arg);
    }
  });
}

export const afterAppendChild = (arg, id, a) => {
  arg.watch((v) => {
    const arg2 = arg.__do();
    let b = null;

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
};

export const updateBind = (self, z, element) => (cache, arg) => {
  self.$e.on(arg.path, updateBundInnerFn(cache, z, element));
};

// TODO: Rename and understand.
const updateBundInnerFn = (cache, z, element) => (e, v) => {
  if (v === cache) return false;

  cache = v;

  radiMutate(
    () => {
      z.textContent = v;
    },
    element.key,
    'text',
  );
};
