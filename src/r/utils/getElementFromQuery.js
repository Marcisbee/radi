/**
 * @param {*} query
 * @returns {Node}
 */
const getElementFromQuery = (query, isSvg) => {
  if (typeof query === 'string' || typeof query === 'number')
    return query !== 'template'
      ? isSvg || query === 'svg'
        ? document.createElementNS(
            "http://www.w3.org/2000/svg",
            query
          )
        : document.createElement(query)
      : document.createDocumentFragment();
  console.warn(
    '[Radi.js] Warn: Creating a JSX element whose query is not of type string, automatically converting query to string.'
  );
  return document.createElement(query.toString());
};

export default getElementFromQuery;
