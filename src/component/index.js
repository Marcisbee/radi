import Component from './ComponentClass';

/**
 * @param {object} o
 * @returns {function}
 */
const component = o => class {
  /**
   * @returns {Component}
   */
  constructor() {
    return new Component(o);
  }
};

export default component;
