import Listener from './Listener';

/**
 * @param {Component} component
 * @param {string} key
 * @param {string} [childPath='']
 * @returns {Listener}
 */
const l = (component, key, childPath = '') =>
  new Listener(component, key, childPath);

export default l;
