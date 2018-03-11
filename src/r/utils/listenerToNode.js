import isNode from './isNode';

/**
 * @param {*} value - Value of the listener
 * @returns {Node}
 */
const listenerToNode = (value) => {
  if (isNode(value)) return value;
  return document.createTextNode(value);
};

export default listenerToNode;
