/**
 * @param {*} query
 * @returns {Node}
 */
const getElementFromQuery = (query) => {
  if (typeof query === 'string') return document.createElement(query);
  if (query instanceof Node) return query.cloneNode(false);
  return document.createDocumentFragment();
};

export default getElementFromQuery;
