import parseValue from './parseValue';

/**
 * @param {HTMLElement} element
 * @param {string} property
 * @param {string} value
 * @returns {*}
 */
const setStyle = (element, property, value) => {
  if (typeof value === 'undefined') return;
  return element.style[property] = parseValue(value);
};

export default setStyle;
