/**
 * @param {*} value
 * @return {*}
 */
const parseValue = value =>
  (typeof value === 'number' && !isNaN(value) ? `${value}px` : value);

export default parseValue;
