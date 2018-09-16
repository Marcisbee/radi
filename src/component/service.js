import { Component } from './Component';
import GLOBALS from '../consts/GLOBALS';

/**
 * @param  {string}   key
 * @param  {Function} fn
 * @param  {*[]}   args
 * @return {Function}
 */
export function service(key, fn, ...args) {
  if (typeof key !== 'string') {
    throw new Error('[Radi.js] Service first argument has to be string');
  }

  if (typeof fn !== 'function') {
    throw new Error('[Radi.js] Service second argument has to be function');
  }

  const name = '$'.concat(key);
  const Comp = new Component(fn, key);
  const mounted = fn.call(Comp, ...args);

  Comp.trigger('mount');
  Component.prototype[name] = mounted;

  return GLOBALS.SERVICES[name] = mounted;
}
