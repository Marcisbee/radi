import ElementListener from './ElementListener';

/**
 * @param {Listener} listener
 * @param {HTMLElement} element
 * @returns {ElementListener}
 */
const appendListenerToElement = (listener, element) =>
  new ElementListener({
    listener,
    element,
  }).attach();

export default appendListenerToElement;
