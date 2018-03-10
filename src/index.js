import { r } from './utilities/r';
import { component } from './utilities/component';
import { GLOBALS } from './consts/GLOBALS';
import Condition from './Condition';
import Watchable from './Watchable';
import { register } from './utilities/register';

export const isString = a => typeof a === 'string';

export const isNumber = a => typeof a === 'number';

export const isFunction = a => typeof a === 'function';

export const isNode = a => !!(a && a.nodeType);

export const isWatchable = a => a && a instanceof Watchable;

export const isCondition = a => a && a instanceof Condition;

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
  Condition,
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
