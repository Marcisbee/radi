/**
 * @param {*} obj
 * @returns {*}
 */
const clone = obj => {
  if (typeof obj !== 'object') return obj;
  if (obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(clone);

  const cloned = Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      [key]: clone(obj[key]),
    }),
    {}
  );

  return cloned;
};

export default clone;
