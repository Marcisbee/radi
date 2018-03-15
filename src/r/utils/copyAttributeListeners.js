/**
 * @param {Node} oldElement
 * @param {Node} newElement
 * @return {Node}
 */
const copyAttributeListeners = (oldElement, newElement) => {
  if (!oldElement.attributeListeners) return newElement;

  oldElement.attributeListeners.forEach(listener => listener.updateElement(newElement));

  return Object.assign({}, newElement, oldElement.attributeListeners);
};

export default copyAttributeListeners;
