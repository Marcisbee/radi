import Listener from './Listener';

/**
 * @param {Component} component
 * @param {...string} path
 * @returns {Listener}
 */
const l = (component, ...path) =>
  new Listener(component, ...path);

export default l;
