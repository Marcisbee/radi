import GLOBALS from '../consts/GLOBALS';

/**
 * @param {string} tagName
 * @param {function} onmount
 * @param {function} ondestroy
 * @returns {object}
 */
const customTag = (tagName, onmount, ondestroy) => GLOBALS.CUSTOM_TAGS[tagName] = {
  name: tagName,
  onmount: onmount || (() => {}),
  ondestroy: ondestroy || (() => {}),
  saved: null,
};

export default customTag;
