import {
  fireEvent,
  insertAfter,
  render,
} from './html';
import { ensureArray } from './utils';

/**
 * @typedef {Object} Mount
 * @property {Object} component
 * @property {Object} node
 * @property {function} destroy
 */

/**
 * @param  {*|*[]} data
 * @param  {HTMLElement} container
 * @param  {HTMLElement} after
 * @return {HTMLElement[]}
 */
export function mount(data, container, after) {
  const nodes = ensureArray(data);

  return ensureArray(nodes).map(node => {
    const renderedNode = render(node, container);

    if (Array.isArray(renderedNode)) {
      return mount(renderedNode, container, after);
    }
    
    if (after && after.parentNode) {
      after = insertAfter(renderedNode, after, after.parentNode);
      fireEvent('mount', after);
      return after;
    }

    if (!container) {
      console.log('[Radi] Mount canceled');
      return nodes;
    }

    const mountedEl = container.appendChild(renderedNode);
    fireEvent('mount', renderedNode);
    return mountedEl;
  });
}
