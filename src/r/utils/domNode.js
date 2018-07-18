
/**
 * @param {string} value
 * @returns {HTMLElement}
 */
const domNode = ({query, props, children} = {}) => {
  let el = document.createElement(query);
  return el;
};

export default domNode;
