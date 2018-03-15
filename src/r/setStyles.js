import Listener from '../listen/Listener';
import AttributeListener from './utils/AttributeListener';
import setStyle from './utils/setStyle';

/**
 * @param {HTMLElement} element
 * @param {string|object|Listener} styles
 * @returns {CSSStyleDeclaration}
 */
const setStyles = (element, styles) => {
  const newElement = Object.assign({}, element);
  if (typeof styles === 'string') {
    newElement.style = styles;
  }

  if (typeof styles !== 'object' || Array.isArray(styles)) {
    return newElement.style;
  }

  if (styles instanceof Listener) {
    new AttributeListener({
      attributeKey: 'style',
      listener: styles,
      newElement,
    }).attach();
    return newElement.style;
  }

  Object.keys(styles).forEach(property => setStyle(newElement, property, styles[property]));

  return newElement.style;
};

export default setStyles;
