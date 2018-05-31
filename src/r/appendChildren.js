import appendChild from './appendChild';

/**
 * @param {HTMLElement} element
 * @param {*[]} children
 * @param {boolean} isSvg
 * @param {number} depth
 */
const appendChildren = (element, children, isSvg, depth) => {
  children.forEach(appendChild(element, isSvg, depth));
};

export default appendChildren;
