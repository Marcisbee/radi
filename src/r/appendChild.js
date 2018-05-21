/* eslint-disable no-param-reassign */
/* eslint-disable no-console */

import mount from '../mount';
import Component from '../component/Component';
import Listener from '../listen/Listener';
import appendChildren from './appendChildren';
import appendListenerToElement from './utils/appendListenerToElement';

/**
 * @param {HTMLElement} element
 * @param {boolean} isSvg
 * @returns {function(*)}
 */
const appendChild = (element, isSvg) => child => {
  if (!child && typeof child !== 'number') {
    // Needs to render every child, even empty ones to preserve dom hierarchy
    child = '';
  }

  if (typeof child.buildNode === 'function') {
    appendChild(element, isSvg)(child.buildNode(isSvg));
    return;
  }

  if (child instanceof Component) {
    mount(child, element, isSvg);
    return;
  }

  if (child instanceof Listener) {
    appendListenerToElement(child, element);
    return;
  }

  if (Array.isArray(child)) {
    appendChildren(element, child, isSvg);
    return;
  }

  // Handles lazy loading components
  if (typeof child === 'function') {
    const executed = child();
    if (executed instanceof Promise) {
      const placeholder = document.createElement('section');
      placeholder.__async = true;
      const el = element.appendChild(placeholder);
      el.__async = true;
      executed.then(local => {
        if (local.default && local.default.isComponent) {
          /* eslint-disable */
          appendChild(el, isSvg)(new local.default());
          /* eslint-enable */
        } else
        if (typeof local.default === 'function') {
          const lazy = local.default();
          lazy.then(item => {
            if (item.default && item.default.isComponent) {
              /* eslint-disable */
              appendChild(el, isSvg)(new item.default());
              /* eslint-enable */
            }
          });
        } else {
          appendChild(el, isSvg)(local.default);
        }
      }).catch(console.warn);
    } else {
      appendChild(element, isSvg)(executed);
    }
    return;
  }

  if (child instanceof Node) {
    element.appendChild(child);
    return;
  }

  element.appendChild(document.createTextNode(child));
};

export default appendChild;
