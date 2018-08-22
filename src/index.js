import GLOBALS from './consts/GLOBALS';
import r from './r';
import listen from './listen';
import Component from './component';
import headless from './component/headless';
import generateId from './utils/generateId';
import mount from './mount';
import patch from './r/patch';
import action from './action';
import worker from './action/worker';
import subscribe from './action/subscribe';
import customTag from './r/customTag';
import customAttribute from './r/customAttribute';
import remountActiveComponents from './utils/remountActiveComponents';
import {} from './custom';

const Radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  listen,
  l: listen,
  worker,
  Component,
  component: Component,
  action,
  subscribe,
  customTag,
  customAttribute,
  headless,
  update: patch,
  patch,
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
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

if (window) window.Radi = Radi;
// export default Radi;
module.exports = Radi;
