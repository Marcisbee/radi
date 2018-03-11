import Listener from './Listener';

const l = (component, key, childPath = '') => {
  const listener = new Listener(component, key, childPath);
  return listener;
};

export default l;
