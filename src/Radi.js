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
import { list, ll, cond } from './index';

export class EventService {
  constructor(radiInstance) {
    this.radiInstance = radiInstance;
    this.WATCH = {};
  }

  get(path) {
    return this.WATCH[path] || (this.WATCH[path] = []);
  }

  on(path, callback) {
    if (GLOBALS.FROZEN_STATE) return null;
    return this.get(path).push(callback);
  }

  emit(path, r) {
    if (GLOBALS.FROZEN_STATE) return null;
    const list = this.get(path);
    list.forEach(callback => callback(path, r));
  }
}

export class PopulateService {
  constructor(radiInstance, to, path) {
    this.radiInstance = radiInstance;
    this.to = to;
    this.path = path;
  }

  populate() {
    if (typeof this.to !== 'object' || !this.to) return false;

    for (let key in this.to) {
      const fullPath = `${this.path}.${key}`;
      const isMixin = this.radiInstance.isMixin(fullPath);
      if (this.shouldPopulateKey(key)) {
        if (typeof this.to[key] === 'object') {
          this.populate(this.to[key], fullPath);
        }
        this.initWatcherForKey(key);
        this.emitEventForKey(key);
        continue;
      }

      if (isMixin) {
        this.initWatcherForKey(key);
      }
    }

    return this.ensurePath();
  }

  shouldPopulateKey(key) {
    return (
      this.to.hasOwnProperty(key) &&
      !Object.getOwnPropertyDescriptor(this.to, key).set
    );
  }

  initWatcherForKey(key) {
    this.radiInstance.watcher(this.to, key, this.path.concat('.').concat(key));
  }

  emitEventForKey(key) {
    this.radiInstance.$eventService.emit(`${this.path}.${key}`, this.to[key]);
  }

  ensurePath() {
    if (typeof this.to.__path === 'undefined') {
      Object.defineProperty(this.to, '__path', { value: this.path });
    }
    return this.to;
  }
}

export default class Radi {
  constructor(o) {
    this.__path = 'this';

    this.addNonEnumerableProperties({
      $mixins: o.$mixins,
      $mixins_keys: this.getMixinsKeys(o.$mixins),
      $eventService: new EventService(this),
      $id: GLOBALS.IDS++,
      $name: o.name,
      $state: o.state || {},
      $props: o.props || {},
      $actions: o.actions || {},
      $html: document.createDocumentFragment(),
      $parent: null,
      $view: new Function('r', 'list', 'll', 'cond', `return ${o.$view}`)(
        r.bind(this),
        list.bind(this),
        ll.bind(this),
        cond.bind(this),
      )(),
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
          prop.parent().$eventService.on(prop.path, (e, a) => {
            this[key] = a;
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

  // TODO: Bring back multiple watcher sets
  watcher(target, prop, path) {
    let oldVal = target[prop];
    const prev =
      typeof Object.getOwnPropertyDescriptor(target, prop) !== 'undefined'
        ? Object.getOwnPropertyDescriptor(target, prop).set
        : null;
    const self = this;

    const setter = function (newVal) {
      if (oldVal === newVal) return false;

      const originalOldVal = oldVal;
      let result = newVal;

      if (Array.isArray(oldVal) && this && this.constructor === String) {
        result = Array.prototype[this].apply(oldVal, arguments);
      }

      oldVal = clone(newVal);

      if (
        Array.isArray(originalOldVal) &&
        (!this || this.constructor !== String)
      ) {
        arrayMods(oldval, setter);
      }

      new PopulateService(self, oldVal, path).populate();
      self.$eventService.emit(path, oldVal);

      if (typeof prev === 'function') prev(newVal);

      return result;
    };

    if (Array.isArray(oldVal)) arrayMods(oldVal, setter);

    if (delete target[prop]) {
      Object.defineProperty(target, prop, {
        get() {
          return oldVal;
        },
        set: setter,
        enumerable: true,
        configurable: true,
      });
    }
  }

  mount() {
    if (typeof this.$actions.onMount === 'function') {
      this.$actions.onMount.call(this);
    }
    GLOBALS.ACTIVE_COMPONENTS.push(this);
  }

  unmount() {
    if (typeof this.$actions.onDestroy === 'function') {
      this.$actions.onDestroy.call(this);
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
