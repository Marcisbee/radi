import {
  fireEvent,
  insertAfter,
  render,
  evaluate,
} from './html';
import { ensureArray, flatten } from './utils';

export function mount(node, container) {
  const nodes = flatten([evaluate(node)]);
  const dom = render(nodes, container);

  dom.forEach((item) => {
    container.appendChild(item);
    fireEvent('mount', item);
  });

  return {
    nodes,
    dom,
  };
}

// /**
//  * @typedef {Object} Mount
//  * @property {Object} component
//  * @property {Object} node
//  * @property {function} destroy
//  */

// /**
//  * @param  {*|*[]} data
//  * @param  {HTMLElement} container
//  * @param  {HTMLElement} after
//  * @return {HTMLElement[]}
//  */
// export function mount(data, container, after) {
//   const nodes = ensureArray(data);

//   return nodes.map(node => {
//     const renderedNode = render(node, container);

//     if (Array.isArray(renderedNode)) {
//       return mount(renderedNode, container, after);
//     }
    
//     if (after && after.parentNode) {
//       after = insertAfter(renderedNode, after, after.parentNode);
//       fireEvent('mount', renderedNode);
//       return after;
//     }

//     if (!container) {
//       console.log('[Radi] Mount canceled');
//       return nodes;
//     }

//     const mountedEl = container.appendChild(renderedNode);
//     fireEvent('mount', renderedNode);
//     return mountedEl;
//   });
// }
