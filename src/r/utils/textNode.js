
/**
 * @param {string} value
 * @returns {HTMLElement}
 */
const textNode = value => (
  document.createTextNode(
    (typeof value === 'object'
    ? JSON.stringify(value)
    : value)
  )
);

export default textNode;
