import Component from '../component/ComponentClass';
import Listener from '../l/Listener.js';
import isNode from './utils/isNode';
import getParentNode from './utils/getParentNode';
import appendChildren from './appendChildren';
import appendListenerToElement from './utils/appendListenerToElement';

/**
 * @param {HTMLElement} element
 * @returns {function(*): *}
 */
const appendChild = element => (child) => {
  if (!child) return;

  if (child instanceof Component) {
    element.appendChild(child.render());
    return;
  }

  if (child instanceof Listener) {
    appendListenerToElement(child, element);
    return;
  }

  if (Array.isArray(child)) {
    appendChildren(element, child);
    return;
  }

  if (typeof child === 'function') {
    child(element);
    return;
  }

  if (isNode(child)) {
    element.appendChild(child.cloneNode(true));
    return;
  }

  element.appendChild(document.createTextNode(child));
};

export default appendChild;
