export function getElementsMarkedForUpdate(
  root: Node,
  update: boolean,
): Element[] {
  const elements: Element[] = [];
  let node: Node | null = root;

  // Track whether we are currently inside (beneath) a reactive root ancestor (including the traversal root if it is reactive).
  const reactiveStack: boolean[] = [];
  const isInReactiveAncestor = () => reactiveStack.some((v) => v);

  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;

      const isReactive = !!(el as any).__reactiveRoot;
      const isEventable = !!(el as any).__reactiveEvent;
      const isComponent = !!(el as any).__radiHost;

      // Exclude nested component hosts ONLY when they are under a reactive root ancestor.
      const excludeNestedComponent =
        update && el !== root && isComponent && isInReactiveAncestor();

      const include =
        !excludeNestedComponent &&
        ((update && isComponent) || isReactive || isEventable);

      if (include) {
        elements.push(el);
      }

      const skipChildren = update && isReactive && el !== root;

      if (el.firstElementChild && !skipChildren) {
        reactiveStack.push(isReactive);
        node = el.firstElementChild;
        continue;
      }
    }

    while (node && node !== root && !node.nextSibling) {
      const parent = node.parentNode;
      if (parent && parent.nodeType === Node.ELEMENT_NODE) {
        reactiveStack.pop();
      }
      node = parent;
    }
    if (!node || node === root) break;
    node = node.nextSibling;
  }

  return elements;
}
