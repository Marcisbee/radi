import appendChild from './appendChild';

/**
 * @param {HTMLElement} element
 * @param {*[]} children
 * @param {boolean} isSvg
 */
const appendChildren = (element, children, isSvg) => {
  children.forEach(appendChild(element, isSvg));
};

export default appendChildren;
