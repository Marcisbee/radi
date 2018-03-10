import * as REGEX from './consts/REGEX';
import clone from './utilities/clone';
import arrayMods from './utilities/arrayMods';
import unmountAll from './utilities/unmountAll';
import mountAll from './utilities/mountAll';
import radiMutate from './utilities/radiMutate';
import r from './utilities/r';
import component from './utilities/component';
import Component from './utilities/ComponentClass';
import GLOBALS from './consts/GLOBALS';
import { isWatchable, EMPTY_NODE } from './index';
import List from './List';

export default class Radi {
  constructor(o) {
    this.__path = 'this';

    this.linkNum = 0;

    this.addNonEnumerableProperties({
      $mixins: o.$mixins,
      $mixins_keys: this.getMixinsKeys(o.$mixins),
      $id: GLOBALS.IDS++,
      $name: o.name,
      $state: o.state || {},
      $props: o.props || {},
      $actions: o.actions || {},
      $html: document.createDocumentFragment(),
      $parent: null,
      // Variables like state and props are actually stored here so that we can
      // have custom setters
      privateStore: {}
    });

    this.addNonEnumerableProperties({
      // TODO: REMOVE let _r = {r}; FIXME
/*      $view: new Function('r', 'list', 'll', 'cond', `let _r2 = { default: r }; return ${o.$view}`)(
        r.bind(this),
        this.list,
        this.ll,
        this.cond,
      ),*/
      $view: o.$view
    });

//    console.log(o.$view())

    for (let key in o.$mixins) {
      if (typeof this[key] === 'undefined') {
        this.addCustomField(key, o.$mixins[key]);
      }
    }

    for (let key in o.state) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write state for reserved variable \`${i}\``);
      }
      this.addCustomField(key, o.state[key]);
    }

    for (let key in o.props) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write prop for reserved variable \`${i}\``);
      }

      this.addCustomField(key, o.props[key]);
    }

    for (let key in o.actions) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write action for reserved variable \`${i}\``);
      }

      this.addCustomField(key, (...args) => {
        if (GLOBALS.FROZEN_STATE) return null;
        return o.actions[key].apply(this, args);
      });
    }

    this.addNonEnumerableProperties({
      $link: this.$view(this)
    });

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

  addCustomField(key, value) {
    this.privateStore[key] = {
      listeners: [],
      listen: listener => this.privateStore[key].listeners.push(listener),
      value
    };
    Object.defineProperty(this, key, {
      get: () => this.privateStore[key].value,
      set: (value) => {
        const item = this.privateStore[key];
        item.value = value;
        item.listeners.forEach(listener => listener.handleUpdate(value));
      },
      enumerable: true,
      configurable: true
    });
  }

  addListener(key, listener) {
    this.privateStore[key].listen(listener);
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

  list(data, act) {
    return new List(this, data, act).create();
  };
}
