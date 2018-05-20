import buildNode from './buildNode';

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
const r = (Query, props, ...children) => ({
  buildNode: isSvg =>
    buildNode[isSvg ? 'svg' : 'html'](Query, props, ...children),
});

export default r;
