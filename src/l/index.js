import Listener from './Listener';

const l = (component, key, childPath = '') => {
  return new Listener(component, key, childPath);
};

export default l;
