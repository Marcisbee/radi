import setStyles from './setStyles';
import Listener from '../l/Listener';
import AttributeListener from './utils/AttributeListener';

/**
 * @param {HTMLElement} element
 * @param {object} attributes
 */
const setAttributes = (element, attributes) => {
  for (const key in attributes) {
    const value = attributes[key];

    if (typeof value === 'undefined') continue;

    if (key === 'style') {
      setStyles(element, value);
      continue;
    }

    if (typeof value === 'function') {
      element[key] = value(element);
      continue;
    }

    if (value instanceof Listener) {
      new AttributeListener({
        attributeKey: key,
        listener: value,
        element
      }).attach();
      continue;
    }

    element.setAttribute(key, value);
  }
};

export default setAttributes;
