import setStyles from './setStyles';
import Listener from '../listen/Listener';
import AttributeListener from './utils/AttributeListener';

/**
 * @param {HTMLElement} element
 * @param {object} attributes
 */
const setAttributes = (element, attributes) => {
  Object.keys(attributes).forEach(key => {
    const value = attributes[key];

    console.log(key, 'keey');
    if (typeof value === 'undefined') return;

    if (key === 'style') {
      setStyles(element, value);
    }

    if (value instanceof Listener) {
      new AttributeListener({
        attributeKey: key,
        listener: value,
        element,
      }).attach();
    }

    // Handles events 'on<event>'
    if (key.substring(0, 2).toLowerCase() === 'on') {
      element[key] = value;
      continue;
    }

    element.setAttribute(key, value);
  });
};

export default setAttributes;
