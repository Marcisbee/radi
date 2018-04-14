/**
 * @param {*} oldNode - Node to be swapped
 * @returns {Node}
 */
const swapNode = oldNode => {

  const newNode = oldNode;

  oldNode = newNode.cloneNode(true);

  oldNode.remove();

  return newNode;
};

export default swapNode;
