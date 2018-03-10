import {
  isString,
  updateBind,
  isComponent,
  isCondition,
  afterAppendChild,
  isNumber,
  isNode,
  isWatchable,
  text,
  getEl
} from '../index';
import { setAttr } from './setAttr';
import { memoizeHTML } from './memoizeHTML';
import { GLOBALS } from '../consts/GLOBALS';
import { _Radi } from '../index';

export function r(query, props, ...children) {
  if (queryIsComponent(query)) {
    // TODO: Make props and childs looped,
    // aka don't assume that first obj are props
    return new GLOBALS.REGISTERED[query]().props(props || {});
  }

  const element = getElementFromQuery(query);
  addKey(element);

  const radiInstance = this;
  radiJsx(radiInstance, element, children);

  return element;
}

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
 * radiJsx
 * @param {Radi} radiInstance
 * @param {HTMLElement} element
 * @param {Array<any>} children
 */
export const radiJsx = (radiInstance, element, children) => {
  children.forEach(appendChild(radiInstance, element));
};

const appendChild = (radiInstance, element) => (child) => {
  if (!child) return;

  if (isComponent(child)) {
    element.appendChild(child.__radi().$render());
    return;
  }

  if (isCondition(child)) {
    const child2 = child.__do();
    const id = child2.id;
    appendChild(element, child2);
    afterAppendChild(child, id, a);
    return;
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
    radiJsx(element, child);
    return;
  }

  if (isWatchable(child)) {
    const cache = child.get();
    const textNode = text(cache);
    element.appendChild(textNode);
    updateBind(radiInstance, textNode, element)(cache, child);
    return;
  }

  if (typeof child === 'object') {
    setAttr(radiInstance, element, child);
  }
};
