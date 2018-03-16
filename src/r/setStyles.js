import Listener from '../listen/Listener';
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
// -- we need those for..in loops for now!

/* eslint-disable no-param-reassign */
// -- until this can be rewritten as a pure function, we need to reassign.

import AttributeListener from './utils/AttributeListener';
import setStyle from './utils/setStyle';

/**
 * @param {HTMLElement} element
 * @param {string|object|Listener} styles
 * @returns {CSSStyleDeclaration}
 */
const setStyles = (element, styles) => {
  if (typeof styles === 'string') {
    element.style = styles;
  }

  if (typeof styles !== 'object' || Array.isArray(styles)) {
    return element.style;
  }

  if (styles instanceof Listener) {
    new AttributeListener({
      attributeKey: 'style',
      listener: styles,
      element,
    }).attach();
    return element.style;
  }

  for (const property in styles) {
    setStyle(element, property, styles[property]);
  }

  return element.style;
};

export default setStyles;
