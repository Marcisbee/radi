import GLOBALS from '../consts/GLOBALS';

export function setAttribute(dom, key, value) {
  if (typeof GLOBALS.CUSTOM_ATTRIBUTES[key] !== 'undefined') {
    const { allowedTags } = GLOBALS.CUSTOM_ATTRIBUTES[key];

    if (!allowedTags || (
      allowedTags
        && allowedTags.length > 0
        && allowedTags.indexOf(dom.localName) >= 0
    )) {
      if (typeof GLOBALS.CUSTOM_ATTRIBUTES[key].caller === 'function') {
        GLOBALS.CUSTOM_ATTRIBUTES[key].caller(dom, value);
      }
      if (!GLOBALS.CUSTOM_ATTRIBUTES[key].addToElement) return;
    }
  }

  if (typeof value === 'function' && key.startsWith('on')) {
    const eventType = key.slice(2).toLowerCase();
    dom.__radiHandlers = dom.__radiHandlers || {};
    dom.removeEventListener(eventType, dom.__radiHandlers[eventType]);
    dom.__radiHandlers[eventType] = value;
    dom.addEventListener(eventType, dom.__radiHandlers[eventType]);
  } else if (key === 'checked' || key === 'value' || key === 'className') {
    dom[key] = value;
  } else if (key === 'style' && typeof value === 'object') {
    Object.assign(dom.style, value);
  } else if (key === 'ref' && typeof value === 'function') {
    value(dom);
  } else if (key === 'key') {
    dom.__radiKey = value;
  } else if (typeof value !== 'object' && typeof value !== 'function') {
    if (value) {
      dom.setAttribute(key, value);
    } else {
      dom.removeAttribute(key);
    }
  }
}
