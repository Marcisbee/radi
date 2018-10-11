import { capitalise } from '../utils';

export class Component {
  /**
   * @param {Function} fn
   * @param {string} name
   */
  constructor(fn, name) {
    this.self = fn;
    this.name = name || fn.name;
    this.__$events = {};
  }

  /**
   * @param  {string}   event
   * @param  {Function} fn
   * @return {Function}
   */
  on(event, fn) {
    const e = this.__$events;
    const name = `on${capitalise(event)}`;
    if (!e[name]) e[name] = [];
    e[name].push(fn);
    return fn;
  }

  /**
   * @param  {string} event
   * @param  {*[]} args
   */
  trigger(event, ...args) {
    const name = `on${capitalise(event)}`;

    (this.__$events[name] || [])
      .map(e => e(...args));

    if (typeof this[name] === 'function') {
      this[name](...args);
    }

    if (this.self && typeof this.self[name] === 'function') {
      this.self[name](...args);
    }
  }
}
