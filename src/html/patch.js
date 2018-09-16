import {
  ensureArray,
  flatten,
} from '../utils';
import { createElement } from './createElement';
import { destroyTree } from './destroyTree';
import { fireEvent } from './fireEvent';
import { insertAfter } from './insertAfter';
import { nodeChanged } from './nodeChanged';
import { updateProps } from './props';

/**
 * @param  {HTMLElement} $parent
 * @param  {Object|Object[]} newNode
 * @param  {Object|Object[]} oldNode
 * @param  {number} [index=0]
 * @param  {HTMLElement} $pointer
 * @return {Object[]}
 */
export function patch($parent, newNode, oldNode, index = 0, $pointer) {
  let $output = $parent && $parent.childNodes[index];
  if ($pointer) {
    index = Array.prototype.indexOf.call($parent.childNodes, $pointer) + 1;
  }

  const normalNewNode = flatten(ensureArray(newNode));
  const normalOldNode = flatten(ensureArray(oldNode));
  const newLength = normalNewNode.length;
  const oldLength = normalOldNode.length;

  let modifier = 0;
  for (let i = 0; i < newLength || i < oldLength; i++) {
    if (normalNewNode[i] instanceof Date) normalNewNode[i] = normalNewNode[i].toString();
    if (normalOldNode[i] === false || normalOldNode[i] === undefined || normalOldNode[i] === null) {
      $output = createElement(normalNewNode[i], $parent);
      if ($pointer) {
        insertAfter($output, $parent.childNodes[((index + i) - 1)], $parent);
      } else {
        $parent.appendChild($output);
      }
      fireEvent('mount', $output);
    } else
    if (normalNewNode[i] === false || normalNewNode[i] === undefined || normalNewNode[i] === null) {
      const $target = $parent.childNodes[index + i + modifier];
      if ($target) {
        $parent.removeChild($target);
        destroyTree($target);
        modifier -= 1;
      }
    } else
    if (nodeChanged(normalNewNode[i], normalOldNode[i])) {
      $parent.replaceChild(
        $output = createElement(normalNewNode[i], $parent),
        $parent.childNodes[index + i]
      );
      fireEvent('mount', $output);
    } else if (typeof normalNewNode[i].type === 'string') {
      const childNew = normalNewNode[i];
      const childOld = normalOldNode[i];
      updateProps(
        $parent.childNodes[index + i],
        childNew.props,
        childOld.props
      );
      const newLength2 = childNew.children.length;
      const oldLength2 = childOld.children.length;
      for (let n = 0; n < newLength2 || n < oldLength2; n++) {
        patch(
          $parent.childNodes[index + i],
          childNew.children[n],
          childOld.children[n],
          n
        );
      }
    }
  }

  return normalNewNode;
}
