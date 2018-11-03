import {
  patch,
  render,
} from '../html';
import { capitalise } from '../utils';

export class Component {
  /**
   * @param {Function} fn
   */
  constructor(type) {
    this.type = type;
    this.name = type.name;
    this.render = this.render.bind(this);
    this.evaluate = this.evaluate.bind(this);
    this.update = this.update.bind(this);
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

  /**
   * @param  {{}} props
   * @param  {*[]} children
   */
  evaluate(props, children) {
    this.props = props;
    this.children = children;

    return this.node = this.type.call(
      this,
      {
        ...this.props,
        children: this.children,
      }
    );
  }

  /**
   * @param  {string} props
   * @param  {*[]} children
   * @param  {HTMLElement} parent
   */
  render(props, children, parent) {
    return this.dom = render(this.evaluate(props, children), parent);
  }

  /**
   * @param  {{}} props
   * @param  {*[]} children
   */
  update(props = this.props, children = this.children) {
    const oldDom = this.dom;

    return this.dom = patch(
      this.evaluate(props, children),
      oldDom
    );
  }
}
