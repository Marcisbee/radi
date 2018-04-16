/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
// -- we need those for..in loops for now!

import GLOBALS from '../consts/GLOBALS';
import generateId from '../utils/generateId';
import PrivateStore from './utils/PrivateStore';
import fuseDom from '../r/utils/fuseDom';
import clone from '../utils/clone';
import skipInProductionAndTest from '../utils/skipInProductionAndTest';

export default class Component {
  /**
   * @param {Node[]|*[]} [children]
   * @param {object} [o.props]
   */
  constructor(children, props) {
    this.addNonEnumerableProperties({
      $id: generateId(),
      $name: this.constructor.name,
      $config: (typeof this.config === 'function') ? this.config() : {
        listen: true,
      },
      $store: {},
      $events: {},
      $privateStore: new PrivateStore(),
    });

    this.on = (typeof this.on === 'function') ? this.on() : {};
    this.children = [];

    // Appends headless components
    this.copyObjToInstance(GLOBALS.HEADLESS_COMPONENTS, 'head');

    this.state = Object.assign(
      (typeof this.state === 'function') ? this.state() : {},
      props || {}
    );

    skipInProductionAndTest(() => Object.freeze(this.state));

    if (children) this.setChildren(children);
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    if (typeof this.view !== 'function') return '';
    const rendered = this.view();
    this.html = rendered;
    return rendered;
  }

  /**
   * @param {object} props
   * @returns {Component}
   */
  setProps(props) {
    this.setState(props);
    return this;
  }

  /**
   * @param {Node[]|*[]} children
   */
  setChildren(children) {
    this.children = children;
    this.setState();
    for (let i = 0; i < this.children.length; i++) {
      if (typeof this.children[i].when === 'function') {
        this.children[i].when('update', () => this.setState());
      }
    }
    return this;
  }

  /**
   * @private
   * @param {object} obj
   * @param {string} type
   */
  copyObjToInstance(obj, type) {
    for (const key in obj) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write for reserved variable \`${key}\``);
      }
      this[key] = obj[key];
      if (type === 'head') this[key].when('update', () => this.setState());
    }
  }

  /**
   * @private
   * @param {object} obj
   */
  addNonEnumerableProperties(obj) {
    for (const key in obj) {
      if (typeof this[key] !== 'undefined') continue;
      Object.defineProperty(this, key, {
        value: obj[key],
      });
    }
  }

  /**
   * @param {string} key
   * @param {Listener} listener
   */
  addListener(key, listener) {
    this.$privateStore.addListener(key, listener);
  }

  mount() {
    this.trigger('mount');
  }

  destroy() {
    this.trigger('destroy');
    if (this.html && this.html !== '') this.html.remove();
  }

  /**
   * @param {string} key
   * @param {function} fn
   */
  when(key, fn) {
    if (typeof this.$events[key] === 'undefined') this.$events[key] = [];
    this.$events[key].push(fn);
  }

  /**
   * @param {string} key
   * @param {*} value
   */
  trigger(key, value) {
    if (typeof this.on[key] === 'function') {
      this.on[key].call(this, value);
    }

    if (typeof this.$events[key] !== 'undefined') {
      for (const i in this.$events[key]) {
        this.$events[key][i].call(this, value);
      }
    }
  }

  /**
   * @param {object} newState
   */
  setState(newState) {
    if (typeof newState === 'object') {
      const oldstate = clone(this.state);
      this.state = Object.assign(oldstate, newState);

      // TODO: Enable Object.freeze only in development
      // disable for production
      skipInProductionAndTest(() => Object.freeze(this.state));

      if (this.$config.listen) {
        this.$privateStore.setState(newState);
      }
    } else {
      // console.error('[Radi.js] ERROR: Action did not return object to merge with state');
    }

    if (!this.$config.listen && typeof this.view === 'function' && this.html) {
      fuseDom(this.html, this.view());
    }
    this.trigger('update');
    return this.state;
  }

  /**
   * @returns {boolean}
   */
  static isComponent() {
    return true;
  }
}
