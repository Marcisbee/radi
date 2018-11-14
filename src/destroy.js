import { destroyTree } from './html';
import { ensureArray } from './utils';

/**
 * @param  {HTMLElement} node
 * @param  {function} next
 */
export function beforeDestroy(node, next) {
  if (typeof node.beforedestroy === 'function') {
    return node.beforedestroy(next);
  }

  return next();
}

/**
 * @param  {*|*[]} data
 */
export function destroy(data) {
  const nodes = ensureArray(data);

  nodes.forEach(node => {
    if (!(node instanceof Node)) return;

    if (node.__radiPoint && node.__radiPoint.dom && node.__radiPoint.dom.length > 0) {
      node.__radiPoint.dom.forEach(destroy);
    }

    const parent = node.parentNode;
    if (node instanceof Node && parent instanceof Node) {
      beforeDestroy(node, () => {
        // This is for async node removals
        parent.removeChild(node);
        destroyTree(node);
      });
    }
  });
}
