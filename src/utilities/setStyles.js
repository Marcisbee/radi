import { isString } from '../index';

// TODO: Add support for Listener (should be quite easy)
const setStyles = (element, styles) => {
  if (isString(styles)) return element.style = styles;

  if (typeof styles !== 'object' || Array.isArray(styles)) return;

  for (let property in styles) {
    setStyle(element, property, styles[property]);
  }
};

const setStyle = (element, property, value) => {
  if (typeof value === 'undefined' || isNaN(value)) return;
  element.style[property] = parseValue(value);
};

const parseValue = (value) =>
  typeof value === 'number' && !isNaN(value) ? `${value}px` : value;

export default setStyles;
