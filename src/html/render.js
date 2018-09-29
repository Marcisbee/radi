import { fireEvent } from './fireEvent';
import { renderComponent } from './renderComponent';
import { setAttribute } from './setAttribute';

export function render(vdom, parent = null) {
  const mount = parent ? (el => parent.appendChild(el)) : (el => el);
  let itemToMount;
  if (typeof vdom === 'string' || typeof vdom === 'number') {
    itemToMount = mount(document.createTextNode(vdom));
  } else if (typeof vdom === 'boolean' || vdom === null || typeof vdom === 'undefined') {
    itemToMount = mount(document.createTextNode(''));
  } else if (typeof vdom === 'object' && typeof vdom.type === 'function') {
    itemToMount = renderComponent(vdom, parent);
  } else if (typeof vdom === 'object' && typeof vdom.type === 'string') {
    const dom = mount(document.createElement(vdom.type));
    for (const child of [].concat(...vdom.children)) render(child, dom);
    for (const prop in vdom.props) setAttribute(dom, prop, vdom.props[prop]);
    itemToMount = dom;
  }

  if (itemToMount) {
    fireEvent('mount', itemToMount);
    return itemToMount;
  }
  throw new Error(`Invalid VDOM: ${vdom}.`);
}
