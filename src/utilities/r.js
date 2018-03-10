import {
  isString,
  isComponent,
  isNumber,
  isNode,
  text,
  getEl
} from '../index';
import setAttributes from './setAttributes';
import memoizeHTML from './memoizeHTML';
import GLOBALS from '../consts/GLOBALS';
import { _Radi } from '../index';
import radiMutate from './radiMutate';
import Listener from './Listener.js';

export default function r(query, props, ...children) {
  if (queryIsComponent(query)) {
    // TODO: Make props and childs looped,
    // aka don't assume that first obj are props
    return new GLOBALS.REGISTERED[query]().props(props || {});
  }

  const element = getElementFromQuery(query);
  addKey(element);

  if (props !== null) {
    setAttributes(element, props);
  }

  const radiInstance = this;
  appendChildren(radiInstance, element, children);

  return element;
};

export const queryIsComponent = (query) =>
  isString(query) && typeof GLOBALS.REGISTERED[query] !== 'undefined';

export const getElementFromQuery = (query) => {
  if (isString(query)) return memoizeHTML(query).cloneNode(false);
  if (isNode(query)) return query.cloneNode(false);
  return document.createDocumentFragment();
};

export const addKey = (element) => {
  element.key = GLOBALS.R_KEYS;
  GLOBALS.R_KEYS++;
  return element;
};

r.extend = (query, ...args) => {
  const clone = memoizeHTML(query);
  return r(clone, ...args);
};

/**
 * appendChildren
 * @param {Radi} radiInstance
 * @param {HTMLElement} element
 * @param {Array<any>} children
 */
export const appendChildren = (radiInstance, element, children) => {
  children.forEach(appendChild(radiInstance, element));
};

export const appendChild = (radiInstance, element) => (child) => {
  if (!child) return;

  if (isComponent(child)) {
    element.appendChild(child.__radi().$render());
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

  if (isString(child) || isNumber(child)) {
    element.appendChild(text(child));
    return;
  }

  if (isNode(getEl(child))) {
    element.appendChild(child);
    return;
  }

  if (Array.isArray(child)) {
    appendChildren(radiInstance, element, child);
    return;
  }
};

export const handleListenerValue = (value) => {
  if (isNode(value)) return value;
  return text(value);
};
