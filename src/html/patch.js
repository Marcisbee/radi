import { destroy } from '../destroy';
import { ensureArray } from '../utils';
import { fireEvent } from './fireEvent';
import { mount } from '../mount';
import { render } from './render';
import { updateProps } from './props';

/**
 * @param  {Node|Node[]} nodes
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
        lastNode.__radiRef(lastNode, ii);
      }

      return outputNode;
    });

    // Unused nodes can be savely remove from DOM
    if (flatDom.length > flatNodes.length) {
      const unusedDomNodes = flatDom.slice(flatNodes.length - flatDom.length);
      unusedDomNodes.forEach(destroy);
    }

    // Pass new nodes refrence to function containing it
    if (typeof ref === 'function') ref(outcome);

    return outcome;
  }

  /*
    TODO: Make dom structure in before making HTMLElement
    so that we can diff that structure with existing DOM

    Preferrably it would look like this:

    ```
    {
      type: 0,
      query: function Component() {},
      props: {},
      children: [
        {
          type: 1,
          query: 'button',
          props: {
            onclick: function dispatch() {}
          },
          children: [
            {
              type: 2,
              query: 'Click me'
            }
          ]
        }
      ]
    }
    ```
  */

  /* Currently we'll render HTMLElements and diff them with real dom */

  const newNode = render(nodes, parent);

  return patchDomRecursively(dom, newNode, parent, $pointer);
}

/**
 * @param {HTMLElement} node1
 * @param {HTMLElement} node2
 * @returns {boolean}
 */
function nodeChanged(node1, node2) {
  if (node1.nodeType === 3 && node2.nodeType === 3 && node1.__radiRef) return true;
  if (node1.nodeType === node2.nodeType) return false;
  if (node1.nodeName === node2.nodeName) return false;

  return true;
}

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

/**
 * @param {HTMLElement} oldDom
 * @param {HTMLElement} newDom
 * @param {HTMLElement} parent
 * @param {HTMLElement} pointer
 * @returns {HTMLElement}
 */
function patchDomRecursively(oldDom, newDom, parent, pointer) {
  const active = document.activeElement;

  if (!oldDom && (pointer || parent)) {
    const mounter = mount(newDom, parent, pointer);
    return mounter;
  }

  if (typeof newDom === 'undefined') {
    destroy(oldDom);
    return oldDom;
  }

  if (oldDom && parent) {
    if (!nodeChanged(oldDom, newDom)) {
      if (oldDom.nodeType === 3 && newDom.nodeType === 3
        && oldDom.textContent !== newDom.textContent) {
        oldDom.textContent = newDom.textContent;

        fireEvent('mount', newDom, oldDom);
      }

      if (oldDom.childNodes || newDom.childNodes) {
        const length = Math.max(oldDom.childNodes.length, newDom.childNodes.length);

        /* We should always run patch childnodes in reverse from last to first
        because if node is removed, it removes whole element in array */
        for (let ii = length - 1; ii >= 0; ii--) {
          patchDomRecursively(
            oldDom.childNodes[ii],
            newDom.childNodes[ii] && newDom.childNodes[ii],
            oldDom
          );
        }
      }

      // TODO: After we have structured objects not dom nodes,
      // should use props from there
      if (oldDom.nodeType === 1 && newDom.nodeType === 1) {
        const oldAttrs = attributesToObject(oldDom.attributes);
        const newAttrs = attributesToObject(newDom.attributes);
        updateProps(oldDom, newAttrs, oldAttrs);
      }

      if (oldDom.__radiRef) {
        oldDom.__radiRef(oldDom);
      }

      active.focus();
      return oldDom;
    }

    mount(newDom, parent, oldDom);

    if (oldDom.__radiRef) {
      newDom.__radiRef = oldDom.__radiRef;
      newDom.__radiRef(newDom);
    }

    destroy(oldDom);
  }

  active.focus();
  return newDom;
}
