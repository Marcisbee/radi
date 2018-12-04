import GLOBALS from '../consts/GLOBALS';
import { evaluate } from './evaluate';
import { fireEvent } from './fireEvent';
import { flatten } from '../utils';
import { insertAfter } from './insertAfter';
import { patch } from './patch';
import { render } from './render';

/**
 * @param {{}} props
 * @param {[]} children
 * @returns {HTMLElement}
 */
export function renderComponent(props = this.props, children = this.children) {
  const oldProps = { ...this.props };
  // const oldChildren = [...this.children];
  if (props) this.props = props;
  if (children) this.children = children;

  if (this.source && typeof this.source.shouldUpdate === 'function'
    && !this.source.shouldUpdate(props, oldProps)) {
    return this.dom;
  }
  const component = flatten([evaluate(
    this.query.call(this.source, {
      ...this.props,
      children: this.children,
    })
  )]);

  if (!this.dom) {
    const rendered = render(this.domStructure = component);

    return this.dom = rendered
      .reverse()
      .map((item) => fireEvent('mount', insertAfter(item, this.pointer)))
      .reverse();
  }

  if (GLOBALS.USE_CACHE) {
    GLOBALS.USE_CACHE = false;

    return this.dom;
  }

  const active = document.activeElement;
  const scrollPosition = window.scrollY;

  if (this.pointer.parentNode === null) return this.dom;

  const length = Math.max(this.dom.length, component.length);
  let lastEl = this.pointer;
  const newDom = [];
  const newStucture = [];
  for (let i = 0; i <= length - 1; i++) {
    const output = patch(component[i], this.dom[i], this.pointer.parentNode, lastEl);
    if (output.last) lastEl = output.last;
    if (output.newDom) newDom[i] = output.newDom;
    if (output.newStucture) newStucture[i] = output.newStucture;
  }

  active.focus();
  window.scrollTo(0, scrollPosition);

  this.domStructure = newStucture;
  return this.dom = newDom;
}
