/**
 * @param {Node} oldElement
 * @param {Node} newElement
 * @return {Node}
 */
const copyElementListeners = (oldElement, newElement) => {
  if (!oldElement.listeners) return newElement;

  oldElement.listeners.forEach(listener => listener.updateElement(newElement));

  return Object.assign({}, newElement, oldElement.listeners);
};

export default copyElementListeners;
