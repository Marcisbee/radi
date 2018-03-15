/**
 * @param {Component|Node} element
 */
const mountAll = element => {
  if (typeof element.mount === 'function') element.mount();
  if (!element.children || element.children.length === 0) return;

  element.children.forEach(child => mountAll(child));
};

export default mountAll;
