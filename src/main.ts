/** A reactive function returns new child(ren) when invoked with the parent element. */
type ReactiveGenerator = (parent: Element) => Child | Child[];

/** Primitive or structured child value accepted by createElement/buildElement. */
type Child =
  | string
  | number
  | boolean
  | null
  | undefined
  | Node
  | Child[]
  | ReactiveGenerator;

/** Internal extended element with optional component marker. */
type ComponentElement = HTMLElement & {
  __component?: Function;
  [key: string]: unknown;
};

/* ========================= Fragment Boundary ========================= */

const FRAGMENT_START_TEMPLATE = document.createComment("(");
const FRAGMENT_END_TEMPLATE = document.createComment(")");

/**
 * Create a fresh pair of fragment boundary comments.
 */
function createFragmentBoundary(): { start: Comment; end: Comment } {
  return {
    start: FRAGMENT_START_TEMPLATE.cloneNode() as Comment,
    end: FRAGMENT_END_TEMPLATE.cloneNode() as Comment,
  };
}

/* ========================= Node Normalization ========================= */

/**
 * Recursively flatten arbitrary child shapes (including arrays / nested arrays / fragment arrays)
 * into a flat array of DOM Nodes. Reactive functions are left as-is for higher level handling.
 */
function normalizeToNodes(raw: Child | Child[]): (Node | ReactiveGenerator)[] {
  const out: (Node | ReactiveGenerator)[] = [];
  const stack: any[] = Array.isArray(raw) ? [...raw] : [raw];
  while (stack.length) {
    const item = stack.shift();
    if (item == null) {
      out.push(document.createComment("null"));
      continue;
    }
    if (Array.isArray(item)) {
      stack.unshift(...item);
      continue;
    }
    switch (typeof item) {
      case "string":
      case "number":
        out.push(document.createTextNode(String(item)));
        continue;
      case "boolean":
        out.push(document.createComment(item ? "true" : "false"));
        continue;
      case "function":
        out.push(item as ReactiveGenerator);
        continue;
    }
    if (item instanceof Node) out.push(item);
  }
  return out;
}

/* ========================= buildElement ========================= */

/**
 * Convert a JSX child value to either:
 * - Node(s) (with fragment boundaries if it was an array)
 * - A reactive generator function (if original child was function)
 * - Comments for booleans/null
 */
function buildElement(child: Child): Child {
  if (typeof child === "string" || typeof child === "number") {
    return document.createTextNode(String(child));
  }

  if (typeof child === "boolean") {
    return document.createComment(child ? "true" : "false");
  }

  if (typeof child === "function") {
    return (parent: Element) => {
      const produced = (child as ReactiveGenerator)(parent);
      return normalizeToNodes(
        ([] as Child[]).concat(produced as any).map(buildElement) as any,
      );
    };
  }

  if (Array.isArray(child)) {
    const { start, end } = createFragmentBoundary();
    const built = child
      .map(buildElement)
      .flat(Number.POSITIVE_INFINITY as 1)
      .filter(Boolean) as Child[];
    const nodes = normalizeToNodes(built as any).filter(
      Boolean,
    ) as (Node | ReactiveGenerator)[];
    return [start, ...nodes, end];
  }

  if (child == null) {
    return document.createComment("null");
  }

  return child;
}

/* ========================= Style & Prop Utilities ========================= */

/**
 * Apply a style object to an element.
 */
function applyStyleObject(
  el: HTMLElement,
  styleObj: Record<string, string | number>,
): void {
  for (const k in styleObj) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el.style as any)[k] = styleObj[k];
  }
}

/**
 * Set a property or attribute on an element.
 */
function setPropValue(el: HTMLElement, key: string, value: unknown): void {
  if (key === "style" && value && typeof value === "object") {
    applyStyleObject(el, value as Record<string, string | number>);
  } else if (key in el) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any)[key] = value;
  } else {
    el.setAttribute(key, String(value));
  }
}

/* ========================= Reconciliation Core ========================= */

/**
 * Patch text nodes in-place if both are text and changed.
 * @returns true if handled (and no further action needed).
 */
