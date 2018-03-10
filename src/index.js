import r from './utilities/r';
import l from './utilities/l';
import component from './utilities/component';
import GLOBALS from './consts/GLOBALS';
import register from './utilities/register';
import mount from './mount';
import remountActiveComponents from './remountActiveComponents';

export const _Radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  l,
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

if (window) window.$Radi = _Radi;
