
/**
 * @param       {EventTarget} [target=document] [description]
 * @constructor
 */
export function Subscribe(target = document) {
  return {
    on: (event, fn = e => e) => {
      let eventSubscription = null;
      let staticDefaults = null;
      let staticUpdate = null;
      let state = false;
      const transformer = typeof fn === 'object'
        ? (e) => (Object.keys(fn)
          .reduce((acc, key) => ({
            ...acc,
            [key]: e[key],
          }), {}))
        : fn;

      if (typeof transformer !== 'function') {
        throw new Error(`[Radi.js] Subscription \`${event}\` must be transformed by function`);
      }

      function updater(defaults) {
        return update => {
          state = true;
          staticDefaults = defaults;
          staticUpdate = update;
          target.addEventListener(event,
            eventSubscription = (...args) => update(transformer(...args)));
          return defaults;
        };
      }

      updater.stop = () => (state &&
        (target.removeEventListener(event, eventSubscription), state = !state)
      );
      updater.start = () => (!state && updater(staticDefaults)(staticUpdate));

      return updater;
    },
  };
}
