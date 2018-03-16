
import setStyles from './setStyles';
import Listener from '../listen/Listener';
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

    if (value instanceof Listener) {
      new AttributeListener({
        attributeKey: key,
        listener: value,
        element,
      }).attach();
      continue;
    }

    // Handles events 'on<event>'
    if (key.substring(0, 2).toLowerCase() === 'on') {
      element[key] = value;
      continue;
    }

    element.setAttribute(key, value);
  }
};

export default setAttributes;
