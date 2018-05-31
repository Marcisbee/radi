/* eslint-disable no-param-reassign */
// -- until this can be rewritten as a pure function, we need to reassign.

import Listener from '../../listen/Listener';
import StyleListener from '../utils/StyleListener';
import parseValue from './parseValue';

/**
 * @param {HTMLElement} element
 * @param {string} property
 * @param {string} value
 * @param {number} depth
 * @returns {*}
 */
const setStyle = (element, property, value, depth) => {
  if (typeof value === 'undefined') return undefined;

  if (value instanceof Listener) {
    new StyleListener({
      styleKey: property,
      listener: value,
      element,
      depth,
    }).attach();
    return element[property];
  }

  return element.style[property] = parseValue(value);
};

export default setStyle;
