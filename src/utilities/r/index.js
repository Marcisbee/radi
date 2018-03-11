import setAttributes from './setAttributes';
import cacheHTML from './../cacheHTML';
import GLOBALS from '../../consts/GLOBALS';
import Listener from '../Listener.js';
import Component from '../ComponentClass';

export default function r(query, props, ...children) {
  if (queryIsComponent(query)) {
    return new GLOBALS.REGISTERED[query]().props(props || {});
  }

  const element = getElementFromQuery(query);
  addKey(element);

  if (props !== null) {
    setAttributes(element, props);
  }

  appendChildren(element, children);

  return element;
};

export const queryIsComponent = (query) =>
  typeof query === 'string' && typeof GLOBALS.REGISTERED[query] !== 'undefined';

export const getElementFromQuery = (query) => {
  if (typeof query === 'string') return cacheHTML(query).cloneNode(false);
  if (isNode(query)) return query.cloneNode(false);
  return document.createDocumentFragment();
};

export const addKey = (element) => {
  element.key = GLOBALS.R_KEYS;
  GLOBALS.R_KEYS++;
  return element;
};

r.extend = (query, ...args) => {
  const clone = cacheHTML(query);
  return r(clone, ...args);
};

/**
 * appendChildren
 * @param {HTMLElement} element
 * @param {Array<any>} children
 */
export const appendChildren = (element, children) => {
  children.forEach(appendChild(element));
};

export const appendChild = (element) => (child) => {
  if (!child) return;

  if (child instanceof Component) {
    element.appendChild(child.$render());
    return;
  }

  if (child instanceof Listener) {
    let el = element.appendChild(handleListenerValue(child.value));
    child.onValueChange((value) => {
      el.remove();
      el = element.appendChild(handleListenerValue(value));
    });
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
    return;
  }
};

export const handleListenerValue = (value) => {
  if (isNode(value)) return value;
  return document.createTextNode(value);
};

export const isNode = a => !!(a && a.nodeType);
