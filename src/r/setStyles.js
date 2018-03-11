// TODO: Add support for Listener (should be quite easy)

/**
 * @param {HTMLElement} element
 * @param {(string|object)} styles
 * @returns {string}
 */
const setStyles = (element, styles) => {
  if (typeof styles === 'string') return element.style = styles;

  if (typeof styles !== 'object' || Array.isArray(styles)) return '';

  for (const property in styles) {
    setStyle(element, property, styles[property]);
  }

  return element.style;
};

export default setStyles;


/**
 * setStyle
 * @param {HTMLElement} element
 * @param {string} property
 * @param {string} value
 */
export const setStyle = (element, property, value) => {
  if (typeof value === 'undefined') return;
  element.style[property] = parseValue(value);
};

/**
 * parseValue
 * @param {*} value
 * @return {*}
 */
const parseValue = value =>
  (typeof value === 'number' && !isNaN(value) ? `${value}px` : value);
