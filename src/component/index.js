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

  /**
   * @returns {boolean}
   */
  static isComponent() {
    return true;
  }
};

export default component;
