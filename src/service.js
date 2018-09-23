import GLOBALS from './consts/GLOBALS';

/**
 * @param  {string}   name
 * @param  {Function} fn
 * @param  {*[]}   args
 * @return {Function}
 */
export function service(name, fn, ...args) {
  if (typeof name !== 'string') {
    throw new Error('[Radi.js] Service first argument has to be string');
  }

  if (typeof fn !== 'function') {
    throw new Error('[Radi.js] Service second argument has to be function');
  }

  const mounted = fn(...args);

  service.prototype[name] = mounted;

  return GLOBALS.SERVICES[name] = mounted;
}
