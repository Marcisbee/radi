import GLOBALS from './consts/GLOBALS';
import r from './r';
import listen from './listen';
import component from './component';
import Component from './component';
import mount from './mount';
import remountActiveComponents from './utils/remountActiveComponents';

// Descriptor for actions
function action(target, key, descriptor) {
  const act = descriptor.value;
  descriptor.value = function (...args) {
    this.setState.call(this, act.call(this, ...args));
  }
  return descriptor;
}

// Descriptor for subscriptions
function subscribe(container, eventName, triggerMount) {
  // TODO: Remove event after no longer needed / Currently overrides existing
  // TODO: Do not override existing event - use EventListener
  // TODO: triggerMount should trigger this event on mount too
  return function (target, key, descriptor) {
    let name = 'on' + (eventName || key);
    let fn = function (...args) {
      descriptor.value.call(this, ...args);
    }

    container[name] = fn;
    // if (container && container.addEventListener) {
    //   container.addEventListener(name, fn);
    //   self.when('destroy', () => {
    //     container.removeEventListener(name, fn);
    //   });
    // }
    // console.log(target, key, descriptor, container[name], name, fn, fn.radiGlobalEvent);
    return descriptor;
  }
}

const Radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  listen,
  l: listen,
  component,
  Component,
  action,
  subscribe,
  headless: (key, comp) => {
    // TODO: Validate component and key
    const mountedComponent = new comp();
    mountedComponent.mount();
    return GLOBALS.HEADLESS_COMPONENTS['$'.concat(key)] = mountedComponent;
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
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

if (window) window.Radi = Radi;
export default Radi;
