import isNode from './isNode';

const listenerToNode = (value) => {
  if (isNode(value)) return value;
  return document.createTextNode(value);
};

export default listenerToNode;
