
/**
 * Append dom node to dom tree (after - (true) should append after 'to' element
 * or (false) inside it)
 * @param {HTMLElement} node
 * @param {HTMLElement} to
 * @param {Boolean} after
 * @returns {HTMLElement}
 */
const append = (node, to, after) => {
  if (after && to) {
    if (to.parentNode) {
      to.parentNode.insertBefore(node, to);
      // if (!to.nextSibling) {
      //   to.parentNode.appendChild(node);
      // } else {
      //   to.parentNode.insertBefore(node, to.nextSibling || to);
      // }
    }
    return node;
  }

  return to.appendChild(node);
};

export default append;
