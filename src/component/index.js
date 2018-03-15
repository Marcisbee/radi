import Component from './Component';

/**
 * @param {object} o
 * @returns {function}
 */
const component = o => class {
  /**
   * @returns {Component}
   */
  constructor(children) {
    return new Component(o, children);
  }

  /**
   * @returns {boolean}
   */
  static isComponent() {
    return true;
  }
};

export default component;
