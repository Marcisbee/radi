import setAttributes from './setAttributes';
import getElementFromQuery from './utils/getElementFromQuery';
import appendChildren from './appendChildren';

const htmlCache = {};
const svgCache = {};

const memoizeHTML = query => htmlCache[query]
  || (htmlCache[query] = getElementFromQuery(query, false));
const memoizeSVG = query => svgCache[query]
  || (svgCache[query] = getElementFromQuery(query, true));

/**
 * @param {boolean} isSvg
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
const buildNode = (isSvg, Query, props, ...children) => {
  if (typeof Query === 'function' && Query.isComponent) {
    return new Query(children).setProps(props || {});
  }

  if (typeof Query === 'function') {
    const propsWithChildren = props || {};
    propsWithChildren.children = children;
    return Query(propsWithChildren);
  }

  const copyIsSvg = isSvg || Query === 'svg';

  const element = (copyIsSvg ? memoizeSVG(Query) : memoizeHTML(Query))
    .cloneNode(false);

  if (props !== null) setAttributes(element, props);
  appendChildren(element, children, copyIsSvg);

  if (element.onload) element.onload(element);

  return element;
};

export default {
  html: (...args) => buildNode(false, ...args),
  svg: (...args) => buildNode(true, ...args),
};
