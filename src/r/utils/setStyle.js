import parseValue from './parseValue';

/**
 * @param {HTMLElement} element
 * @param {string} property
 * @param {string} value
 * @returns {*}
 */
const setStyle = (element, property, value) => {
  if (typeof value === 'undefined') return false;
  const newElement = Object.assign({}, element);
  newElement.style[property] = parseValue(value);

  return newElement;
};

export default setStyle;
