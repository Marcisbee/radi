import { destroy } from '../destroy';
import { fireEvent } from './fireEvent';
import { render } from './render';
import { updateProps } from './props';
import TYPE from './../consts/types';
import GLOBALS from './../consts/GLOBALS';
import { insertAfter } from './insertAfter';

/**
 * @param {NamedNodeMap} value
 * @returns {{}}
 */
function attributesToObject(value) {
  return [].reduce.call(value, (acc, obj) => ({
    ...acc,
    [obj.name]: obj.value,
  }), {});
}

function withoutInnerChilds(dom) {
  const childrenOfComponents = Array.prototype.filter.call(
    dom.childNodes,
    d => typeof d.__radiPoint !== 'undefined'
  )
    .reduce((acc, d) => [...acc, ...d.__radiPoint.dom], []);

  return Array.prototype.filter.call(
    dom.childNodes,
    d => childrenOfComponents.indexOf(d) < 0
  );
}

/**
 * @param  {Structure} structure
 * @param  {HTMLElement} dom
 * @param  {HTMLElement} parent
 * @param  {HTMLElement} last
 * @returns {{ newDom: HTMLElement, newStucture: Structure, last: HTMLElement }}
 */
export function patch(structure, dom, parent, last) {
  let newStucture;
  let newDom;
  if (!dom) {
    // add
    last = newDom = fireEvent('mount', insertAfter(render(newStucture = structure), last, parent));
  } else
    if (!structure) {
      // remove
      destroy(dom);
    } else {
      // replace
      if (structure.type === TYPE.NODE) {
        const patchNewDom = structure;
        const patchOldDom = dom;
        const patchOldDomChildren = withoutInnerChilds(dom);

        if (patchOldDom.nodeName === patchNewDom.query.toUpperCase()) {
          const oldAttrs = attributesToObject(patchOldDom.attributes);

          if (patchOldDomChildren || patchNewDom.children) {
            const length = Math.max(patchOldDomChildren.length, patchNewDom.children.length);

            /* We should always run patch childnodes in reverse from last to first
            because if node is removed, it removes whole element in array */
            for (let ii = length - 1; ii >= 0; ii--) {
              patch(
                patchNewDom.children[ii],
                patchOldDomChildren[ii],
                patchOldDom
              );
            }
          }

          updateProps(patchOldDom, patchNewDom.props, oldAttrs);

          newStucture = structure;
          newDom = dom;
          return { newDom, newStucture, last };
        }
      }

      if (structure.type === TYPE.TEXT && dom.nodeType === 3 && !dom.__radiPoint) {

        if (dom.textContent != structure.query) {
          dom.textContent = structure.query;
        }

        newStucture = structure;
        newDom = dom;
        return { newDom, newStucture, last };
      }

      if (structure.type === TYPE.COMPONENT) {

        if (dom && dom.__radiPoint && structure.query.name === dom.__radiPoint.query.name) {
          GLOBALS.USE_CACHE = true;

          structure.pointer = dom.__radiPoint.pointer;
          structure.dom = dom.__radiPoint.dom;
        }

        if (dom.__radiPoint && dom.__radiPoint.query === structure.query) {
          dom.__radiPoint.update(structure.props, structure.children);

          newStucture = dom.__radiPoint;
          newDom = dom;
          return { newDom, newStucture, last };
        }
      }

      last = newDom = fireEvent('mount', insertAfter(render(newStucture = structure), dom, parent));
      if (last.__radiPoint && last.__radiPoint && last.__radiPoint.dom) {
        last = last.__radiPoint.dom[last.__radiPoint.dom.length - 1];
      }
      destroy(dom);
    }

  return { newDom, newStucture, last };
}