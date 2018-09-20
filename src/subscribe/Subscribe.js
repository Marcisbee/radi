
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
      let staticUpdate = null;
      let state = false;

      if (typeof transformer !== 'function') {
        throw new Error(`[Radi.js] Subscription \`${eventHolder}\` must be transformed by function`);
      }

      function updater(defaults) {
        return update => {
          state = true;
          staticDefaults = defaults;
          staticUpdate = update;
          events.map(event => target.addEventListener(event,
            eventSubscription = (...args) =>
              update(transformer(...args, event), false, `Subscribe: ${event}`)));
          return defaults;
        };
      }

      updater.stop = () => {
        if (state) {
          events.map(event => target.removeEventListener(event, eventSubscription));
        }
        return state = !state;
      };
      updater.start = () => (!state && updater(staticDefaults)(staticUpdate));

      return updater;
    },
  };
}
