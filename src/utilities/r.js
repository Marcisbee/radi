import { isString } from '../index';
import { memoizeHTML } from './memoizeHTML';
import { isNode } from '../index';
import { radiArgs } from '../index';
import { GLOBALS } from '../consts/GLOBALS';

export const r = (query, ...args) => {
  if (queryIsComponent(query)) {
    // TODO: Make props and childs looped,
    // aka don't assume that first obj are props
    const props = args[0] || {};
    return new GLOBALS.REGISTERED[query]().props(props);
  }

  const element = getElementFromQuery(query);
  addKey(element);

  radiArgs.call(this, element, args);

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
  return r.bind.apply(r, [this, clone].concat(args));
};
