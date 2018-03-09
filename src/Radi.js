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
    this.WATCH = {};
    this.radiInstance = radiInstance;
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

export default class Radi {
  constructor(o) {
    this.__path = 'this';

    this.addNonEnumerableProperties({
      $mixins: o.$mixins,
      $mixins_keys: this.getMixinsKeys(o.$mixins),
      $e: new EventService(this),
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

    this.populate(this, 'this');

    for (let key in o.actions) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write action for reserved variable \`${i}\``);
      }

      this[key] = (...arguments) => {
        if (GLOBALS.FROZEN_STATE) return null;
        return o.actions[key].apply(this, arguments);
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

  populate(to, path) {
    if (typeof to !== 'object' || !to) return false;

    for (const ii in to) {
      const isMixin = this.$mixins_keys.test(`${path}.${ii}`);
      if (
        to.hasOwnProperty(ii) &&
        !Object.getOwnPropertyDescriptor(to, ii).set
      ) {
        if (typeof to[ii] === 'object') this.populate(to[ii], `${path}.${ii}`);
        // Initiate watcher if not already watched
        this.watcher(to, ii, path.concat('.').concat(ii));
        // Trigger changes for this path
        this.$eventService.emit(`${path}.${ii}`, to[ii]);
      } else if (isMixin) {
        this.watcher(to, ii, path.concat('.').concat(ii));
      }
    }

    return typeof to.__path === 'undefined'
      ? Object.defineProperty(to, '__path', { value: path })
      : false;
  }

  // TODO: Bring back multiple watcher sets
  watcher(targ, prop, path) {
    const dsc = Object.getOwnPropertyDescriptor;
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

            this.populate(oldval, path);
            this.$eventService.emit(path, oldval);
            if (typeof prev === 'function') prev(newval);
            return ret;
          } else if (typeof newval === 'object') {
            oldval = clone(newval);
            this.populate(oldval, path);
            this.$eventService.emit(path, oldval);
          } else {
            oldval = newval;
            this.populate(oldval, path);
            this.$eventService.emit(path, oldval);
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
