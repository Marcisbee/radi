import GLOBALS from './consts/GLOBALS';
import { service } from './service';
import {
  customAttribute,
  customTag,
  html,
  patch,
} from './html';
import {
  Event,
  Fetcher,
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
} from './custom';

const Radi = {
  v: GLOBALS.VERSION,
  version: GLOBALS.VERSION,
  h: html,
  html,
  customTag,
  customAttribute,
  destroy,
  patch,
  mount,
  service,
  Service: service,
  Event,
  Fetcher,
  Store,
  Subscribe,
  Await,
  Errors,
  Modal,
  Portal,
};

// Pass Radi instance to plugins
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

if (window) window.Radi = Radi;
export default Radi;
