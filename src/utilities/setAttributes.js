import setStyles from './setStyles';
import { isFunction } from '../index';

// TODO: Add support for Listener (should be quite easy)
const setAttributes = (element, attributes) => {
  for (let key in attributes) {
    const value = attributes[key];

    if (typeof value === 'undefined') continue;

    if (key === 'style') {
      setStyles(element, attributes[key]);
      continue;
    }

    if (isFunction(value)) {
      element[key] = value(element);
      continue;
    }

    if (key === 'html') {
      element.innerHTML = value;
      continue;
    }

    element.setAttribute(key, value);
  }
}

export default setAttributes;