function patchText(a: Node, b: Node): boolean {
  if (a.nodeType === Node.TEXT_NODE && b.nodeType === Node.TEXT_NODE) {
    if ((a as Text).nodeValue !== (b as Text).nodeValue) {
      (a as Text).nodeValue = (b as Text).nodeValue;
    }
    return true;
  }
  return false;
}

/**
 * Resolve a key for keyed diffing.
 * Priority: internal __key, data-key attribute.
 */
function getNodeKey(node: Node): string | null {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element & { __key?: string };
  return (el as any).__key || el.getAttribute("data-key");
}

/**
 * Optimized attribute diff (namespaced + removal) inspired by morphdom's morphAttrs.
 */
function diffAttributes(fromEl: Element, toEl: Element): void {
  // Add/update
  const toAttrs = toEl.attributes;
  for (let i = toAttrs.length - 1; i >= 0; i--) {
    const attr = toAttrs[i];
    const ns = attr.namespaceURI;
    let name = attr.name;
    const value = attr.value;
    if (ns) {
      name = attr.localName || name;
      const fromValue = fromEl.getAttributeNS(ns, name);
      if (fromValue !== value) {
        if (attr.prefix === "xmlns") {
          name = attr.name;
        }
        fromEl.setAttributeNS(ns, name, value);
      }
    } else {
      const fromValue = fromEl.getAttribute(name);
      if (fromValue !== value) {
        fromEl.setAttribute(name, value);
      }
    }
  }
  // Remove
  const fromAttrs = fromEl.attributes;
  for (let i = fromAttrs.length - 1; i >= 0; i--) {
    const attr = fromAttrs[i];
    const ns = attr.namespaceURI;
    let name = attr.name;
    if (ns) {
      name = attr.localName || name;
      if (!toEl.hasAttributeNS(ns, name)) {
        fromEl.removeAttributeNS(ns, name);
      }
    } else {
      if (!toEl.hasAttribute(name)) {
        fromEl.removeAttribute(name);
      }
    }
  }
}

/**
 * Attempt to patch two element nodes in place; returns false if they must be replaced.
 * Avoids child/attribute array allocations.
 */
function patchElement(oldEl: Element, newEl: Element): boolean {
  if (oldEl.nodeName !== newEl.nodeName) return false;

  const oAny = oldEl as ComponentElement;
  const nAny = newEl as ComponentElement;

  // Key mismatch -> force replace (even for same tag/component type)
  const oldKey = (oAny as any).__key ||
    (oldEl as Element).getAttribute("data-key");
  const newKey = (nAny as any).__key ||
    (newEl as Element).getAttribute("data-key");
  if (oldKey !== newKey && (oldKey != null || newKey != null)) {
    return false;
  }

  // Component placeholder update (do NOT re-run component function) if same component type + key
  if (
    oAny.__component &&
    (nAny as any).__componentPending &&
    oAny.__component === (nAny as any).__componentPending.type &&
    oldKey === newKey
  ) {
    if ((oAny as any).__propsRef) {
      (oAny as any).__propsRef.current = (nAny as any).__componentPending.props;
      delete (nAny as any).__componentPending;
      dispatchEventSink(
        oAny,
        createUpdateEvent(),
      );
    }
    return true;
  }

  // Component identity guard (different component types -> replace)
  if (
    oAny.__component && nAny.__component &&
    (oAny.__component !== nAny.__component)
  ) {
    return false;
  }

  // Attributes (optimized)
  diffAttributes(oldEl, newEl);

  // Styles
  const oldStyle = (oldEl as HTMLElement).style.cssText;
  const newStyle = (newEl as HTMLElement).style.cssText;
  if (oldStyle !== newStyle) {
    (oldEl as HTMLElement).style.cssText = newStyle;
  }

  // Children diff (sibling-pointer linear walk, no arrays)
  reconcileElementChildren(oldEl, newEl);
  return true;
}

/**
 * Linear reconciliation of element children without intermediate arrays.
 */
