import appendChildren from '../appendChildren';
import ensureArray from './ensureArray';
import swapNode from './swapNode';

/**
 * @param {*} value - Value of the listener
 * @returns {Node[]}
 */
const listenerToNode = value => {
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes).map(childNode => swapNode(childNode));
  }

  const element = document.createDocumentFragment();
  appendChildren(element, ensureArray(value));
  return listenerToNode(element);
};

export default listenerToNode;
