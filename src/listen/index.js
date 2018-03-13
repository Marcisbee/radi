import Listener from './Listener';

/**
 * The listen function is used for dynamically binding a component property
 * to the DOM. Also commonly imported as 'l'.
 * @param {Component} component
 * @param {...string} path
 * @returns {Listener}
 */
const listen = (component, ...path) =>
  new Listener(component, ...path);

export default listen;
