import buildNode from './buildNode';

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
const r = (Query, props, ...children) => ({
  buildNode: (isSvg, depth = 0) =>
    buildNode[isSvg ? 'svg' : 'html'](depth)(Query, props, ...children),
});

export default r;
