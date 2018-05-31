import ElementListener from './ElementListener';

/**
 * @param {Listener} listener
 * @param {HTMLElement} element
 * @param {number} depth
 * @returns {ElementListener}
 */
const appendListenerToElement = (listener, element, depth) =>
  new ElementListener({
    listener,
    element,
    depth,
  }).attach();

export default appendListenerToElement;
