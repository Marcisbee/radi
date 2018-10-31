import { Store } from '../store';

/**
 * @param       {EventTarget} [target=document] [description]
 * @constructor
 */
export function Subscribe(target = document) {
  return {
    on: (eventHolder, transformer = e => e) => {
      const events = eventHolder.trim().split(' ');
      let eventSubscription = null;
      let staticDefaults = null;
      let staticStore = null;
      let state = false;

      if (typeof transformer !== 'function') {
        throw new Error(`[Radi.js] Subscription \`${eventHolder}\` must be transformed by function`);
      }

      function updater(defaults, newStore) {
        const store = typeof newStore !== 'undefined' ? newStore : new Store(defaults);

        state = true;
        staticDefaults = defaults;
        staticStore = store;
        events.forEach(event => target.addEventListener(event,
          eventSubscription = (...args) =>
            store.dispatch(() => transformer(...args, event))
        ));

        return store;
      }

      updater.stop = () => {
        if (state) {
          events.forEach(event => target.removeEventListener(event, eventSubscription));
        }
        return state = !state;
      };
      updater.start = () => !state && updater(staticDefaults, staticStore);

      return updater;
    },
  };
}
