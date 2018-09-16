import { fireEvent } from './index';

/**
 * @param  {HTMLElement} node
 */
export function destroyTree(node) {
  fireEvent('destroy', node);

  if (node.nodeType === 1) {
    let curChild = node.firstChild;
    while (curChild) {
      destroyTree(curChild);
      curChild = curChild.nextSibling;
    }
  }
}
