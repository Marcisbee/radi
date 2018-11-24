import { Store } from './Store';

/**
 * @param {Function} subscriber
 * @param {string} name
 * @returns {Store}
 */
export function Subscribe(subscriber, name) {
  let factory = (state, value) => value;

  Object.defineProperty(factory, 'name', {
    value: subscriber.name || 'update',
  });

  const subStore = new Store(null, name || 'Subscribe');

  function caller(value) {
    subStore.dispatch(factory, value);
    subscriber(value, caller);
    return subStore;
  }

  return caller;
}
