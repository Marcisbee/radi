import { capitalise } from '../utils';

export class Component {
  /**
   * @param {Function} fn
   */
  constructor(node) {
    this.type = node.type;
    this.name = node.type.name;
    this.pointer = node.pointer;
    this.update = node.update;
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
  }
}