function reconcileElementChildren(oldEl: Element, newEl: Element): void {
  // Detect keyed usage
  let hasKeys = false;
  for (let c = newEl.firstChild; c; c = c.nextSibling) {
    if (getNodeKey(c)) {
      hasKeys = true;
      break;
    }
  }
  if (!hasKeys) {
    for (let c = oldEl.firstChild; c; c = c.nextSibling) {
      if (getNodeKey(c)) {
        hasKeys = true;
        break;
      }
    }
  }

  if (!hasKeys) {
    // Fallback fast pointer diff (original logic)
    let oldChild: Node | null = oldEl.firstChild;
    let newChild: Node | null = newEl.firstChild;
    while (oldChild || newChild) {
      if (!oldChild) {
        oldEl.appendChild(newChild!);
        newChild = newChild!.nextSibling;
        continue;
      }
      if (!newChild) {
        const nextOld = oldChild.nextSibling;
        oldEl.removeChild(oldChild);
        oldChild = nextOld;
        continue;
      }
      if (oldChild === newChild) {
        oldChild = oldChild.nextSibling;
        newChild = newChild.nextSibling;
        continue;
      }
      if (patchText(oldChild, newChild)) {
        oldChild = oldChild.nextSibling;
        newChild = newChild.nextSibling;
        continue;
      }
      if (
        oldChild.nodeType === Node.ELEMENT_NODE &&
        newChild.nodeType === Node.ELEMENT_NODE
      ) {
        if (patchElement(oldChild as Element, newChild as Element)) {
          oldChild = oldChild.nextSibling;
          newChild = newChild.nextSibling;
          continue;
        }
      }
      const replaceTarget = oldChild;
      const nextOld = oldChild.nextSibling;
      const nextNew = newChild.nextSibling;
      oldEl.replaceChild(newChild, replaceTarget);
      oldChild = nextOld;
      newChild = nextNew;
    }
    return;
  }

  // Keyed diff (simplified morphdom-inspired)
  const oldKeyMap = new Map<string, Node>();
  const unmatchedOld: Node[] = [];
  for (let c = oldEl.firstChild; c; c = c.nextSibling) {
    const k = getNodeKey(c);
    if (k) {
      oldKeyMap.set(k, c);
    } else {
      unmatchedOld.push(c);
    }
  }

  let oldPointer: Node | null = oldEl.firstChild;
  const processed = new Set<Node>();
  for (
    let newPointer = newEl.firstChild;
    newPointer;
    newPointer = newPointer.nextSibling
  ) {
    const newKey = getNodeKey(newPointer);
    if (!newKey) {
      // Consume next unmatched old node in sequence
      while (oldPointer && getNodeKey(oldPointer)) {
        oldPointer = oldPointer.nextSibling;
      }
      if (!oldPointer) {
        // append
        oldEl.appendChild(newPointer);
        continue;
      }
      if (oldPointer === newPointer) {
        processed.add(oldPointer);
        oldPointer = oldPointer.nextSibling;
        continue;
      }
      if (patchText(oldPointer, newPointer)) {
        processed.add(oldPointer);
        oldPointer = oldPointer.nextSibling;
        continue;
      }
      if (
        oldPointer.nodeType === Node.ELEMENT_NODE &&
        newPointer.nodeType === Node.ELEMENT_NODE
      ) {
        if (patchElement(oldPointer as Element, newPointer as Element)) {
          processed.add(oldPointer);
          oldPointer = oldPointer.nextSibling;
          continue;
        }
      }
      // Replace non-keyed
      const nextOld = oldPointer.nextSibling;
      oldEl.replaceChild(newPointer, oldPointer);
      processed.add(newPointer);
      oldPointer = nextOld;
      continue;
    }

    // Keyed case
    const match = oldKeyMap.get(newKey);
    if (match) {
      oldKeyMap.delete(newKey);
      processed.add(match);
      if (match === oldPointer) {
        // Already in correct position
        oldPointer = oldPointer.nextSibling;
      } else {
        // Move into place before current oldPointer
        if (oldPointer) {
          oldEl.insertBefore(match, oldPointer);
        } else {
          oldEl.appendChild(match);
        }
      }
      if (
        match.nodeType === Node.ELEMENT_NODE &&
        newPointer.nodeType === Node.ELEMENT_NODE
      ) {
        if (match !== newPointer) {
          patchElement(match as Element, newPointer as Element);
        }
      } else if (patchText(match, newPointer)) {
        // patched
      } else if (match !== newPointer) {
        oldEl.replaceChild(newPointer, match);
      }
    } else {
      // New keyed node not found; insert before oldPointer or append
      if (oldPointer) {
        oldEl.insertBefore(newPointer, oldPointer);
      } else {
        oldEl.appendChild(newPointer);
      }
    }
  }

  // Remove any old keyed nodes not matched
  for (const [, node] of oldKeyMap) {
    if (processed.has(node)) continue;
    oldEl.removeChild(node);
  }
  // Remove remaining unmatched old nodes that were not processed
  for (let c = oldEl.firstChild; c;) {
    const next = c.nextSibling;
    if (!processed.has(c) && !getNodeKey(c)) {
      oldEl.removeChild(c);
    }
    c = next;
  }
}

