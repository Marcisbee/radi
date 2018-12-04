import { Subscribe } from './Subscribe';

/**
 * @param {WebSocket} ws
 * @param {Function} transformer
 * @returns {Store}
 */
export function Socket(ws, transformer = (data) => data) {
  const name = ws.url;
  let updater = () => {};

  if (typeof transformer !== 'function') {
    throw new Error(`[Radi.js] Socket \`${name}\` must be transformed by function`);
  }

  ws.onmessage = (e) => updater(transformer(e.data));

  function factory(value, next) {
    updater = next;
  }

  Object.defineProperty(factory, 'name', {
    value: name || 'onmessage',
  });

  return function CustomSubscribe(defaultValue) {
    return Subscribe(factory, 'Socket')(defaultValue);
  };
}
