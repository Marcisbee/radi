import GLOBALS from '../consts/GLOBALS';

/**
 * @param {string} attributeName
 * @param {function} caller
 * @param {Object} object
 * @returns {Object}
 */
export function customAttribute(attributeName, caller, {
  allowedTags,
  addToElement,
} = {}) {
  return GLOBALS.CUSTOM_ATTRIBUTES[attributeName] = {
    name: attributeName,
    caller,
    allowedTags: allowedTags || null,
    addToElement,
  };
}
