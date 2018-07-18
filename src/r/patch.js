/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable no-multi-assign */

import flatten from '../utils/flatten';
import filterNode from './utils/filterNode';
// import Listener from '../listen/Listener';
// import Component from '../component/Component';
import mount from '../mount';
import append from './utils/append';
// import replaceWith from './utils/replaceWith';
import textNode from './utils/textNode';
import mountChildren from './mountChildren';
import Structure from './Structure';
import setAttributes from './setAttributes';

// const hasRedirect = item => (
//   item && item.$redirect
// );

const patch = (rawfirst, rawsecond, parent,
  after = false, isSvg = false, depth = 0) => {
  const first = flatten([rawfirst]);
  const second = flatten([rawsecond]).map(filterNode);

  const length = Math.max(first.length, second.length);

  for (let i = 0; i < length; i++) {
    // debugger
    // const nn = i;
    // first[i] = first[i].$redirect || first[i];
    if (typeof first[i] === 'undefined') {
      // mount
      mount(second[i], parent, after, isSvg, depth);
      continue;
    }

    if (typeof second[i] === 'undefined') {
      // remove
      if (typeof first[i].destroy === 'function') {
        first[i].destroy();
      }
      continue;
    }

    second[i].$depth = depth;

    if (first[i] instanceof Structure
      && second[i] instanceof Structure
      && first[i] !== second[i]) {
      // if (second[i].$redirect2) {
      //   second[i] = patch(
      //     // first[i].$redirect || first[i],
      //     hasRedirect(first[i]) || first[i],
      //     second[i].$redirect[second[i].$redirect.length - 1] || second[i],
      //     parent,
      //     after,
      //     isSvg,
      //     depth
      //   );
      //   continue;
      // }

      if (first[i].html
        && first[i].query === '#text'
        && second[i].query === '#text') {
        for (let n = 0; n < first[i].html.length; n++) {
          if (first[i].props !== second[i].props) {
            first[i].html[n].textContent = first[i].props = second[i].props;
          }
        }

        second[i].html = first[i].html;
        first[i].html = null;

        if (first[i].$pointer) {
          if (second[i].$pointer && second[i].$pointer.parentNode) {
            second[i].$pointer.parentNode.removeChild(second[i].$pointer);
          }
          second[i].$pointer = first[i].$pointer;
          first[i].$pointer = null;
        }

        first[i].destroy();
        continue;
      }


      if (first[i].html
        && typeof first[i].query === 'string'
        && typeof second[i].query === 'string'
        && first[i].query === second[i].query) {
        // for (var n = 0; n < first[i].html.length; n++) {
        //   if (first[i].props !== second[i].props) {
        //     // first[i].html[n].textContent = second[i].props;
        //   }
        // }

        second[i].html = first[i].html;
        first[i].html = null;

        if (first[i].$pointer) {
          if (second[i].$pointer && second[i].$pointer.parentNode) {
            second[i].$pointer.parentNode.removeChild(second[i].$pointer);
          }
          second[i].$pointer = first[i].$pointer;
          first[i].$pointer = null;
        }

        setAttributes(second[i], second[i].props, first[i].props);
        // mountChildren(second[i], second[i].$isSvg, second[i].$depth + 1);

        if (second[i].html[0]
            && second[i].children
            && second[i].children.length > 0) {
          second[i].children = patch(first[i].children,
            second[i].children,
            second[i].html[0],
            false,
            second[i].$isSvg,
            second[i].$depth + 1);
        }
        first[i].destroy(false);

        continue;
      }

      // maybe merge
      const n1 = first[i];
      const n2 = second[i];

      // n2.$pointer = textNode('[pointer2]');
      n2.$pointer = textNode('');
      append(n2.$pointer, parent, after);

      n2.render(rendered => {
        if (n1.$pointer) {
          if (n2.$pointer && n2.$pointer.parentNode) {
            n2.$pointer.parentNode.removeChild(n2.$pointer);
          }
          n2.$pointer = n1.$pointer;
          n1.$pointer = null;
        }

        for (let n = 0; n < rendered.length; n++) {
          if ((n1.html && !n1.html[i]) || !n1.html) {
            append(rendered[n], n2.$pointer, true);
          } else {
            append(rendered[n], n1.html[i], true);
          }
        }

        mountChildren(n2, isSvg, depth + 1);

        n1.destroy(false);
      }, n2, depth, isSvg);
    }
  }

  return second;
};

export default patch;
