import { destroy } from '../destroy';
import { ensureArray } from '../utils';
import { mount } from '../mount';
import { render } from './render';
// import { fireEvent } from './fireEvent';
// import { nodeChanged } from './nodeChanged';
// import { updateProps } from './props';


/**
 * @param  {Object|Object[]} nodes
 * @param  {HTMLElement} dom
 * @param  {HTMLElement} parent
 * @param  {HTMLElement} $pointer
 * @returns {HTMLElement|HTMLElement[]}
 */
export function patch(nodes, dom, parent = dom && dom.parentNode, $pointer = null) {
  if (Array.isArray(nodes) || Array.isArray(dom)) {
    const flatNodes = Array.isArray(nodes) && nodes.length === 0 ? [null] : ensureArray(nodes);
    const flatDom = ensureArray(dom);
    const ref = Array.isArray(dom)
      ? dom[0] && dom[0].__radiRef
      : dom.__radiRef;

    let lastNode = dom;

    const outcome = flatNodes.map((node, ii) => {
      const staticLastNode = lastNode;
      const outputNode = patch(
        node,
        flatDom[ii],
        (flatDom[ii] && flatDom[ii].parentNode) || parent,
        !flatDom[ii] && staticLastNode
      );

      // Need to memoize last rendered node
      lastNode = Array.isArray(outputNode)
        ? outputNode[0]
        : outputNode;

      // Make nested & updated components update their refrences
      if (typeof ref === 'function' && ii > 0) {
        lastNode.__radiRef = (data) => ref(data, ii);
        lastNode.__radiRef(lastNode);
      }

      return outputNode;
    });

    // Unused nodes can be savely remove from DOM
    if (flatDom.length > flatNodes.length) {
      const unusedDomNodes = flatDom.slice(flatNodes.length - flatDom.length);
      unusedDomNodes.forEach(
        node => {
          if (node && node.parentNode) {
            node.parentNode.removeChild(node);
          }
        }
      );
    }

    // Pass new nodes refrence to function containing it
    if (typeof ref === 'function') ref(outcome);

    return outcome;
  }

  const newNode = render(nodes, parent);

  if (!dom && $pointer) {
    const mounter = mount(newNode, dom, $pointer);
    return mounter;
  }

  if (dom && parent) {
    parent.insertBefore(newNode, dom);

    if (dom.__radiRef) {
      newNode.__radiRef = dom.__radiRef;
      newNode.__radiRef(newNode);
    }

    destroy(dom);
  }

  return newNode;
}
