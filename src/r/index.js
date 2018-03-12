import setAttributes from './setAttributes';
import GLOBALS from '../consts/GLOBALS';
import getElementFromQuery from './utils/getElementFromQuery';
import appendChildren from './appendChildren';

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
const r = (query, props, ...children) => {
  if (typeof query.isComponent === 'function' && query.isComponent()) {
    return new query(children).setProps(props || {});
  }

  const element = getElementFromQuery(query);

  if (props !== null) setAttributes(element, props);
  appendChildren(element, children);

  return element;
};

export default r;
