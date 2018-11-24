import { Subscribe } from './Subscribe';

/**
 * @param {EventTarget} [target=document]
 * @param {string} name
 * @param {Function} transformer
 * @returns {Store}
 */
export function Event(target = document, name, transformer = e => e) {
  const events = name.trim().split(' ');
  let updater = () => {};
  let status = true;
  let eventSubscription = [];

  if (typeof transformer !== 'function') {
    throw new Error(`[Radi.js] Subscription \`${name}\` must be transformed by function`);
  }

  function startListener() {
    events.forEach((event) => {
      function listen(...args) {
        updater(transformer(...args, event))
      }
      eventSubscription.push([event, listen]);
      target.addEventListener(event, listen);
    });
  }

  startListener();

  function factory(value, next) {
    updater = next;
  }

  Object.defineProperty(factory, 'name', {
    value: name || 'update',
  });

  function CustomSubscribe(defaultValue) {
    return Subscribe(factory, 'Event')(defaultValue);
  }

  CustomSubscribe.on = function on() {
    if (status) return;

    eventSubscription = [];
    startListener();
    status = true;
  }

  CustomSubscribe.off = function off() {
    if (!status) return;

    eventSubscription.forEach(([n, e]) => target.removeEventListener(n, e));
    status = false;
  }

  return CustomSubscribe;
}
