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
  Action,
  Effect,
  Event,
  Listen,
  Merge,
  Store,
  Watch,
} from './store';
import {
  customAttribute,
  html,
  patch,
  onDestroy,
  onMount,
  shouldUpdate,
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

  onDestroy,
  onMount,
  shouldUpdate,

  Action,
  Effect,
  Event,
  Listen,
  Merge,
  Store,
  Watch,

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
