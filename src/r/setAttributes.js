import setStyles from './setStyles';
import Listener from '../l/Listener';

// TODO: Add support for Listener (should be quite easy)
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

    if (key === 'html') {
      element.innerHTML = value;
      continue;
    }

    if (value instanceof Listener) {
      const listener = value;
      element.setAttribute(key, listener.value);

      if (!element.attributeListeners) element.attributeListeners = [];
      element.attributeListeners.push({
        attributeKey: key,
        listener
      });

      listener.onValueChange((value) => {
        element.setAttribute(key, value);
      });
      continue;
    }

    element.setAttribute(key, value);
  }
};

export default setAttributes;
