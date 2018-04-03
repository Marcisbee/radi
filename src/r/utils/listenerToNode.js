import appendChildren from '../appendChildren';
import ensureArray from './ensureArray';

/**
 * @param {*} value - Value of the listener
 * @returns {Node[]}
 */
const listenerToNode = value => {
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes);
  }

  const element = document.createDocumentFragment();
  appendChildren(element, ensureArray(value));
  return listenerToNode(element);
};

export default listenerToNode;
