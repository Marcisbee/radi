/**
 * @param {*} query
 * @returns {Node}
 */
const getElementFromQuery = query => {
  if (typeof query === 'string') return query !== 'template'
    ? document.createElement(query)
    : document.createDocumentFragment();
  console.warn(
    '[Radi.js] Warn: Creating a JSX element whose query is not of type string, automatically converting query to string.'
  );
  return document.createElement(query.toString());
};

export default getElementFromQuery;
