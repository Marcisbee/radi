import { Store } from './Store';
import { Subscribe } from './Subscribe';

/**
 * @param {Promise} resolver
 * @param {Function} success
 * @param {Function} error
 * @param {boolean} instant
 * @returns {Store}
 */
export function Fetch(resolver, success, error, instant = false) {
  let init = false;
  let trigger = () => {};
  const data = {};

  const loading = new Store(false, null);

  if (typeof resolver !== 'function') {
    throw new Error('[Radi.js] Fetch first parameter must be function that returns promise');
  }

  function factory(value, next) {
    trigger = next;
    if (instant && !init) {
      init = true;
      CustomSubscribe.fetch();
    }
  }

  Object.defineProperty(factory, 'name', {
    value: resolver.name || 'update',
  });

  function CustomSubscribe(defaultValue) {
    return Subscribe(factory, 'Fetch')(defaultValue);
  }

  CustomSubscribe.loading = loading;
  CustomSubscribe.cache = true;

  CustomSubscribe.fetch = function fetch(...args) {
    const id = JSON.stringify(args);
    if (CustomSubscribe.cache && typeof data[id] !== 'undefined') {
      trigger(data[id]);
      return Promise.resolve();
    }

    loading.update(true);

    return resolver(...args)
      .then(((output) => {
        const outputData = typeof success === 'function'
          ? success(output)
          : output;
        data[id] = outputData;
        trigger(outputData);
        loading.update(false);
      }))
      .catch(((err) => {
        const errorData = typeof error === 'function'
          ? error(err)
          : err;
        // trigger({ error: data });
        loading.update(false);
        console.error(errorData);
      }));
  };

  return CustomSubscribe;
}
