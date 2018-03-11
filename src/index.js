import r from './r';
import l from './l';
import component from './component';
import GLOBALS from './consts/GLOBALS';
import register from './register';
import mount from './mount';
import remountActiveComponents from './utils/remountActiveComponents';

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
