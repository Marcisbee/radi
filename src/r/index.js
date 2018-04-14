import setAttributes from './setAttributes';
import getElementFromQuery from './utils/getElementFromQuery';
import appendChildren from './appendChildren';

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
const r = (Query, props, ...children) => {
  if (typeof Query === 'function' && Query.isComponent) {
    return new Query(children).setProps(props || {});
  }

  if (typeof Query === 'function') {
    const propsWithChildren = props || {};
    propsWithChildren.children = children;
    return Query(propsWithChildren);
  }

  const element = getElementFromQuery(Query);

  if (props !== null) setAttributes(element, props);
  appendChildren(element, children);

  return element;
};

export default r;
