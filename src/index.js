import GLOBALS from './consts/GLOBALS';
import r from './r';
import listen from './listen';
import component from './component';
import Component from './component';
import mount from './mount';
import remountActiveComponents from './utils/remountActiveComponents';

function createWorker(fn) {
  let fire = () => {}

  var blob = new Blob([`self.onmessage = function(e) {
    self.postMessage((${fn.toString()})(e.data));
  }`], { type: 'text/javascript' })

  var url = window.URL.createObjectURL(blob)
  let myWorker = new Worker(url)

  myWorker.onmessage = e => { fire(e.data, null) }
  myWorker.onerror = e => { fire(null, e.data) }

  return arg => new Promise((resolve, reject) => {
    fire = (data, err) => !err ? resolve(data) : reject(data)
    myWorker.postMessage(arg)
  })
}

// Descriptor for worker
function worker(target, key, descriptor) {
  const act = descriptor.value;

  const promisedWorker = createWorker(act);

  descriptor.value = function (...args) {
    promisedWorker(...args).then(newState => {
      this.setState.call(this, newState);
    })
  }
  return descriptor;
}

// Descriptor for actions
function action(target, key, descriptor) {
  const act = descriptor.value;
  descriptor.value = function (...args) {
    return this.setState.call(this, act.call(this, ...args));
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
      return descriptor.value.call(this, ...args);
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
  worker,
  component,
  Component,
  action,
  subscribe,
  headless: (key, comp) => {
    // TODO: Validate component and key
    let name = '$'.concat(key);
    const mountedComponent = new comp();
    mountedComponent.mount();
    Component.prototype[name] = mountedComponent;
    return GLOBALS.HEADLESS_COMPONENTS[name] = mountedComponent;
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
