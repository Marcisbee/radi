import { flatten } from '../utils';
import { evaluate } from './evaluate';
import { insertAfter } from './insertAfter';
import { fireEvent } from './fireEvent';
import { render } from './render';
import { patch } from './patch';

/**
 * @param {{}} props
 * @param {[]} children
 * @returns {HTMLElement}
 */
export function renderComponent(props = this.props, children = this.children) {
  if (props) this.props = props;
  if (children) this.children = children;
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

  const active = document.activeElement;

  if (this.pointer.parentNode === null) return this.dom;

  const length = Math.max(this.dom.length, component.length);
  let last = this.pointer;
  let newDom = [];
  let newStucture = [];
  for (let i = 0; i <= length - 1; i++) {
    const output = patch(component[i], this.dom[i], this.pointer.parentNode, last);
    if (output.last) last = output.last;
    if (output.newDom) newDom[i] = output.newDom;
    if (output.newStucture) newStucture[i] = output.newStucture;
  }

  active.focus();

  this.domStructure = newStucture;
  return this.dom = newDom;
}
