import GLOBALS from './consts/GLOBALS';
import r from './r';
import listen from './listen';
import component, { Component } from './component';
import mount from './mount';
import remountActiveComponents from './utils/remountActiveComponents';

const _radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  listen,
  l: listen,
  component,
  Component,
  headless: (key, comp) => {
    // TODO: Validate component and key
    const mountedComponent = new comp();
    mountedComponent.mount();
    return (GLOBALS.HEADLESS_COMPONENTS['$'.concat(key)] = mountedComponent);
  },
  mount,
  freeze: () => {
    GLOBALS.FROZEN_STATE = true;
  },
  unfreeze: () => {
    GLOBALS.FROZEN_STATE = false;
    remountActiveComponents();
  },
};

// Pass Radi instance to plugins
_radi.plugin = (fn, ...args) => fn(_radi, ...args);

if (window) window.$Radi = _radi;

const radi = _radi;
export default radi;