/**
 * Reconcile nodes inside a fragment boundary (exclusive of the boundary comments).
 * Uses pointer walk (no old array).
 */
function reconcileRange(start: Comment, end: Comment, newNodes: Node[]): void {
  const parent = start.parentNode;
  if (!parent || end.parentNode !== parent) return;

  let oldCur: Node | null = start.nextSibling;
  let idx = 0;

  while ((oldCur && oldCur !== end) || idx < newNodes.length) {
    if (oldCur === end) {
      // append rest
      while (idx < newNodes.length) {
        parent.insertBefore(newNodes[idx++], end);
      }
      break;
    }

    const newNode = newNodes[idx];

    if (!oldCur) {
      parent.insertBefore(newNode, end);
      idx++;
      continue;
    }

    if (!newNode) {
      // remove remaining old until end
      while (oldCur && oldCur !== end) {
        const next: Node | null = oldCur.nextSibling;
        parent.removeChild(oldCur);
        oldCur = next;
      }
      break;
    }

    if (oldCur === newNode) {
      oldCur = oldCur.nextSibling;
      idx++;
      continue;
    }

    if (patchText(oldCur, newNode)) {
      oldCur = oldCur.nextSibling;
      idx++;
      continue;
    }

    if (
      oldCur.nodeType === Node.ELEMENT_NODE &&
      newNode.nodeType === Node.ELEMENT_NODE
    ) {
      if (patchElement(oldCur as Element, newNode as Element)) {
        oldCur = oldCur.nextSibling;
        idx++;
        continue;
      }
    }

    // Replace oldCur with newNode
    parent.insertBefore(newNode, oldCur);
    parent.removeChild(oldCur);
    oldCur = newNode.nextSibling;
    idx++;
  }
}

/* ========================= Reactive Rendering ========================= */

/**
 * Mount a reactive generator into a container using a fresh fragment boundary.
 */
function setupReactiveRender(container: Element, fn: ReactiveGenerator): void {
  const { start, end } = createFragmentBoundary();
  container.append(start, end);

  const render = () => {
    const produced = fn(container);
    const flat = normalizeToNodes(produced).filter((n): n is Node =>
      n instanceof Node
    );
    reconcileRange(start, end, flat);
  };

  container.addEventListener("update", render);
  render();
}

/**
 * Helper to mount a Node or reactive generator as a child of an element.
 */
function mountChild(parent: Element, nodeOrFn: Node | ReactiveGenerator): void {
  if (typeof nodeOrFn === "function") {
    setupReactiveRender(parent, nodeOrFn as ReactiveGenerator);
  } else {
    parent.appendChild(nodeOrFn);
  }
}

/* ========================= Radi Core ========================= */

export const Fragment = "fragment";

/**
 * Lightweight JSX factory.
 * - Supports functional components.
 * - Supports fragments (Radi.Fragment).
 * - Handles reactive child functions.
 */
