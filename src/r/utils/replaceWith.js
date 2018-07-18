
/**
 * Replaces dom node with another dom node
 * @param {HTMLElement} node1
 * @param {HTMLElement} node2
 * @returns {HTMLElement}
 */
const replaceWith = (node1, node2) => {
  if (node1.parentNode) {
    node1.parentNode.replaceChild(node2, node1);
  } else {
    node1.replaceWith(node2);
  }
  return node2;
};

export default replaceWith;
