// import { RadiHostElement } from "./main.ts"; // no longer needed; host detection uses tag name / marker

export class LifecycleEvent extends Event {
  constructor(
    type: "connect" | "disconnect",
    public readonly initiator: Node,
  ) {
    super(type, { composed: true, bubbles: false });
  }
}

export function onLifecycle(
  target: Node,
  type: LifecycleEvent["type"],
  cb: (e: LifecycleEvent) => void,
) {
  target.addEventListener(type, handle, true);

  function handle(e: Event) {
    if (!(e instanceof LifecycleEvent)) {
      return;
    }

    // At target
    if (e.eventPhase === 2) {
      cb(e);
      unsubscribe();
      return;
    }

    // Capture phase
    if (e.eventPhase !== 1) {
      throw new Error(type + " event listener MUST be in capture phase");
    }

    const path = e.composedPath();
    const initiatorIndex = path.indexOf(e.initiator);
    const currentIndex = path.indexOf(e.currentTarget!);

    if (currentIndex > initiatorIndex) {
      return;
    }

    cb(e);
    unsubscribe();
  }

  function unsubscribe() {
    target.removeEventListener(type, handle, true);
  }

  return unsubscribe;
}

export function getInnerMostElements(root: Node): Element[] {
  const elements: Element[] = [];
  let node: Node | null = root;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.firstElementChild) {
        node = el.firstElementChild;
        continue;
      }

      const isReactive = !!(el as any).__reactiveRoot;
      if (!isReactive) {
        elements.push(el);
      }
    }
    while (node && node !== root && !node.nextSibling) {
      node = node.parentNode;
    }
    if (!node || node === root) break;
    node = node.nextSibling;
  }
  return elements;
}

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
      // This prevents duplicate update dispatch caused by ancestor reactive reconciliation
      // while still allowing propagation through plain structural parents.
      const excludeNestedComponent = update && el !== root && isComponent &&
        isInReactiveAncestor();

      const include = !excludeNestedComponent &&
        ((update && isComponent) || isReactive || isEventable);

      if (include) {
        elements.push(el);
      }

      // Decide whether to descend: skip children of reactive roots (component or not) during update so
      // we don't traverse into their inner component hosts (they will be updated by reuse dispatch).
      const skipChildren = update && isReactive && el !== root;

      // Prepare descent
      if (el.firstElementChild && !skipChildren) {
        // Push reactive context state
        reactiveStack.push(isReactive);
        node = el.firstElementChild;
        continue;
      }
    }

    // Ascend
    while (node && node !== root && !node.nextSibling) {
      const parent = node.parentNode;
      // Pop reactive state when leaving an element node
      if (parent && parent.nodeType === Node.ELEMENT_NODE) {
        reactiveStack.pop();
      }
      node = parent;
    }
    if (!node || node === root) break;
    // Move laterally
    node = node.nextSibling;
    // When moving to a sibling, reactive depth remains the same.
  }

  return elements;
}

export function dispatchLifecycle(
  type: "connect" | "disconnect",
  initiator: Node,
) {
  const ev = new LifecycleEvent(type, initiator);
  for (const child of getInnerMostElements(initiator)) {
    child.dispatchEvent(ev);
  }
}