export function createElement(
  type: string | Function,
  props: Record<string, unknown> | null,
  ...childrenRaw: Child[]
): Node | Node[] {
  const builtChildren = childrenRaw.map(buildElement);
  const normalizedChildren = normalizeToNodes(builtChildren as any);

  // JSX Fragment
  if (type === "fragment") {
    const { start, end } = createFragmentBoundary();
    const fragmentNodes: Node[] = [];
    for (const c of normalizedChildren) {
      if (typeof c === "function") {
        // Defer mounting; reactive inside fragment wrapper
        const placeholder = document.createComment("deferred-reactive");
        fragmentNodes.push(placeholder);
        // After return, user code won't have appended yet. So we schedule microtask to mount.
        queueMicrotask(() => {
          const parent = placeholder.parentNode as Element | null;
          if (parent) {
            setupReactiveRender(parent, c as ReactiveGenerator);
            parent.removeChild(placeholder);
          }
        });
      } else {
        fragmentNodes.push(c);
      }
    }
    return [start, ...fragmentNodes, end];
  }

  // Functional Component (single execution with props getter; subsequent renders supply placeholder)
  if (typeof type === "function") {
    const placeholder = document.createElement(
      "cmp-" + (type.name || "component"),
    ) as ComponentElement & {
      __componentPending?: { type: Function; props: any };
    };
    // Component key support
    if (props) {
      const pAny = props as Record<string, unknown>;
      if (pAny.key != null) {
        (placeholder as any).__key = String(pAny.key);
        placeholder.setAttribute("data-key", String(pAny.key));
        delete pAny.key;
      } else if (pAny["data-key"] != null) {
        (placeholder as any).__key = String(pAny["data-key"]);
      }
    }
    placeholder.style.display = "contents";
    (placeholder as any).__componentPending = {
      type,
      props: { ...(props || {}), children: builtChildren },
    };

    // Mount once in a microtask (after insertion so parent reconciliation completes)
    queueMicrotask(() => {
      const pending = (placeholder as any).__componentPending;
      if (!pending) return; // already mounted or discarded
      // Prevent double mount
      if ((placeholder as any).__mounted) return;

      const propsRef = { current: pending.props };
      const propsGetter = () => propsRef.current;

      // Mark as mounted component
      placeholder.__component = pending.type;
      (placeholder as any).__propsRef = propsRef;
      (placeholder as any).__mounted = true;
      delete (placeholder as any).__componentPending;

      // Execute component body ONCE
      const output = buildElement(
        pending.type.call(placeholder, propsGetter),
      );

      // Normalize and mount output
      if (Array.isArray(output)) {
        const nodes = normalizeToNodes(output as any);
        for (const n of nodes) mountChild(placeholder, n as any);
      } else if (typeof output === "function") {
        setupReactiveRender(placeholder, output as ReactiveGenerator);
      } else if (output instanceof Node) {
        placeholder.appendChild(output);
      } else {
        placeholder.appendChild(document.createTextNode(String(output)));
      }
    });

    return placeholder;
  }

  // Native Element
  const element = document.createElement(type) as ComponentElement;
  // Key support: props.key or props["data-key"]
  if (props) {
    const possibleKey = (props as Record<string, unknown>).key as
      | string
      | undefined;
    if (possibleKey != null) {
      (element as any).__key = String(possibleKey);
      element.setAttribute("data-key", String(possibleKey));
      delete (props as any).key;
    } else if ((props as Record<string, unknown>)["data-key"]) {
      const dk = (props as Record<string, unknown>)["data-key"] as string;
      (element as any).__key = dk;
    }
  }

  if (props) {
    for (const key in props) {
      const value = props[key];
      if (key.startsWith("on") && typeof value === "function") {
        element.addEventListener(
          key.slice(2).toLowerCase(),
          value as EventListener,
        );
      } else if (typeof value === "function") {
        // Reactive prop function
        const evaluate = () => {
          const v = (value as (el: Element) => unknown)(element);
          setPropValue(element, key, v);
        };
        element.addEventListener("update", evaluate);
        evaluate();
      } else {
        setPropValue(element, key, value);
      }
    }
  }

  for (const c of normalizedChildren) {
    mountChild(element, c as any);
  }

  return element;
}

/**
 * Render a root node (or array / fragment) into a container, clearing previous content.
 */
export function render(
  node: JSX.Element,
  container: HTMLElement,
): HTMLElement {
  container.innerHTML = "";
  container.appendChild(node as any);
  return node as any;
}

/* ========================= Update & Lifecycle Events ========================= */

let currentUpdateDispatchId = 0;
/**
 * Create a fresh update Event instance (avoid re-dispatching same Event object).
 */
function createUpdateEvent(): Event {
  return new Event("update");
}

/**
 * Internal: roots scheduled for update (deduped per microtask).
 */
const scheduledUpdateRoots = new Set<Node>();

