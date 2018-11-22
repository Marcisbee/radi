import { Store } from './Store';

/**
 * @param {Function} subscriber
 * @param {string} name
 * @returns {Store}
 */
export function Subscribe(subscriber, name = subscriber.name) {
  let factory = (state, value) => value;

  Object.defineProperty(factory, 'name', {
    value: name,
  });

  const subStore = new Store(null, 'Subscriber');

  function caller(value) {
    subStore.dispatch(factory, value);
    subscriber(value, caller);
    return subStore;
  }

  return caller;
}
