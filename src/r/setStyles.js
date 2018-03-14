import Listener from '../listen/Listener';
import AttributeListener from './utils/AttributeListener';
import setStyle from './utils/setStyle';

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
