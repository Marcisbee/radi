import { Store } from './Store';

/**
 * @param {Function} subscriber
 * @returns {Store}
 */
export function Subscribe(subscriber) {
  const subStore = new Store(null);

  function caller(value) {
    subStore.update(value);
    subscriber(value, caller);
    return subStore;
  }

  return caller;
}
