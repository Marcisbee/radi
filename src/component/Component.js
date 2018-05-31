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
      $events: {},
      $privateStore: new PrivateStore(),
    });

    this.on = (typeof this.on === 'function') ? this.on() : {};
    this.children = [];

    // Links headless components
    for (const key in GLOBALS.HEADLESS_COMPONENTS) {
      this[key].when('update', () => this.setState());
    }

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
  render(isSvg) {
    if (typeof this.view !== 'function') return '';
    let rendered = this.view();
    if (Array.isArray(rendered)) {
      for (let i = 0; i < rendered.length; i++) {
        if (typeof rendered[i].buildNode === 'function') {
          rendered[i] = rendered[i].buildNode(isSvg, 0);
        }
        rendered[i].destroy = this.destroy.bind(this);
      }
    } else {
      if (typeof rendered.buildNode === 'function') {
        rendered = rendered.buildNode(isSvg, 0);
      }
      rendered.destroy = this.destroy.bind(this);
    }

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
   * @param {number} depth
   */
  addListener(key, listener, depth) {
    this.$privateStore.addListener(key, listener, depth);
  }

  mount() {
    this.trigger('mount');
  }

  destroy() {
    this.trigger('destroy');
    this.$privateStore.removeListeners();
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
  trigger(key, ...args) {
    if (typeof this.on[key] === 'function') {
      this.on[key].call(this, ...args);
    }

    if (typeof this.$events[key] !== 'undefined') {
      for (const i in this.$events[key]) {
        this.$events[key][i].call(this, ...args);
      }
    }
  }

  /**
   * @param {object} newState
   */
  setState(newState) {
    if (typeof newState === 'object') {
      let oldstate = this.state;

      skipInProductionAndTest(() => oldstate = clone(this.state));

      this.state = Object.assign(oldstate, newState);

      skipInProductionAndTest(() => Object.freeze(this.state));

      if (this.$config.listen) {
        this.$privateStore.setState(newState);
      }
    }

    if (!this.$config.listen && typeof this.view === 'function' && this.html) {
      fuseDom.fuse(this.html, this.view());
    }
    this.trigger('update');
    return newState;
  }

  /**
   * @returns {boolean}
   */
  static isComponent() {
    return true;
  }
}
