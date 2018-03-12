import Component from '../component/ComponentClass';
import Listener from '../l/Listener.js';
import isNode from './utils/isNode';
import listenerToNode from './utils/listenerToNode';
import getParentNode from './utils/getParentNode';

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
export const appendChild = element => (child, i) => {
  if (!child) return;

  if (child instanceof Component) {
    element.appendChild(child.render());
    return;
  }

  if (child instanceof Listener) {
    let el = element.appendChild(listenerToNode(child.value));

    child.onValueChange((value) => {
      if (el.parentNode || el.childNodes.length > 0) {
        const newEl = element.appendChild(listenerToNode(value));
        const parentNode = getParentNode(el);
        parentNode.insertBefore(newEl, el);
        el.remove();
        el = newEl;
      }
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
    element.appendChild(child.cloneNode(true));
    return;
  }

  if (Array.isArray(child)) {
    appendChildren(element, child);
  }
};
