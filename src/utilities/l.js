import Listener from './Listener';

const l = (radiInstance, key, childPath = '') => {
  const listener = new Listener(radiInstance, key, childPath);
  return listener;
};

export default l;
