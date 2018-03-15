import appendChild from './appendChild';

/**
 * @param {HTMLElement} element
 * @param {*[]} children
 */
const appendChildren = (element, children) => {
  children.forEach(appendChild(element));
};

export default appendChildren;
