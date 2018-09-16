import GLOBALS from '../consts/GLOBALS';

/**
 * @param {string} tagName
 * @param {function} onmount
 * @param {function} ondestroy
 * @returns {object}
 */
export function customTag(tagName, onmount, ondestroy) {
  return GLOBALS.CUSTOM_TAGS[tagName] = {
    name: tagName,
    onmount: onmount || (() => {}),
    ondestroy: ondestroy || (() => {}),
    saved: null,
  };
}