/**
 * Internal: microtask flush scheduled flag.
 */
let updateFlushScheduled = false;

/**
 * Internal: dispatch updateEvent to subtree of root, skipping elements already visited.
 */
function dispatchUpdateSink(root: Node, visited: Set<Element>): void {
  const list: Element[] = [];
  let node: Node | null = root;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (!visited.has(el)) {
        list.push(el);
        visited.add(el);
      }
    }
    if (node.firstChild) {
      node = node.firstChild;
      continue;
    }
    while (node && node !== root && !node.nextSibling) {
      node = node.parentNode;
    }
    if (!node || node === root) break;
    node = node.nextSibling;
  }
  for (const el of list) {
    el.dispatchEvent(createUpdateEvent());
  }
}

/**
 * Internal: schedule microtask flush.
 */
function scheduleUpdateFlush(): void {
  if (updateFlushScheduled) return;
  updateFlushScheduled = true;
  queueMicrotask(() => {
    updateFlushScheduled = false;
    const roots = Array.from(scheduledUpdateRoots);
    scheduledUpdateRoots.clear();
    const visited = new Set<Element>();
    for (const r of roots) {
      try {
        dispatchUpdateSink(r, visited);
      } catch { /* intentionally swallow errors during update dispatch */ }
    }
  });
}

/**
 * Internal: schedule an element (or component root) for update dispatch.
 */
function scheduleElementUpdate(el: Element): void {
  scheduledUpdateRoots.add(el);
  scheduleUpdateFlush();
}

/**
 * Dispatch an update event to an element subtree (reactive props & functions re-evaluate).
 */
export function update(root: Node): void {
  currentUpdateDispatchId++;
  try {
    dispatchEventSink(root, createUpdateEvent());
  } catch { /* intentionally swallow errors during update dispatch */ }
}

/**
 * Walk an element subtree (snapshot first) and dispatch an event to each element node.
 */
export function dispatchEventSink(el: Node, event: Event): void {
  // Manual preorder depth-first traversal (inclusive of the root node) with snapshot.
  const list: Element[] = [];

  let node: Node | null = el;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const elNode = node as Element;
      if (event.type === "update") {
        // If already scheduled/dispatched for this cycle, skip immediately.
        if ((elNode as any).__lastUpdateId === currentUpdateDispatchId) {
          // already handled this cycle
        } else {
          // Mark immediately so nested dispatches (triggered by reactive updates) cannot re-add.
          (elNode as any).__lastUpdateId = currentUpdateDispatchId;
          list.push(elNode);
        }
      } else {
        list.push(elNode);
      }
    }

    // Try to descend into children first (preorder)
    if (node.firstChild) {
      node = node.firstChild;
      continue;
    }

    // No children — walk up until we find a nextSibling or hit the root
    while (node && node !== el && !node.nextSibling) {
      node = node.parentNode;
    }

    // If we've come back to the root, stop (do not traverse siblings outside the subtree)
    if (!node || node === el) break;

    // Move to the next sibling
    node = node.nextSibling;
  }

  // Dispatch to the snapshot list
  for (const n of list) {
    n.dispatchEvent(event);
  }
}

/**
 * Create an AbortSignal bound to element disconnect.
 */
export function createAbortSignal(target: Node): AbortSignal {
  const controller = new AbortController();
  target.addEventListener("disconnect", () => controller.abort());
  return controller.signal;
}

/* ========================= Connection Events ========================= */

export const connectedEvent = new Event("connect");
export const disconnectedEvent = new Event("disconnect");

/**
 * Global mutation observer to emit connect / disconnect events.
 */
const connectionObserverRoot = document.documentElement || document;

const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const added of Array.from(m.addedNodes)) {
      if (added.nodeType === Node.ELEMENT_NODE) {
        const el = added as Element;
        if ((el as any).isConnected) {
          dispatchEventSink(el, connectedEvent);
        }
      }
    }
    for (const removed of Array.from(m.removedNodes)) {
      if (removed.nodeType === Node.ELEMENT_NODE) {
        dispatchEventSink(removed as Element, disconnectedEvent);
      }
    }
  }
});

observer.observe(connectionObserverRoot, { childList: true, subtree: true });
