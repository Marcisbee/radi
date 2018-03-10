import * as REGEX from './consts/REGEX';
import clone from './utilities/clone';
import arrayMods from './utilities/arrayMods';
import unmountAll from './utilities/unmountAll';
import mountAll from './utilities/mountAll';
import radiMutate from './utilities/radiMutate';
import setStyle from './utilities/setStyle';
import r from './utilities/r';
import component from './utilities/component';
import Component from './utilities/ComponentClass';
import Condition from './Condition';
import Watchable from './Watchable';
import GLOBALS from './consts/GLOBALS';
import { isWatchable, EMPTY_NODE } from './index';
import EventService from './EventService';
import PopulateService from './PopulateService';

export default class Radi {
  constructor(o) {
    this.__path = 'this';

    this.addNonEnumerableProperties({
      $mixins: o.$mixins,
      $mixins_keys: this.getMixinsKeys(o.$mixins),
      $eventService: new EventService(),
      $id: GLOBALS.IDS++,
      $name: o.name,
      $state: o.state || {},
      $props: o.props || {},
      $actions: o.actions || {},
      $html: document.createDocumentFragment(),
      $parent: null,
    });

    this.addNonEnumerableProperties({
      // TODO: REMOVE let _r = {r}; FIXME
      $view: new Function('r', 'list', 'll', 'cond', `let _r2 = { default: r }; return ${o.$view}`)(
        r.bind(this),
        list.bind(this),
        ll.bind(this),
        cond.bind(this),
      ),
    });

    this.addNonEnumerableProperties({
      $link: this.$view()
    });

    for (let key in o.$mixins) {
      if (typeof this[key] === 'undefined') {
        this[key] = o.$mixins[key];
      }
    }

    for (let key in o.state) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write state for reserved variable \`${i}\``);
      }
      this[key] = o.state[key];
    }

    for (let key in o.props) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write prop for reserved variable \`${i}\``);
      }

      const prop = o.props[key];

      if (isWatchable(prop)) {
        this[key] = prop.get();

        if (prop.parent) {
          prop.parent().$eventService.on(prop.path, (path, value) => {
            this[key] = value;
          });
        }
      } else {
        this[key] = prop;
      }
    }

    new PopulateService(this, this, 'this').populate();

    for (let key in o.actions) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write action for reserved variable \`${i}\``);
      }

      this[key] = (...args) => {
        if (GLOBALS.FROZEN_STATE) return null;
        return o.actions[key].apply(this, args);
      };
    }

    this.$html.appendChild(this.$link);
    this.$html.destroy = () => this.destroyHtml();

    this.$link.unmount = this.unmount.bind(this);
    this.$link.mount = this.mount.bind(this);
  }

  addNonEnumerableProperties(object) {
    for (let key in object) {
      Object.defineProperty(this, key, {
        value: object[key]
      });
    }
  }

  destroyHtml() {
    const oldRootElem = this.$link.parentElement;
    const newRootElem = oldRootElem.cloneNode(false);
    oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
    this.unmount();
    oldRootElem.parentNode.removeChild(oldRootElem);
  }

  getMixinsKeys(mixins) {
    return new RegExp(`^this\\.(${
      Object.keys(mixins)
        .join('|')
        .replace(/\$/g, '\\$')
        .replace(/\./g, '\\.')
    })`);
  }

  isMixin(path) {
    return this.$mixins_keys.test(path);
  }

  mount() {
    if (typeof this.$actions.onMount === 'function') {
      this.$actions.onMount(this);
    }
    GLOBALS.ACTIVE_COMPONENTS.push(this);
  }

  unmount() {
    if (typeof this.$actions.onDestroy === 'function') {
      this.$actions.onDestroy(this);
    }

    for (let i = 0; i < GLOBALS.ACTIVE_COMPONENTS.length; i++) {
      if (GLOBALS.ACTIVE_COMPONENTS[i].$id === this.$id) {
        GLOBALS.ACTIVE_COMPONENTS.splice(i, 1);
        break;
      }
    }

    return this.$link;
  }

  $render() {
    this.mount();
    return this.$html;
  }
}


export function ll(fn, watch, c) {
  return watch ? link(this, fn, watch, c.split(',')) : fn;
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
  linkNum++;

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
