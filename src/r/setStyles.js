/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
/* eslint-disable no-multi-assign */

import Listener from '../listen/Listener';
import parseValue from './utils/parseValue';

/**
 * @param {Structure} structure
 * @param {object} styles
 * @param {object} oldStyles
 * @returns {object}
 */
const setStyles = (structure, styles = {}, oldStyles = {}) => {
  if (!structure.html || !structure.html[0]) return styles;
  const element = structure.html[0];

  // Handle Listeners
  if (styles instanceof Listener) {
    if (typeof structure.$styleListeners.general !== 'undefined') {
      return element.style;
    }
    structure.$styleListeners.general = styles;
    structure.$styleListeners.general.applyDepth(structure.depth).init();

    structure.$styleListeners.general.onValueChange(value => {
      setStyles(structure, value, {});
    });

    return element.style;
  }

  if (typeof styles === 'string') {
    element.style = styles;
    return element.style;
  }

  const toRemove = Object.keys(oldStyles)
    .filter(key => typeof styles[key] === 'undefined');

  for (const style in styles) {
    if (styles.hasOwnProperty(style)) {
      // Skip if styles are the same
      if (typeof oldStyles !== 'undefined' && oldStyles[style] === styles[style]) continue;

      // Need to remove falsy style
      if (!styles[style] && typeof styles[style] !== 'number') {
        element.style[style] = null;
        continue;
      }

      // Handle Listeners
      if (styles[style] instanceof Listener) {
        if (typeof structure.$styleListeners[style] !== 'undefined') continue;
        structure.$styleListeners[style] = styles[style];
        structure.$styleListeners[style].applyDepth(structure.depth).init();

        structure.$styleListeners[style].onValueChange(value => {
          setStyles(structure, {
            [style]: value,
          }, {});
        });

        styles[style] = structure.$styleListeners[style].value;
        continue;
      }

      element.style[style] = parseValue(styles[style]);
    }
  }

  for (let i = 0; i < toRemove.length; i++) {
    element.style[toRemove[i]] = null;
  }

  return element.style;
};

export default setStyles;
