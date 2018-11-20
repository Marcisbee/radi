import GLOBALS from '../consts/GLOBALS';
import { Listener } from '../store/Store';

/**
 * @param {*} value
 * @param {Function} fn
 * @returns {*}
 */
function autoUpdate(value, fn) {
  if (value instanceof Listener) {
    return fn(value.getValue(e => fn(value.map(e))));
  }

  return fn(value);
}

/**
 * @param {HTMLElement} $target
 * @param {string} name
 * @param {*} value
 */
function setBooleanProp($target, name, value) {
  if (value) {
    $target.setAttribute(name, value);
    $target[name] = true;
  } else {
    $target[name] = false;
  }
}

/**
 * @param {HTMLElement} $target
 * @param {string} name
 */
function removeBooleanProp($target, name) {
  $target.removeAttribute(name);
  $target[name] = false;
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function isEventProp(name) {
  return /^on/.test(name);
}

/**
 * @param {string} name
 * @returns {string}
 */
function extractEventName(name) {
  return name.replace(/^on/, '').toLowerCase();
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function isCustomProp(name) {
  return isEventProp(name);
}

/**
 * @param {HTMLElement} $target
 * @param {string} name
 * @param {*} value
 */
export function setProp($target, name, value) {
  if (name === 'style' && typeof value !== 'string') {
    setStyles($target, value);
  } else if (isCustomProp(name)) {
    addEventListener($target, name, value);
  } else if (name === 'className') {
    $target.setAttribute('class', value);
  } else if (typeof value === 'boolean') {
    setBooleanProp($target, name, value);
  } else {
    if (name === 'value' && document.activeElement !== $target) {
      $target[name] = value;
    }
    $target.setAttribute(name, value);
  }
}

/**
 * @param {HTMLElement} $target
 * @param {string} name
 * @param {*} value
 */
export function removeProp($target, name, value) {
  if (isCustomProp(name)) {

  } else if (name === 'className') {
    $target.removeAttribute('class');
  } else if (typeof value === 'boolean') {
    removeBooleanProp($target, name);
  } else {
    $target.removeAttribute(name);
  }
}

/**
 * @param {HTMLElement} $target
 * @param {{}} styles
 */
export function setStyles($target, styles) {
  Object.keys(styles).forEach(name => {
    autoUpdate(styles[name], value => {
      $target.style[name] = value;
    });
  });
}

/**
 * @param {HTMLElement} $target
 * @param {{}} props
 */
export function setProps($target, props) {
  (Object.keys(props || {})).forEach(name => {
    if (typeof GLOBALS.CUSTOM_ATTRIBUTES[name] !== 'undefined') {
      const { allowedTags, addToElement, caller } = GLOBALS.CUSTOM_ATTRIBUTES[name];

      if (!allowedTags || (
        allowedTags
        && allowedTags.length > 0
        && allowedTags.indexOf($target.localName) >= 0
      )) {
        if (typeof caller === 'function') {
          props[name] = caller($target, props[name]);
        }
        if (!addToElement) return;
      }
    }

    autoUpdate(props[name], value => {
      if (name === 'model') {
        name = 'value';
      } else
      if (name === 'class' || name === 'className') {
        if (Array.isArray(value)) {
          value = value.filter(v => v && typeof v !== 'function').join(' ');
        }
      }
      setProp($target, name, value);
    });
  });
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function isRemovableProp(value) {
  return typeof value === 'undefined' || value === false || value === null;
}

/**
 * @param {HTMLElement} $target
 * @param {string} name
 * @param {*} newVal
 * @param {*} oldVal
 */
export function updateProp($target, name, newVal, oldVal) {
  if (isRemovableProp(newVal)) {
    removeProp($target, name, oldVal);
  } else if (!oldVal || newVal !== oldVal) {
    setProp($target, name, newVal);
  }
}

/**
 * @param {HTMLElement} $target
 * @param {{}} newProps
 * @param {{}} oldProps = {}
 */
export function updateProps($target, newProps, oldProps = {}) {
  const props = Object.assign({}, newProps, oldProps);

  if (typeof $target.__radiHandlers !== 'undefined') {
    $target.__radiHandlers.forEach((event) => {
      $target.removeEventListener(...event);
    });

    $target.__radiHandlers = [];
  }

  Object.keys(props).forEach(name => {
    autoUpdate(newProps[name], value => {
      if (name === 'model') {
        name = 'value';
      }
      updateProp($target, name, value, oldProps[name]);
    });
  });
}

/**
 * @param {HTMLElement} $target
 * @param {string} name
 * @param {*} value
 */
export function addEventListener($target, name, value) {
  const exceptions = ['mount', 'destroy'];
  if (isEventProp(name)) {
    if (typeof $target.__radiHandlers === 'undefined') {
      $target.__radiHandlers = [];
    }
    const event = [
      extractEventName(name),
      (e) => {
        if (exceptions.indexOf(name) >= 0) {
          if ($target === e.target) value(e);
        } else
        if (typeof value === 'function') {
          value(e);
        }
      },
    ];
    $target.__radiHandlers.push(event);
    $target.addEventListener(
      event[0],
      event[1],
      false
    );
  }
}
