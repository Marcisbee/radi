import ComponentClazz from './Component';

/**
 * @param {object} o
 * @returns {function}
 */
const component = o =>
  class {
    /**
     * @returns {ComponentClazz}
     */
    constructor(children) {
      return new ComponentClazz(o, children);
    }

    /**
     * @returns {boolean}
     */
    static isComponent() {
      return true;
    }
  };

/**
 * @param {class} target
 * @returns {class}
 */
export const Component = target =>
  class {
    /**
     * @returns {Component}
     */
    constructor(children) {
      const instance = new target();
      return new ComponentClazz(instance, children);
    }
  };

export default component;
