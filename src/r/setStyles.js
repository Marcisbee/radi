// TODO: Add support for Listener (should be quite easy)
const setStyles = (element, styles) => {
  if (typeof styles === 'string') return element.style = styles;

  if (typeof styles !== 'object' || Array.isArray(styles)) return;

  for (const property in styles) {
    setStyle(element, property, styles[property]);
  }

  return element.style;
};

const setStyle = (element, property, value) => {
  if (typeof value === 'undefined') return;
  element.style[property] = parseValue(value);
};

const parseValue = value =>
  (typeof value === 'number' && !isNaN(value) ? `${value}px` : value);

export default setStyles;
