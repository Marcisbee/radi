/* eslint-disable no-param-reassign */
/* eslint-disable no-console */

import mount from '../mount';
import Component from '../component/Component';
import Listener from '../listen/Listener';
import appendChildren from './appendChildren';
import appendListenerToElement from './utils/appendListenerToElement';

/**
 * @param {HTMLElement} element
 * @returns {function(*)}
 */
const appendChild = element => child => {
  if (!child && typeof child !== 'number') {
    // Needs to render every child, even empty ones to preserve dom hierarchy
    child = '';
  }

  if (child instanceof Component) {
    mount(child, element);
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

  // Handles lazy loading components
  if (typeof child === 'function') {
    const placeholder = document.createElement('div');
    const el = element.appendChild(placeholder);
    el.__async = true;
    child().then(local => {
      if (typeof local.default === 'function'
        && local.default.isComponent
        && local.default.isComponent()) {
        /*eslint-disable*/
        appendChild(el)(new local.default());
        el.__async = false;
        /* eslint-enable */
      } else {
        appendChild(el)(local.default);
        el.__async = false;
      }
    }).catch(console.warn);
    return;
  }

  if (child instanceof Node) {
    element.appendChild(child);
    return;
  }

  element.appendChild(document.createTextNode(child));
};

export default appendChild;
