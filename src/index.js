import GLOBALS from './consts/GLOBALS';
import { Service } from './service';
import { destroy } from './destroy';
import { mount } from './mount';
import {
  Await,
  Errors,
  Loading,
  Modal,
  Portal,
} from './custom';
import {
  Event,
  Fetch,
  Socket,
  Store,
  Subscribe,
} from './store';
import {
  customAttribute,
  html,
  patch,
} from './html';

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

if (typeof window !== 'undefined') window.Radi = Radi;
export default Radi;
