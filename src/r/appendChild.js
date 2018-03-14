import Component from '../component/Component';
import Listener from '../listen/Listener.js';
import copyElementListeners from './utils/copyElementListeners';
import copyAttributeListeners from './utils/copyAttributeListeners';
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

  if (child instanceof Node) {
    const clone = child;
    copyElementListeners(child, clone);
    copyAttributeListeners(child, clone);
    element.appendChild(clone);
    return;
  }

  element.appendChild(document.createTextNode(child));
};

export default appendChild;
