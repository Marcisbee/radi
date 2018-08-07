/* eslint-disable no-continue */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */

import setStyles from './setStyles';
import Listener from '../listen/Listener';
import parseClass from './utils/parseClass';
import GLOBALS from '../consts/GLOBALS';
// import AttributeListener from './utils/AttributeListener';

/**
 * @param {Structure} structure
 * @param {object} propsSource
 * @param {object} oldPropsSource
 */
const setAttributes = (structure, propsSource = {}, oldPropsSource = {}) => {
  const props = propsSource || {};
  const oldProps = oldPropsSource || {};

  if (!structure.html || !structure.html[0]) return structure;
  const element = structure.html[0];

  if (!(element instanceof Node && element.nodeType !== 3)) return structure;

  const toRemove = Object.keys(oldProps)
    .filter(key => typeof props[key] === 'undefined');

  for (const prop in props) {
    if (props.hasOwnProperty(prop)) {
      // Skip if proprs are the same
      if (typeof oldProps !== 'undefined' && oldProps[prop] === props[prop]) continue;

      // Need to remove falsy attribute
      if (!props[prop] && typeof props[prop] !== 'number') {
        element.removeAttribute(prop);
        continue;
      }

      if ((prop === 'value' || prop === 'model') && !(props[prop] instanceof Listener)) {
        if (/(checkbox|radio)/.test(element.getAttribute('type'))) {
          element.checked = props[prop];
        } else {
          element.value = props[prop];
        }
      }

      // Handle Listeners
      if (props[prop] instanceof Listener) {
        if (typeof structure.$attrListeners[prop] !== 'undefined') continue;
        structure.$attrListeners[prop] = props[prop];
        props[prop].applyDepth(structure.depth).init();

        if (prop.toLowerCase() === 'model') {
          if (/(checkbox|radio)/.test(element.getAttribute('type'))) {
            element.addEventListener('change', (e) => {
              structure.$attrListeners[prop].updateValue(e.target.checked);
            });
          } else {
            element.addEventListener('input', (e) => {
              structure.$attrListeners[prop].updateValue(e.target.value);
            });
          }
        }

        structure.$attrListeners[prop].onValueChange(value => {
          setAttributes(structure, {
            [prop]: value,
          }, {});
          // props[prop] = value;
        });

        // structure.setProps(Object.assign(structure.data.props, {
        //   [prop]: props[prop].value,
        // }));
        props[prop] = structure.$attrListeners[prop].value;
        continue;
      }

      if (typeof GLOBALS.CUSTOM_ATTRIBUTES[prop] !== 'undefined') {
        const { allowedTags } = GLOBALS.CUSTOM_ATTRIBUTES[prop];

        if (!allowedTags || (
          allowedTags
            && allowedTags.length > 0
            && allowedTags.indexOf(element.localName) >= 0
        )) {
          if (typeof GLOBALS.CUSTOM_ATTRIBUTES[prop].caller === 'function') {
            GLOBALS.CUSTOM_ATTRIBUTES[prop].caller(element, props[prop]);
          }
          if (!GLOBALS.CUSTOM_ATTRIBUTES[prop].addToElement) continue;
        }
      }


      if (prop.toLowerCase() === 'style') {
        if (typeof props[prop] === 'object') {
          setStyles(structure, props[prop], (oldProps && oldProps.style) || {});
          // props[prop] = structure.setStyles(props[prop], (oldProps && oldProps.style) || {});
        } else {
          element.style = props[prop];
        }
        continue;
      }

      if (prop.toLowerCase() === 'class' || prop.toLowerCase() === 'classname') {
        element.setAttribute('class', parseClass(props[prop]));
        continue;
      }

      if (prop.toLowerCase() === 'loadfocus') {
        element.onload = (el) => {
          setTimeout(() => {
            el.focus();
          }, 10);
        };
        continue;
      }

      if (prop.toLowerCase() === 'html') {
        element.innerHTML = props[prop];
        continue;
      }

      // Handles events 'on<event>'
      if (prop.substring(0, 2).toLowerCase() === 'on' && typeof props[prop] === 'function') {
        const fn = props[prop];
        if (prop.substring(0, 8).toLowerCase() === 'onsubmit') {
          element[prop] = (e) => {
            if (props.prevent) {
              e.preventDefault();
            }

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
                    structure.el.value = val;
                  },
                  reset(val) {
                    structure.el.value = val;
                    structure.el.defaultValue = val;
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

            return fn(e, data);
          };
        } else {
          element[prop] = e => fn(e);
        }
        continue;
      }

      element.setAttribute(prop, props[prop]);
    }
  }

  for (let i = 0; i < toRemove.length; i++) {
    element.removeAttribute(toRemove[i]);
  }

  structure.props = props;

  return structure;
};

export default setAttributes;
