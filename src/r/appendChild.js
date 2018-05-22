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

  if (child.isComponent) {
    /*eslint-disable*/
    mount(new child(), element, isSvg);
    /* eslint-enable */
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

  if (typeof child === 'function') {
    appendChild(element, isSvg)(child());
    return;
  }

  // Handles lazy loading components
  if (child instanceof Promise || child.constructor.name === 'LazyPromise') {
    const placeholder = document.createElement('section');
    placeholder.__async = true;
    const el = element.appendChild(placeholder);
    child.then(data => {
      if (data.default) {
        appendChild(el, isSvg)(data.default);
      } else {
        appendChild(el, isSvg)(data);
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
