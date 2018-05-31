import appendChildren from '../appendChildren';
import ensureArray from './ensureArray';

/**
 * @param {*} value - Value of the listener
 * @param {boolean} isSvg
 * @param {number} depth
 * @param {HTMLElement} after - Element after to append
 * @param {function} customAppend
 * @returns {Node[]}
 */
const listenerToNode = (value, isSvg, depth, after, customAppend) => {
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes);
  }

  const element = after || document.createDocumentFragment();
  if (after instanceof Node) {
    element.appendChild = customAppend;
  }
  appendChildren(element, ensureArray(value), isSvg, depth);
  return Array.from(element.childNodes);
};

export default listenerToNode;
