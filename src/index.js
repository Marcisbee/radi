import GLOBALS from './consts/GLOBALS';
import { service } from './service';
import {
  customAttribute,
  customTag,
  html,
  patch,
} from './html';
import {
  Fetcher,
  Store,
  Subscribe,
} from './store';
import { mount } from './mount';
import { destroy } from './destroy';
import { Validator } from './custom';

const Radi = {
  v: GLOBALS.VERSION,
  version: GLOBALS.VERSION,
  h: html,
  html,
  Fetcher,
  Store,
  customTag,
  customAttribute,
  destroy,
  patch,
  mount,
  service,
  Service: service,
  Subscribe,
  Validator,
};

// Pass Radi instance to plugins
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

if (window) window.Radi = Radi;
export default Radi;
