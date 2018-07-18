// import Component from './component/Component';
import Listener from './listen/Listener';
import flatten from './utils/flatten';
import filterNode from './r/utils/filterNode';
import append from './r/utils/append';
import mountChildren from './r/mountChildren';
import textNode from './r/utils/textNode';
import patch from './r/patch';

/**
 * Appends structure[] to dom node
 * @param {*} component
 * @param {string} id
 * @param {boolean} isSvg
 * @param {number} depth
 * @returns {HTMLElement|Node}
 */
const mount = (raw, parent, after = false, isSvg = false, depth = 0) => {
  parent = typeof parent === 'string' ? document.getElementById(parent) : parent;
  let nodes = flatten([raw]).map(filterNode);

  // console.log(1, 'MOUNT')

  for (var i = 0; i < nodes.length; i++) {
    const ni = i;
    const nn = nodes[i];

    // console.log(2, nodes[i])
    if (nn instanceof Node) {
      append(nn, parent, after);
    } else
    if (nn && typeof nn.render === 'function') {
      // nn.$pointer = text('[pointer]');
      nn.$pointer = textNode('');
      append(nn.$pointer, parent, after);

      nodes[i].render(rendered => {
        // console.log(3, rendered)

        // Abort! Pointer was destroyed
        if (nn.$pointer === false) return false;

        for (var n = 0; n < rendered.length; n++) {
          if (nn.$pointer) {
            append(rendered[n], nn.$pointer, true);
          } else {
            append(rendered[n], parent, after);
          }
        }

        mountChildren(nn, nn.$isSvg, depth + 1);
      }, nn, depth, isSvg);
    }

    // if (!nn.html) {
    //   nn.$pointer = text('[pointer]');
    //   append(nn.$pointer, parent, after);
    // }
  }

  return nodes;
}

export default mount;
