/**
 * @param {*} value
 * @return {*}
 */
const parseClass = value => {
  if (Array.isArray(value)) {
    return value.filter(item => item).join(' ')
  }
  return value;
}

export default parseClass;
