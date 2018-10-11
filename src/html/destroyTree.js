import { fireEvent } from './fireEvent';

/**
 * @param  {HTMLElement} node
 */
export function destroyTree(node) {
  fireEvent('destroy', node);
  const instance = node.__radiInstance;
  if (instance) {
    instance.trigger('destroy');
    if (typeof instance.__onDestroy === 'function') {
      instance.__onDestroy();
    }
  }
  node.__radiInstance = null;

  if (node.nodeType === 1) {
    let curChild = node.firstChild;
    while (curChild) {
      destroyTree(curChild);
      curChild = curChild.nextSibling;
    }
  }
}
