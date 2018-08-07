import Component from './Component';
import GLOBALS from '../consts/GLOBALS';

const headless = (key, Comp) => {
  // TODO: Validate component and key
  const name = '$'.concat(key);
  const mountedComponent = new Comp();
  mountedComponent.mount();
  Component.prototype[name] = mountedComponent;
  return GLOBALS.HEADLESS_COMPONENTS[name] = mountedComponent;
};

export default headless;
