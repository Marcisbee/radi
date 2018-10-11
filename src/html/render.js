import { fireEvent } from './fireEvent';
import { renderComponent } from './renderComponent';
import { setAttribute } from './setAttribute';
import GLOBALS from '../consts/GLOBALS';

/**
 * @param  {HTMLElement} newNode
 * @param  {HTMLElement} $reference
 * @param  {HTMLElement} $parent
 * @return {HTMLElement}
 */
export function insertAfter(newNode, $reference, $parent) {
  if (!$parent) $parent = $reference.parentNode;

  if (newNode instanceof Node) {
    if ($reference === null || $reference === undefined) {
      return $parent.insertBefore(newNode, $reference);
    }

    if ($reference instanceof Node) {
      return $parent.insertBefore(newNode, $reference.nextSibling);
    }
  }

  return newNode;
}

export function render(vdom, parent = null, after = null) {
  const mount = after
  ? (el => insertAfter(el, after, parent))
  : parent
    ? (el => parent.appendChild(el))
    : (el => el);
  let itemToMount;

  if (typeof vdom === 'function') {
    vdom = { type: vdom, props: {}, children: [] };
  }

  if (vdom instanceof Promise) {
    vdom = { type: 'await', props: {src: vdom}, children: [] };
  }

  if (typeof GLOBALS.CUSTOM_TAGS[vdom.type] !== 'undefined') {
    vdom.type = GLOBALS.CUSTOM_TAGS[vdom.type].render;
  }

  if (Array.isArray(vdom)) {
    itemToMount = vdom.map(item => render(item, parent));
  } else

  if (typeof vdom === 'string' || typeof vdom === 'number') {
    itemToMount = mount(document.createTextNode(vdom));
  } else

  if (typeof vdom === 'boolean' || vdom === null || typeof vdom === 'undefined') {
    itemToMount = mount(document.createTextNode(''));
  } else

  if (typeof vdom === 'object' && typeof vdom.type === 'function') {
    itemToMount = renderComponent(vdom, parent);
  } else

  if (typeof vdom === 'object' && typeof vdom.type === 'string') {
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
