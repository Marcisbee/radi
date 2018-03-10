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
import { isWatchable, list, ll, cond } from './index';
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
      $view: new Function('r', 'list', 'll', 'cond', `let _r = {r}; return ${o.$view}`)(
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
