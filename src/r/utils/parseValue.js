/**
 * @param {*} value
 * @return {*}
 */
const parseValue = value =>
  typeof value === 'number' && !Number.isNaN(value) ? `${value}px` : value;

export default parseValue;
