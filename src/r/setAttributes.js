import setStyles from './setStyles';

// TODO: Add support for Listener (should be quite easy)
const setAttributes = (element, attributes) => {
  for (let key in attributes) {
    const value = attributes[key];

    if (typeof value === 'undefined') continue;

    if (key === 'style') {
      setStyles(element, attributes[key]);
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

    element.setAttribute(key, value);
  }
}

export default setAttributes;
