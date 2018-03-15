/**
 * @param {Component|Node} element
 */
const unmountAll = element => {
  if (typeof element.unmount === 'function') element.unmount();
  if (!element.children || element.children.length === 0) return;

  element.children.forEach(child => unmountAll(child));
};

export default unmountAll;
