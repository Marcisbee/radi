import setAttributes from './setAttributes';
import GLOBALS from '../consts/GLOBALS';
import isRegisteredComponent from './utils/isRegisteredComponent';
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
  if (isRegisteredComponent(query)) {
    return new GLOBALS.REGISTERED[query]().setProps(props || {});
  }

  const element = getElementFromQuery(query);
  element.key = generateId();

  if (props !== null) setAttributes(element, props);

  appendChildren(element, children);

  return element;
};

export default r;
