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
 * @param {number} depth
 * @returns {function(*)}
 */
const appendChild = (element, isSvg, depth) => child => {
  if (!child && typeof child !== 'number') {
    // Needs to render every child, even empty ones to preserve dom hierarchy
    child = '';
  }

  if (typeof child.buildNode === 'function') {
    appendChild(element, isSvg, depth)(child.buildNode(isSvg, depth));
    return;
  }

  if (child instanceof Component) {
    mount(child, element, isSvg, depth);
    return;
  }

  if (child.isComponent) {
    /*eslint-disable*/
    mount(new child(), element, isSvg, depth);
    /* eslint-enable */
    return;
  }

  if (child instanceof Listener) {
    appendListenerToElement(child.applyDepth(depth), element, depth);
    return;
  }

  if (Array.isArray(child)) {
    appendChildren(element, child, isSvg, depth);
    return;
  }

  if (typeof child === 'function') {
    appendChild(element, isSvg, depth)(child());
    return;
  }

  // Handles lazy loading components
  if (child instanceof Promise || child.constructor.name === 'LazyPromise') {
    const placeholder = document.createElement('section');
    placeholder.__async = true;
    const el = element.appendChild(placeholder);
    child.then(data => {
      if (data.default) {
        appendChild(el, isSvg, depth)(data.default);
      } else {
        appendChild(el, isSvg, depth)(data);
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
