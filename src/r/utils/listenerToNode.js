import isNode from './isNode';

/**
 * @param {*} value - Value of the listener
 * @returns {Node[]}
 */
const listenerToNode = (value) => {
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes).map(childNode =>
      childNode.cloneNode(true)
    );
  }
  if (isNode(value)) return [value.cloneNode(true)];
  return [document.createTextNode(value)];
};

export default listenerToNode;
