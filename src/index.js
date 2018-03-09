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
import Radi from './Radi';
import Condition from './Condition';

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

export const emptyNode = text('');

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
    SELF.$eventService.on(cache.__path, (e, v) => {
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

export const link = (fn, watch, txt) => {
  const args = {
    s: null, a: [], t: [], f: fn.toString(),
  };
  const SELF = this;

  if (
    txt.length === 1 &&
    fn
      .toString()
      .replace(/(function \(\)\{ return |\(|\)|\; \})/g, '')
      .trim() === txt[0]
  ) {
    return new NW(watch[0][0], watch[0][1], () => SELF);
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

    (function iife(path, scopedArgs, p, j) {
      SELF.$eventService.on(path, (e, v) => {
        scopedArgs.a[j] = v;
        const cache = scopedArgs.f.call(SELF, scopedArgs.a);

        if (scopedArgs.s !== cache) {
          scopedArgs.s = cache;
          SELF.$eventService.emit(p, scopedArgs.s);
        }
      });
    }(`${watch[i][0].__path}.${watch[i][1]}`, args, `${args.__path}.s`, i));
  }

  args.f = () => args.f();

  if (len <= 0) return args.s;
  return new NW(args, 's', (() => SELF));
};

export function cond(a, e) {
  return new Condition(a, e, this);
}

export const ll = (f, w, c) =>
  w ? link.call(this, f, w, c.split(',')) : f;

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

export const register = (Component) => {
  const component = new Component();
  const name = component.o.name;

  if (!name) {
    console.warn('[Radi.js] Warn: Cannot register component without name');
    return;
  }

  if (typeof GLOBALS.REGISTERED[name] !== 'undefined') {
    console.warn(`[Radi.js] Warn: Component with name '${name}' beeing replaced`);
  }

  GLOBALS.REGISTERED[name] = Component;
};

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
        self.$eventService.emit(arg2.path, el.value);
      };
      // Update bind
      (function (cache, arg1, arg2) {
        self.$eventService.on(arg2.path, (e, v) => {
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
          self.$eventService.on(arg2.path, (e, v) => {
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
  self.$eventService.on(arg.path, updateBundInnerFn(cache, z, element));
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
