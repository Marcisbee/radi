/**
 * @param {HTMLElement} beforeNode
 * @param {HTMLElement} newNode
 * @returns {HTMLElement}
 */
const insertAfter = (beforeNode, newNode) => (
  beforeNode.parentNode && beforeNode.parentNode.insertBefore(newNode, beforeNode.nextSibling)
);

export default insertAfter;
