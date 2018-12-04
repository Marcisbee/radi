import GLOBALS from './consts/GLOBALS';
import { Service } from './service';
import {
  customAttribute,
  html,
  patch,
} from './html';
import {
  Event,
  Fetch,
  Socket,
  Store,
  Subscribe,
} from './store';
import { mount } from './mount';
import { destroy } from './destroy';
import {
  Await,
  Errors,
  Modal,
  Portal,
  Loading,
} from './custom';

const Radi = {
  v: GLOBALS.VERSION,
  version: GLOBALS.VERSION,
  h: html,
  html,
  customAttribute,
  destroy,
  patch,
  mount,
  Service,

  Event,
  Fetch,
  Socket,
  Store,
  Subscribe,

  Await,
  Errors,
  Modal,
  Portal,
  Loading,
};

// Pass Radi instance to plugins
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

if (window) window.Radi = Radi;
export default Radi;
