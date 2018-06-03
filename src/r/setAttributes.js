/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
// -- we need those for..in loops for now!

/* eslint-disable no-param-reassign */
// -- until this can be rewritten as a pure function, we need to reassign.

import setStyles from './setStyles';
import Listener from '../listen/Listener';
import parseClass from './utils/parseClass';
import AttributeListener from './utils/AttributeListener';

/**
 * @param {HTMLElement} element
 * @param {object} attributes
 * @param {number} depth
 */
const setAttributes = (element, attributes, depth) => {
  for (const key in attributes) {
    const value = attributes[key];

    if (typeof value === 'undefined') continue;

    if (!value && typeof value !== 'number') {
      // Need to remove falsy attribute
      element.removeAttribute(key);
      continue;
    }

    if (key.toLowerCase() === 'style') {
      setStyles(element, value, depth);
      continue;
    }

    if (value instanceof Listener) {
      new AttributeListener({
        attributeKey: key,
        listener: value,
        element,
        depth,
      }).attach();
      continue;
    }

    if (key.toLowerCase() === 'class' || key.toLowerCase() === 'classname') {
      element.setAttribute('class', parseClass(value));
      continue;
    }

    if (key.toLowerCase() === 'loadfocus') {
      element.onload = (el) => {
        setTimeout(() => {
          el.focus();
        }, 10);
      };
    }

    if (key.toLowerCase() === 'html') {
      element.innerHTML = value;
      continue;
    }

    if (key.toLowerCase() === 'model') {
      if (/(checkbox|radio)/.test(element.getAttribute('type'))) {
        element.onchange = (e) => {
          value.component[value.key] = e.target.checked;
        };
      } else {
        element.oninput = (e) => {
          value.component[value.key] = e.target.value;
        };
        element.value = value.value;
      }
      continue;
    }

    // Handles events 'on<event>'
    if (key.substring(0, 2).toLowerCase() === 'on') {
      if (key.substring(0, 8).toLowerCase() === 'onsubmit') {
        element[key] = (e) => {
          const data = [];
          const inputs = e.target.elements || [];
          for (const input of inputs) {
            if ((input.name !== ''
              && (input.type !== 'radio' && input.type !== 'checkbox'))
              || input.checked) {
              const item = {
                name: input.name,
                el: input,
                type: input.type,
                default: input.defaultValue,
                value: input.value,
                set(val) {
                  this.el.value = val;
                },
                reset(val) {
                  this.el.value = val;
                  this.el.defaultValue = val;
                },
              };
              data.push(item);
              if (!data[item.name]) {
                Object.defineProperty(data, item.name, {
                  value: item,
                });
              }
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
