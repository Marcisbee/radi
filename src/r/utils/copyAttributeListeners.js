/**
 * @param {Node} oldElement
 * @param {Node} newElement
 * @return {Node}
 */
const copyAttributeListeners = (oldElement, newElement) => {
  if (!oldElement.attributeListeners) return;

  for (const listener of oldElement.attributeListeners) {
    listener.updateElement(newElement);
  }

  newElement.attributeListeners = oldElement.attributeListeners;

  return newElement;
};

export default copyAttributeListeners;
