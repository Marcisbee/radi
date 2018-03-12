import isNode from './isNode';

/**
 * @param {*} value - Value of the listener
 * @returns {Node}
 */
const listenerToNode = (value) => {
  if (isNode(value)) return value.cloneNode(true);
  return document.createTextNode(value);
};

export default listenerToNode;
