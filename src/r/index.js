import setAttributes from './setAttributes';
import GLOBALS from '../consts/GLOBALS';
import getElementFromQuery from './utils/getElementFromQuery';
import generateId from '../utils/generateId';
import appendChildren from './appendChildren';

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
const r = (query, props, ...children) => {
  // TODO: component with children?
  if (typeof query.isComponent === 'function' && query.isComponent()) {
    return new query().setProps(props || {});
  }

  const element = getElementFromQuery(query);
  element.key = generateId();

  if (props !== null) setAttributes(element, props);

  appendChildren(element, children);

  return element;
};

export default r;
