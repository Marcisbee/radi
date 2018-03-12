/**
 * Gets the parent node of given elemement.
 * This is necessary because the parent node of a document fragment is always
 * null and is such cases we'll need to get the parent node of its child.
 * @param {Node} el
 * @return {HTMLElement}
 */
const getParentNode = (el) => {
  return el.parentNode || el.childNodes[0].parentNode;
};

export default getParentNode;
