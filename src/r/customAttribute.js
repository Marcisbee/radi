import GLOBALS from '../consts/GLOBALS';

/**
 * @param {string} attributeName
 * @param {function} caller
 * @param {object} object
 * @returns {object}
 */
const customAttribute = (attributeName, caller, {
  allowedTags,
  addToElement,
} = {}) => GLOBALS.CUSTOM_ATTRIBUTES[attributeName] = {
  name: attributeName,
  caller,
  allowedTags: allowedTags || null,
  addToElement,
};

export default customAttribute;
