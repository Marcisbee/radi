import Listener from '../listen/Listener';
import AttributeListener from './utils/AttributeListener';

/**
 * @param {HTMLElement} element
 * @param {object} styles
 * @returns {string}
 */
const setStyles = (element, styles) => {
  if (typeof styles === 'string') element.style = styles;
  if (typeof styles !== 'object' || Array.isArray(styles)) return '';

  if (styles instanceof Listener) {
    new AttributeListener({
      attributeKey: 'style',
      listener: styles,
      element
    }).attach();
  }

  if (typeof styles === 'string') return element.style = styles;

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
