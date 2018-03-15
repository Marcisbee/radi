/**
 * @param {*} obj
 * @returns {*}
 */
const clone = (obj) => {
  if (typeof obj !== 'object') return obj;
  if (obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(clone);

  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = clone(obj[key]);
    }
  }

  return cloned;
};

export default clone;
