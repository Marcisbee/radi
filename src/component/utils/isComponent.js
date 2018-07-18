import Component from '../Component';

/**
 * @param {*} value
 * @returns {Boolean}
 */
const isComponent = value => {
  if (value) {
    if (value.prototype instanceof Component) {
      return true;
    }

    if (value.isComponent) {
      return true;
    }
  }

  return false;
}

export default isComponent;
