/* eslint-disable no-param-reassign */

import * as REGEX from './consts/REGEX';
import { clone } from './utilities/clone';
import { arrayMods } from './utilities/arrayMods';
import { unmountAll } from './utilities/unmountAll';
import { mountAll } from './utilities/mountAll';
import { radiMutate } from './utilities/radiMutate';
import { r } from './utilities/r';
import { component } from './utilities/component';
import { Component } from './utilities/ComponentClass';
import { GLOBALS } from './consts/GLOBALS';
import Radi from './Radi';
import Condition from './Condition';
import Watchable from './Watchable';
import { register } from './utilities/register';

export const isString = a => typeof a === 'string';

export const isNumber = a => typeof a === 'number';

export const isFunction = a => typeof a === 'function';

export const isNode = a => !!(a && a.nodeType);

export const isWatchable = a => a && a instanceof Watchable;

export const isCondition = a => a && a instanceof Condition;

export const isComponent = a => !!(a && a.__radi);

export const getEl = (parent) =>
  (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el);

export const text = str => document.createTextNode(str);

export const mount = (component, id) => {
  const container = isString(id) ? document.getElementById(id) : id;
  const rendered =
    component instanceof Component ? component.__radi().$render() : component;
  container.appendChild(rendered);
  return rendered;
};

export const EMPTY_NODE = text('');

export const list = (data, act) => {
  if (!data) return '';
  const SELF = this;

  let link;
  const fragment = document.createDocumentFragment();
  const toplink = EMPTY_NODE.cloneNode();

  fragment.appendChild(toplink);

  const cache = data.source[data.prop] || [];
  const cacheLen = cache.length || 0;

  if (Array.isArray(cache)) {
    for (let i = 0; i < cacheLen; i++) {
      fragment.appendChild(act.call(SELF, cache[i], i));
    }
  } else {
    let i = 0;
    for (const key in cache) {
      fragment.appendChild(act.call(SELF, cache[key], key, i));
      i++;
    }
  }

  link = fragment.lastChild;

  const w = (a, b) => {
    if (a === 0) return;
    if (a > 0) {
      const len = b.length;
      const start = len - a;
      for (let i = start; i < len; i++) {
        fragment.appendChild(act.call(SELF, b[i], i));
      }
      const temp = fragment.lastChild;
      link.parentElement.insertBefore(fragment, link.nextSibling);
      link = temp;
      return;
    }
    for (let i = 0; i < Math.abs(a); i++) {
      const templink = link.previousSibling;
      link.parentElement.removeChild(link);
      link = templink;
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

export const set = (path, source, value) => {
  if (typeof path === 'string') path = path.split('.');
  path.shift();
  const prop = path.splice(-1);
  let shallowSource = source;
  for (let pathPart of path) {
    shallowSource = shallowSource[pathPart];
  }
  return (shallowSource[prop] = value);
}

let linkNum = 0;

export const link = (radiInstance, fn, watch, txt) => {
  const args = {
    s: null, a: [], t: [], f: fn.toString(),
  };

  if (
    txt.length === 1 &&
    fn
      .toString()
      .replace(/(function \(\)\{ return |\(|\)|\; \})/g, '')
      .trim() === txt[0]
  ) {
    return new Watchable(watch[0][0], watch[0][1], () => radiInstance);
  }

  const len = watch.length;

  args.s = fn.call(radiInstance);
  args.a = new Array(len);
  args.t = new Array(len);
  args.__path = `$link-${linkNum}`;
  linkNum += 1;

  for (let i = 0; i < len; i++) {
    const radiInstance = watch[i][0];
    const field = watch[i][1];
    args.a[i] = radiInstance[field];
    args.t[i] = `$rdi[${i}]`;
    args.f = args.f.replace(txt[i], args.t[i]);

    const path = `${radiInstance.__path}.${field}`;
    const p = `${args.__path}.s`;

    radiInstance.$eventService.on(path, (path, value) => {
      args.a[i] = value;
      const cache = args.f.call(radiInstance, args.a);

      if (args.s !== cache) {
        args.s = cache;
        radiInstance.$eventService.emit(p, args.s);
      }
    });
  }

  args.f = new Function('$rdi', 'return ' + args.f + '();')

  if (len <= 0) return args.s;
  return new Watchable(args, 's', () => radiInstance);
};

export function cond(a, e) {
  return new Condition(a, e, this);
}

export function ll(fn, watch, c) {
  return watch ? link(this, fn, watch, c.split(',')) : fn;
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
        GLOBALS.ACTIVE_COMPONENTS[ii].onMount(GLOBALS.ACTIVE_COMPONENTS[ii]);
      }
    }
  },
};

window.$Radi = _Radi;

/**
 * afterAppendChild
 * @param {Condition} condition
 * @param {any} id
 * @param {any} a
 */
export const afterAppendChild = (condition, id, a) => {
  condition.watch(() => {
    const arg2 = condition.__do();

    if (id === arg2.id) return false;

    let b = null;
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
