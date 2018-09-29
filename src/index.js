import GLOBALS from './consts/GLOBALS';
import { service } from './service';
import {
  customAttribute,
  customTag,
  html,
  patch,
  render,
} from './html';
import { Store } from './store';
import { Subscribe } from './subscribe';
import { Validator } from './custom';

const Radi = {
  v: GLOBALS.VERSION,
  version: GLOBALS.VERSION,
  h: html,
  html,
  Store,
  customTag,
  customAttribute,
  patch,
  mount: render,
  service,
  Subscribe,
  Validator,
};

// Pass Radi instance to plugins
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

if (window) window.Radi = Radi;
export default Radi;
