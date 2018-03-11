import cacheHtml from './cacheHtml';

/**
 * @param {*} query
 * @returns {Node}
 */
const getElementFromQuery = (query) => {
  if (typeof query === 'string') return cacheHtml(query).cloneNode(false);
  if (isNode(query)) return query.cloneNode(false);
  return document.createDocumentFragment();
};

export default getElementFromQuery;
