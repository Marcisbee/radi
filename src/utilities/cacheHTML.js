import GLOBALS from '../consts/GLOBALS';
import createElement from './createElement';

const cacheHTML = (query) =>
  GLOBALS.HTML_CACHE[query] ||
  (GLOBALS.HTML_CACHE[query] = createElement(query));

export default cacheHTML;
