import r from './utilities/r';
import component from './utilities/component';
import GLOBALS from './consts/GLOBALS';
import register from './utilities/register';
import mount from './mount';

export const isString = a => typeof a === 'string';

export const isNumber = a => typeof a === 'number';

export const isFunction = a => typeof a === 'function';

export const isNode = a => !!(a && a.nodeType);

export const isComponent = a => !!(a && a.__radi);

export const getEl = (parent) =>
  (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el);

export const text = str => document.createTextNode(str);

export const EMPTY_NODE = text('');

export const _Radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  l: f => f,
  component,
  mount,
  register,
  freeze: () => {
    GLOBALS.FROZEN_STATE = true;
  },
  unfreeze: () => {
    GLOBALS.FROZEN_STATE = false;
    remountActiveComponents();
  },
};

window.$Radi = _Radi;

export const remountActiveComponents = () => {
  for (let component of GLOBALS.ACTIVE_COMPONENTS) {
    if (typeof component.onMount === 'function') {
      component.onMount(component)
    }
  }
};
