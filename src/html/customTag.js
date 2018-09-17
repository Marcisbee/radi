import GLOBALS from '../consts/GLOBALS';

/**
 * @param {string} tagName
 * @param {function} onmount
 * @returns {object}
 */
export function customTag(tagName, render) {
  return GLOBALS.CUSTOM_TAGS[tagName] = {
    name: tagName,
    render: render || (() => {}),
  };
}
