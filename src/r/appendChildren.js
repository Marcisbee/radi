import Component from '../component/ComponentClass';
import Listener from '../l/Listener.js';
import isNode from './utils/isNode';
import listenerToNode from './utils/listenerToNode';

/**
 * @param {HTMLElement} element
 * @param {*[]} children
 */
const appendChildren = (element, children) => {
  children.forEach(appendChild(element));
};

export default appendChildren;


/**
 * @param {HTMLElement} element
 * @returns {function(*)}
 */
export const appendChild = element => (child) => {
  if (!child) return;

  if (child instanceof Component) {
    element.appendChild(child.$render());
    return;
  }

  if (child instanceof Listener) {
    let el = element.appendChild(listenerToNode(child.value));
    child.onValueChange((value) => {
      el.remove();
      el = element.appendChild(listenerToNode(value));
    });
    return;
  }

  if (typeof child === 'function') {
    child(element);
    return;
  }

  if (typeof child === 'string' || typeof child === 'number') {
    element.appendChild(document.createTextNode(child));
    return;
  }

  if (isNode(child)) {
    element.appendChild(child);
    return;
  }

  if (Array.isArray(child)) {
    appendChildren(element, child);
  }
};
