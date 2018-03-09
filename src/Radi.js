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

export default class Radi {
  constructor(o) {
    this.__path = 'this';

    const SELF = this;

    const dsc = Object.getOwnPropertyDescriptor;

    // apply mixins
    for (let i in o.$mixins) {
      if (typeof SELF[i] === 'undefined') {
        SELF[i] = o.$mixins[i];
      }
    }

    Object.defineProperties(SELF, {
      $mixins: {
        value: o.$mixins,
      },
      $mixins_keys: {
        value: new RegExp(`^this\\.(${
          Object.keys(o.$mixins)
            .join('|')
            .replace(/\$/g, '\\$')
            .replace(/\./g, '\\.')
        })`),
      },
      $e: {
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
            let list = SELF.$e.get(path);
            let len = list.length;
            for (let i = 0; i < len; i++) {
              list[i](path, r);
            }
          },
        },
      },
    });

    for (let key in o.state) {
      if (typeof SELF[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write state for reserved variable \`${i}\``);
      }

      SELF[key] = o.state[key];
    }

    for (let key in o.props) {
      if (typeof SELF[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write prop for reserved variable \`${i}\``);
      }

      const prop = o.props[key];

      if (isWatchable(prop)) {
        SELF[key] = prop.get();

        if (prop.parent) {
          prop.parent().$e.on(prop.path, (e, a) => {
            SELF[key] = a;
          });
        }
      } else {
        SELF[key] = prop;
      }
    }

    this.populate(this, 'this');

    for (let key in o.actions) {
      if (typeof SELF[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write action for reserved variable \`${
          i
        }\``);
      }

      SELF[key] = () => {
        if (GLOBALS.FROZEN_STATE) return null;
        return o.actions[key].apply(SELF, arguments);
      };
    }

    Object.defineProperties(SELF, {
      $id: {
        value: GLOBALS.IDS++,
      },
      $name: {
        value: o.name,
      },
      $state: {
        value: o.state || {},
      },
      $props: {
        value: o.props || {},
      },
      $actions: {
        value: o.actions || {},
      },
      $html: {
        value: document.createDocumentFragment(),
      },
      $parent: {
        value: null,
      },
      $view: {
        value: new Function('r', 'list', 'll', 'cond', `return ${o.$view}`)(
          r.bind(this),
          list.bind(this),
          ll.bind(this),
          cond.bind(this),
        )(),
      },
    });

    Object.defineProperties(SELF, {
      $link: {
        value: SELF.$view(),
      },
    });

    this.$html.appendChild(this.$link);

    this.$html.destroy = () => {
      const oldRootElem = this.$link.parentElement;
      const newRootElem = oldRootElem.cloneNode(false);
      oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
      this.unmount();
      oldRootElem.parentNode.removeChild(oldRootElem);
    };

    this.$link.unmount = this.unmount.bind(this);
    this.$link.mount = this.mount.bind(this);
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
        this.$e.emit(`${path}.${ii}`, to[ii]);
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
            SELF.$e.emit(path, oldval);
            if (typeof prev === 'function') prev(newval);
            return ret;
          } else if (typeof newval === 'object') {
            oldval = clone(newval);
            this.populate(oldval, path);
            SELF.$e.emit(path, oldval);
          } else {
            oldval = newval;
            this.populate(oldval, path);
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
    SELF.mount();
    return SELF.$html;
  }
}
