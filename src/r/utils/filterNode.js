import flatten from '../../utils/flatten';
import isComponent from '../../component/utils/isComponent';
import Component from '../../component/Component';
import r from '../index.js';
import Listener from '../../listen/Listener';

/**
 * @param {function} value
 * @returns {object}
 */
const filterNode = value => {

  if (Array.isArray(value)) {
    return value.map(filterNode);
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return r('#text', value);
  }

  if (!value || typeof value === 'boolean') {
    return r('#text', '');
  }

  if (value instanceof Listener) {
    return r(value);
  }

  if (isComponent(value) || value instanceof Component) {
    return r(value);
  }

  if (typeof value === 'function') {
    return r(value);
  }

  if (value instanceof Promise || value.constructor.name === 'LazyPromise') {
    return r(value);
  }

  return value;
}

export default filterNode;
