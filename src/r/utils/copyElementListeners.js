/**
 * @param {Node} oldElement
 * @param {Node} newElement
 * @return {Node}
 */
const copyElementListeners = (oldElement, newElement) => {
  if (!oldElement.listeners) return;

  for (const listener of oldElement.listeners) {
    listener.updateElement(newElement);
  }

  newElement.listeners = oldElement.listeners;
  return newElement;
};

export default copyElementListeners;
