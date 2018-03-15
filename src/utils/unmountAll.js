/**
 * @param {Component|Node} element
 */
const unmountAll = (element) => {
  if (typeof element.unmount === 'function') element.unmount();
  if (!element.children || element.children.length === 0) return;
  for (const child of element.children) {
    unmountAll(child);
  }
};

export default unmountAll;
