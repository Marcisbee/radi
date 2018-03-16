/* eslint-disable no-restricted-syntax */
// -- we need those for..in loops for now!

/* eslint-disable no-param-reassign */
// -- until this can be rewritten as a pure function, we need to reassign.

/**
 * @param {Node} oldElement
 * @param {Node} newElement
 * @return {Node}
 */
const copyAttributeListeners = (oldElement, newElement) => {
  if (!oldElement.attributeListeners) return newElement;

  for (const listener of oldElement.attributeListeners) {
    listener.updateElement(newElement);
  }

  newElement.attributeListeners = oldElement.attributeListeners;
  return newElement;
};

export default copyAttributeListeners;
