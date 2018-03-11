import GLOBALS from '../../consts/GLOBALS';

/**
 * @param {string} query
 * @returns {HTMLElement}
 */
const cacheHTML = (query) =>
  GLOBALS.HTML_CACHE[query] ||
  (GLOBALS.HTML_CACHE[query] = document.createElement(query));

export default cacheHTML;
