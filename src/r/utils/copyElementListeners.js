/* eslint-disable no-restricted-syntax */
// -- we need those for..in loops for now!

/* eslint-disable no-param-reassign */
// -- until this can be rewritten as a pure function, we need to reassign.

/**
 * @param {Node} oldElement
 * @param {Node} newElement
 * @return {Node}
 */
const copyElementListeners = (oldElement, newElement) => {
  if (!oldElement.listeners) return newElement;

  for (const listener of oldElement.listeners) {
    listener.updateElement(newElement);
  }

  newElement.listeners = oldElement.listeners;
  return newElement;
};

export default copyElementListeners;
