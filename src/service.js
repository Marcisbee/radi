import GLOBALS from './consts/GLOBALS';
import { Component } from './component';

class RadiService {
  /**
   * @param  {string}   name
   * @param  {Function} fn
   * @param  {*[]}   args
   * @return {Function}
   */
  add(name, fn, ...args) {
    if (typeof name !== 'string') {
      throw new Error('[Radi.js] Service first argument has to be string');
    }

    if (typeof this[name] !== 'undefined' || typeof Component.prototype[name] !== 'undefined') {
      throw new Error('[Radi.js] Service "' + name + '" is already in use');
    }

    if (typeof fn !== 'function') {
      throw new Error('[Radi.js] Service second argument has to be function');
    }

    const mounted = fn(...args);

    Component.prototype[name] = this[name] = mounted;

    return GLOBALS.SERVICES[name] = mounted;
  }
}

export const Service = new RadiService();
