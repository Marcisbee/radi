/**
 * @param {*} value
 * @returns {*[]}
 */
const ensureArray = value => {
  if (Array.isArray(value)) return value;
  return [value];
};

export default ensureArray;
