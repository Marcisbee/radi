import Listener from './Listener';

const l = (component, key, childPath = '') => new Listener(component, key, childPath);

export default l;
