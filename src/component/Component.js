/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
// -- we need those for..in loops for now!

import GLOBALS from '../consts/GLOBALS';
import generateId from '../utils/generateId';
import PrivateStore from './utils/PrivateStore';
// import fuseDom from '../r/utils/fuseDom';
import clone from '../utils/clone';
import skipInProductionAndTest from '../utils/skipInProductionAndTest';
import Listener from '../listen/Listener';
// import mount from '../mount';
import patch from '../r/patch';

const capitalise = lower => lower.charAt(0).toUpperCase() + lower.substr(1);

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
      __$events: {},
      __$privateStore: new PrivateStore(),
    });

    // TODO: Remove this! Deprecated!
    if (typeof this.on !== 'function'
      || (typeof this.on === 'function' && typeof this.on() === 'object')) {
      throw new Error('[Radi.js] Using `on.eventName()` is deprecated. Please use `onEventName()`.');
    }

    this.children = [];

    // Links headless components
    for (const key in GLOBALS.HEADLESS_COMPONENTS) {
      if (this[key] && typeof this[key].on === 'function') {
        this[key].on('update', () => this.setState());
      }
    }

    this.state = typeof this.state === 'function'
      ? this.state()
      : (this.state || {});

    skipInProductionAndTest(() => Object.freeze(this.state));

    if (children) this.setChildren(children);
    if (props) this.setProps(props);
  }

  /**
   * @returns {HTMLElement}
   */
  render() {
    if (typeof this.view !== 'function') return null;
    return this.html = this.view();
  }

  /**
   * @param {object} props
   * @returns {Component}
   */
  setProps(props) {
    const newState = {};
    // Self is needed cause of compilation
    const self = this;

    for (const key in props) {
      if (typeof props[key] === 'function' && key.substr(0, 2) === 'on') {
        self.on(key.substring(2, key.length), props[key]);
      } else
      if (props[key] instanceof Listener) {
        newState[key] = props[key].init().value;
        props[key].changeListener = (value => {
          self.setState({
            [key]: value,
          });
        });
      } else {
        newState[key] = props[key];
      }
    }
    this.setState(newState);
    return this;
  }

  /**
   * @param {Node[]|*[]} children
   */
  setChildren(children) {
    this.children = children;
    this.setState();
    for (let i = 0; i < this.children.length; i++) {
      if (typeof this.children[i].on === 'function') {
        this.children[i].on('update', () => this.setState());
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
    this.__$privateStore.addListener(key, listener, depth);
  }

  mount() {
    this.trigger('mount');
  }

  destroy() {
    // if (this.html) {
    //   for (var i = 0; i < this.html.length; i++) {
    //     if (this.html[i].parentNode) {
    //       this.html[i].parentNode.removeChild(this.html[i]);
    //     }
    //   }
    // }
    this.html = null;
    this.trigger('destroy');
    this.__$privateStore.removeListeners();
  }

  // TODO: Remove this! Deprecated!
  when() {
    throw new Error('[Radi.js] Using `.when(\'Event\')` is deprecated. Use `.on(\'Event\')` instead.');
  }

  /**
   * @param {string} key
   * @param {function} fn
   * @returns {function}
   */
  on(key, fn) {
    if (typeof this.__$events[key] === 'undefined') this.__$events[key] = [];
    this.__$events[key].push(fn);
    return fn;
  }

  /**
   * @param {string} key
   * @param {*} value
   */
  trigger(key, ...args) {
    const event = this[`on${capitalise(key)}`];

    if (typeof event === 'function') {
      event.call(this, ...args);
    }

    if (typeof this.__$events[key] !== 'undefined') {
      for (const i in this.__$events[key]) {
        this.__$events[key][i].call(this, ...args);
      }
    }
  }

  /**
   * @param {object} newState
   * @param {string} actionName
   */
  setState(newState, actionName) {
    if (typeof newState === 'object') {
      let oldstate = this.state;

      skipInProductionAndTest(() => oldstate = clone(this.state));

      this.state = Object.assign(oldstate, newState);

      skipInProductionAndTest(() => Object.freeze(this.state));

      if (this.$config.listen) {
        this.__$privateStore.setState(newState);
      }
    }

    if (!this.$config.listen && typeof this.view === 'function' && this.html) {
      this.html = patch(this.html, this.view());
    }

    if (typeof actionName === 'string' && typeof this[actionName] === 'function') {
      this.trigger(`after${actionName[0].toUpperCase()}${actionName.substr(1)}`);
    }

    // if (typeof newState === 'object') {
    //   let oldstate = this.state;
    //
    //   skipInProductionAndTest(() => oldstate = clone(this.state));
    //
    //   this.state = Object.assign(oldstate, newState);
    //
    //   skipInProductionAndTest(() => Object.freeze(this.state));
    //
    //   if (this.$config.listen) {
    //     this.__$privateStore.setState(newState);
    //   }
    // }
    //
    // if (!this.$config.listen && typeof this.view === 'function' && this.html) {
    //   fuseDom.fuse(this.html, this.view());
    // }
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
