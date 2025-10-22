export function getElementsMarkedForUpdate(
  root: Node,
  update: boolean,
): Element[] {
  const out: Element[] = [];
  let node: Node | null = root;
  let reactiveDepth = 0;

  while (node) {
    if (node.nodeType === 1) { // ELEMENT_NODE
      const el = node as Element;
      const a: any = el;
      const reactive = !!a.__reactiveRoot;
      const eventable = !!a.__reactiveEvent;
      const component = !!a.__radiHost;
      const nestedUnderReactive = reactiveDepth > 0 && el !== root;

      if (update) {
        // Include component host unless excluded (nested under reactive ancestor),
        // plus any reactive root or eventable element.
        if (!(component && nestedUnderReactive)) {
          if (component || reactive || eventable) {
            out.push(el);
          }
        }
      } else {
        // Non-update traversal used for connect/disconnect: only reactive / eventable.
        if (reactive || eventable) {
          out.push(el);
        }
      }

      // Skip descending into nested reactive roots during update (except the root itself).
      if (!(update && reactive && el !== root) && el.firstElementChild) {
        if (reactive) reactiveDepth++;
        node = el.firstElementChild;
        continue;
      }
    }

    // Ascend to next sibling or parent
    while (node && node !== root && !node.nextSibling) {
      if (node.nodeType === 1 && (node as any).__reactiveRoot) {
        reactiveDepth--;
        if (reactiveDepth < 0) reactiveDepth = 0;
      }
      node = node.parentNode;
    }
    if (!node || node === root) break;
    node = node.nextSibling;
  }

  return out;
}
