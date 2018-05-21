import appendChildren from '../appendChildren';
import ensureArray from './ensureArray';

/**
 * @param {*} value - Value of the listener
 * @param {boolean} isSvg
 * @returns {Node[]}
 */
const listenerToNode = (value, isSvg) => {
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes);
  }

  const element = document.createDocumentFragment();
  appendChildren(element, ensureArray(value), isSvg);
  return listenerToNode(element);
};

export default listenerToNode;
