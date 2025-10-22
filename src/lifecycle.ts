export function getElementsMarkedForUpdate(
  root: Node,
  update: boolean,
): Element[] {
  const elements: Element[] = [];
  let node: Node | null = root;
  // Track depth of reactive ancestors (root counts if reactive)
  let reactiveDepth = 0;

  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const isReactive = !!(el as any).__reactiveRoot;
      const isEventable = !!(el as any).__reactiveEvent;
      const isComponent = !!(el as any).__radiHost;

      const underReactiveAncestor = reactiveDepth > 0 && el !== root;
      const excludeComponent = update && isComponent && underReactiveAncestor;

      const include = !excludeComponent && (
        (update && isComponent) || isReactive || isEventable
      );

      if (include) elements.push(el);

      const skipChildren = update && isReactive && el !== root;

      if (!skipChildren && el.firstElementChild) {
        if (isReactive) reactiveDepth++;
        node = el.firstElementChild;
        continue;
      }
    }

    while (node && node !== root && !node.nextSibling) {
      const parent = node.parentNode as Element | null;
      // If the element we are leaving is reactive, decrement depth
      if (node.nodeType === Node.ELEMENT_NODE && (node as any).__reactiveRoot) {
        reactiveDepth = Math.max(0, reactiveDepth - 1);
      }
      node = parent;
    }
    if (!node || node === root) break;
    node = node.nextSibling;
  }

  return elements;
}
