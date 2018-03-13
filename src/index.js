import r from './r';
import listen from './listen';
import component from './component';
import GLOBALS from './consts/GLOBALS';
import mount from './mount';
import remountActiveComponents from './utils/remountActiveComponents';

export const _Radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  listen,
  l: listen,
  component,
  mount,
  freeze: () => {
    GLOBALS.FROZEN_STATE = true;
  },
  unfreeze: () => {
    GLOBALS.FROZEN_STATE = false;
    remountActiveComponents();
  },
};

if (window) window.$Radi = _Radi;
