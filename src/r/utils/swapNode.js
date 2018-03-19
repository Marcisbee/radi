/**
 * @param {*} oldNode - Node to be swapped
 * @returns {Node}
 */
const swapNode = oldNode => {

  const newNode = oldNode;

  oldNode = newNode.cloneNode(true);

  // TODO: Need to destroy all childs of oldNode with smth like n.destroy();

  return newNode;
};

export default swapNode;
