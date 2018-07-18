import filterNode from './filterNode';
import Structure from '../Structure';
import flatten from '../../utils/flatten';

/**
 * @param {*[]} raw
 * @param {HTMLElement} parent
 * @param {string} raw
 * @returns {HTMLElement}
 */
const explode = (raw, parent, next, depth = 0, isSvg) => {
  let nodes = flatten([raw]).map(filterNode);
  // console.log('EXPLODE', nodes)

  // console.log('explode', {parent, nodes})

  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] instanceof Structure && !nodes[i].html) {
      // let pp = depth === 0 ? parent : nodes[i];
      // let pp = parent;
      // console.log('EXPLODE 1', parent.$depth, depth, parent.$redirect, nodes[i].$redirect)
      if (parent.children.length <= 0) {
        if (!parent.$redirect) {
          parent.$redirect = [nodes[i]];
        } else {
          parent.$redirect.push(nodes[i]);
        }
      }

      if (!parent.$redirect && nodes[i].children) {
        parent.children = parent.children.concat(nodes[i].children);
      }

      if (typeof nodes[i].render === 'function') {
        const n = i;
        nodes[i].render(v => {
          // if (parent.children.length <= 0) {
          //   if (!parent.$redirect) {
          //     parent.$redirect = [nodes[n]];
          //   } else {
          //     parent.$redirect.push(nodes[n]);
          //   }
          // }
          // console.log('EXPLODE 2', nodes[n], v, parent.$depth, nodes[n].$depth)
          next(v);
          // nodes[n].mount();
        }, nodes[i], depth + 1, isSvg);
      }
    }
  }

  return;
}

export default explode;
