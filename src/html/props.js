
function autoUpdate(value, fn) {
  if (typeof value === 'function' && value.__radiStateUpdater) {
    return value(fn);
  }
  return fn(value);
}

function setBooleanProp($target, name, value) {
  if (value) {
    $target.setAttribute(name, value);
    $target[name] = true;
  } else {
    $target[name] = false;
  }
}

function removeBooleanProp($target, name) {
  $target.removeAttribute(name);
  $target[name] = false;
}

function isEventProp(name) {
  return /^on/.test(name);
}

function extractEventName(name) {
  return name.slice(2).toLowerCase();
}

function isCustomProp(name) {
  return isEventProp(name);
}

export function setProp($target, name, value) {
  if (name === 'style') {
    setStyles($target, value);
  } else if (isCustomProp(name)) {

  } else if (name === 'className') {
    $target.setAttribute('class', value);
  } else if (typeof value === 'boolean') {
    setBooleanProp($target, name, value);
  } else {
    $target.setAttribute(name, value);
  }
}

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

export function setStyles($target, styles) {
  Object.keys(styles).forEach(name => {
    autoUpdate(styles[name], value => {
      $target.style[name] = value;
    });
  });
}

export function setProps($target, props) {
  Object.keys(props).forEach(name => {
    autoUpdate(props[name], value => {
      if (name === 'class' || name === 'className') {
        if (Array.isArray(value)) {
          value = value.filter(v => v && typeof v !== 'function').join(' ');
        }
      }
      setProp($target, name, value);
    });
  });
}

export function updateProp($target, name, newVal, oldVal) {
  if (!newVal) {
    removeProp($target, name, oldVal);
  } else if (!oldVal || newVal !== oldVal) {
    setProp($target, name, newVal);
  }
}

export function updateProps($target, newProps, oldProps = {}) {
  const props = Object.assign({}, newProps, oldProps);
  Object.keys(props).forEach(name => {
    autoUpdate(newProps[name], value => {
      updateProp($target, name, value, oldProps[name]);
    });
  });
}

export function addEventListeners($target, props) {
  const exceptions = ['mount', 'destroy'];
  Object.keys(props).forEach(name => {
    if (isEventProp(name)) {
      $target.addEventListener(
        extractEventName(name),
        (e) => {
          if (exceptions.indexOf(name) >= 0) {
            if ($target === e.target) props[name](e);
          } else {
            props[name](e);
          }
        },
        false
      );
    }
  });
}
