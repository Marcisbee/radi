import ElementListener from './ElementListener';

/**
 * @param {Listener} listener
 * @param {HTMLElement} element
 */
const appendListenerToElement = (listener, element) => {
  new ElementListener({
    listener,
    element
  }).attach();
};

export default appendListenerToElement;
