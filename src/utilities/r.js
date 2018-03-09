import { isString, updateBind } from '../index';
import { memoizeHTML } from './memoizeHTML';
import { isNode } from '../index';
import { radiArgs } from '../index';
import { GLOBALS } from '../consts/GLOBALS';
import { _Radi } from '../index';

export const r = (query, props, ...children) => {
  if (queryIsComponent(query)) {
    // TODO: Make props and childs looped,
    // aka don't assume that first obj are props
    return new GLOBALS.REGISTERED[query]().props(props || {});
  }

  const element = getElementFromQuery(query);
  addKey(element);

  radiJsx(element, children);

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
 * @param {HTMLElement} element
 * @param {Array<any>} children
 */
export function radiJsx(element, children) {
  children.forEach((child, i) => {
    if (!child) return;

    // support middleware
    if (isComponent(child)) {
      element.appendChild(child.__radi().$render());
    } else if (isCondition(child)) {
      let child2 = child.__do(),
        a,
        id = child2.id;
      if (isComponent(child2.r)) {
        a = child2.r.__radi().$render();
      } else if (typeof child2.r === 'function') {
        a = child2.r();
      } else if (isString(child2.r) || isNumber(child2.r)) {
        a = text(child2.r);
      } else {
        a = child2.r;
      }
      element.appendChild(a);
      afterAppendChild(child, id, a);
    } else if (typeof child === 'function') {
      child(element);
    } else if (isString(child) || isNumber(child)) {
      element.appendChild(text(child));
    } else if (isNode(getEl(child))) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      radiArgs(element, child);
    } else if (isWatchable(child)) {
      const cache = child.get();
      const z = text(cache);
      element.appendChild(z);

      // Update bind
      updateBind(_Radi, z, element)(cache, child);
    } else if (typeof child === 'object') {
      setAttr.call(this, element, child);
    }
  });
}
