/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
// -- we need those for..in loops for now!

/* eslint-disable no-param-reassign */
// -- until this can be rewritten as a pure function, we need to reassign.

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

    if (!value && typeof value !== 'number') {
      // Need to remove falsy attribute
      element.removeAttribute(key);
      continue;
    }

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
      if (key.substring(0, 8).toLowerCase() === 'onsubmit') {
        element[key] = (e) => {
          let data = [];
          let inputs = e.target.elements || [];

          for (var i = 0, input; input = inputs[i++];) {
            if (input.name !== '') {
              let item = {
                name: input.name,
                el: input,
                type: input.type,
                default: input.defaultValue,
                value: input.value,
              };
              data.push(item);
              Object.defineProperty(data, item.name, {
                value: item.value,
              });
            }
          }

          return value(e, data);
        };
      } else {
        element[key] = value;
      }
      continue;
    }

    element.setAttribute(key, value);
  }
};

export default setAttributes;
