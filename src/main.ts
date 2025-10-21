import { Child, ReactiveGenerator, Subscribable } from "./types.ts";

/** Internal extended element with optional component marker. */
type ComponentElement = HTMLElement & {
  __component?: Function;
  [key: string]: unknown;
};

/** Internal component host bookkeeping shape. */
type ComponentHost = ComponentElement & {
  __componentPending?: { type: (propsGetter: () => any) => any; props: any };
  __propsRef?: { current: any };
  __mounted?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Fragment Helpers                                                           */
/* -------------------------------------------------------------------------- */

const FRAGMENT_START_TEMPLATE = document.createComment("(");
const FRAGMENT_END_TEMPLATE = document.createComment(")");

/** Create a fragment boundary pair (start + end comments). */
function createFragmentBoundary(): { start: Comment; end: Comment } {
  return {
    start: FRAGMENT_START_TEMPLATE.cloneNode() as Comment,
    end: FRAGMENT_END_TEMPLATE.cloneNode() as Comment,
  };
}

/* -------------------------------------------------------------------------- */
/* Normalization                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Convert raw child input into a flat array of Nodes and ReactiveGenerators.
 * Functions are preserved; primitives become text or comment nodes.
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

/* -------------------------------------------------------------------------- */
/* Subscribable Detection + Handling                                          */
/* -------------------------------------------------------------------------- */

/** Determine if value conforms to a simple Subscribable interface. */
function isSubscribable(value: unknown): value is Subscribable<unknown> {
  return !!(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Node) &&
    typeof (value as { subscribe?: unknown }).subscribe === "function"
  );
}

/**
 * Given a subscribable child value, return placeholder fragment nodes and schedule subscription.
 * Produces a range (start,end) whose interior reconciles on each emission.
 */
function buildSubscribableChild(storeObj: Subscribable<unknown>): Child {
  const { start, end } = createFragmentBoundary();
  subscribeAndReconcileRange(storeObj, start, end);
  return [start, end];
}

/** Safely execute an unsubscribe structure (function or {unsubscribe}). */
function safelyRunUnsubscribe(
  unsub: void | (() => void) | { unsubscribe(): void },
): void {
  try {
    if (typeof unsub === "function") {
      (unsub as () => void)();
    } else if (
      unsub &&
      typeof (unsub as { unsubscribe(): void }).unsubscribe === "function"
    ) {
      (unsub as { unsubscribe(): void }).unsubscribe();
    }
  } catch {
    // swallow
  }
}

/** Shared helper: subscribe to a store and reconcile a comment-delimited range on each emission. */
function subscribeAndReconcileRange(
  store: Subscribable<unknown>,
  start?: Comment,
  end?: Comment,
  onValue?: (value: unknown) => void,
  disconnectTarget?: Element,
): void {
  // Prop binding path (no range reconciliation)
  if (onValue) {
    let unsub: void | (() => void) | { unsubscribe(): void };
    let previousValue: unknown = Symbol("radi_initial");
    try {
      unsub = store.subscribe((value) => {
        // Short-circuit if structurally identical (primitive / reference equality).
        if (Object.is(value, previousValue)) return;
        previousValue = value;
        try {
          if (disconnectTarget) {
            produceExpandedNodes(disconnectTarget, value, false);
          } else if (start?.parentNode instanceof Element) {
            produceExpandedNodes(start.parentNode as Element, value, false);
          }
          onValue(value);
        } catch (err) {
          if (disconnectTarget) {
            dispatchRenderError(disconnectTarget, err);
          } else if (start?.parentNode instanceof Element) {
            dispatchRenderError(start.parentNode as Element, err);
          }
        }
      });
    } catch (err) {
      if (disconnectTarget) {
        dispatchRenderError(disconnectTarget, err);
      } else if (start?.parentNode instanceof Element) {
        dispatchRenderError(start.parentNode as Element, err);
      }
    }
    (disconnectTarget || start)?.addEventListener?.("disconnect", () => {
      safelyRunUnsubscribe(unsub);
    });
    return;
  }
  // Range reconciliation path
  if (!start || !end) return;
  queueMicrotask(() => {
    const parentEl = start.parentNode as Element | null;
    if (!parentEl) return;
    let previousValue: unknown = Symbol("radi_initial_range");
    const unsub = store.subscribe((value) => {
      // Skip if value strictly identical (covers primitives & reference equality)
      if (Object.is(value, previousValue)) return;
      previousValue = value;
      try {
        // Immediate (no batching) so first emission reflects synchronously in tests expecting initial state.
        const expanded = produceExpandedNodes(parentEl, value, false);
        reconcileRange(start, end, expanded);
      } catch (err) {
        dispatchRenderError(parentEl, err);
      }
    });
    parentEl.addEventListener("disconnect", () => {
      safelyRunUnsubscribe(unsub);
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Element Building                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Build a single child into one of:
 * - Node
 * - Reactive function (wrapped for dynamic reactive insertion)
 * - Array of (Nodes | functions)
 * - Fragment comment boundary pair
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
  if (isSubscribable(child)) {
    return buildSubscribableChild(child);
  }
  if (Array.isArray(child)) {
    return buildArrayChild(child);
  }
  if (child == null) {
    return document.createComment("null");
  }
  return child;
}

/** Build an array child into a fragment boundary wrapping normalized nodes. */
function buildArrayChild(
  childArray: Child[],
  reactivePlaceholder = false,
): Child {
  const { start, end } = createFragmentBoundary();
  const built = childArray
    .map(buildElement)
    .flat(Number.POSITIVE_INFINITY as 1)
    .filter(Boolean) as Child[];
  const normalized = normalizeToNodes(built as any).filter(
    Boolean,
  ) as (Node | ReactiveGenerator)[];
  if (!reactivePlaceholder) {
    return [start, ...normalized, end];
  }
  const out: Node[] = [];
  for (const n of normalized) {
    if (typeof n === "function") {
      const placeholder = document.createComment("deferred-reactive");
      out.push(placeholder);
      queueMicrotask(() => {
        const parent = placeholder.parentNode as Element | null;
        if (parent) {
          setupReactiveRender(parent, n as ReactiveGenerator);
          parent.removeChild(placeholder);
        }
      });
    } else {
      out.push(n);
    }
  }
  return [start, ...out, end];
}

/* -------------------------------------------------------------------------- */
/* Style & Property Utilities                                                 */
/* -------------------------------------------------------------------------- */

/** Apply a plain style object to an element (mutating element.style). */
function applyStyleObject(
  el: HTMLElement,
  styleObj: Record<string, string | number>,
): void {
  for (const k in styleObj) {
    (el.style as any)[k] = styleObj[k];
  }
}

/** Set a property or attribute (including special handling for "style"). */
function setPropValue(el: HTMLElement, key: string, value: unknown): void {
  if (key === "style" && value && typeof value === "object") {
    applyStyleObject(el, value as Record<string, string | number>);
  } else if (key in el) {
    (el as any)[key] = value;
  } else {
    el.setAttribute(key, String(value));
  }
}

/* -------------------------------------------------------------------------- */
/* Lifecycle Event Dispatch                                                   */
/* -------------------------------------------------------------------------- */

/** Dispatch a lifecycle event ("connect" | "disconnect") within a subtree. */
function dispatchLifecycle(node: Node, type: "connect" | "disconnect"): void {
  dispatchEventSink(node, new Event(type));
}

/* -------------------------------------------------------------------------- */
/* Component Build Queue                                                      */
/* -------------------------------------------------------------------------- */

let pendingComponentBuildQueue: ComponentHost[] = [];
let isFlushingComponentBuilds = false;

/** Queue a component host for build if not already mounted. */
function queueComponentForBuild(host: ComponentHost): void {
  if (host.__mounted) return;
  pendingComponentBuildQueue.push(host);
}

/** Perform the initial build for a component host (evaluates component function). */
function buildComponentHost(host: ComponentHost): void {
  const pending = host.__componentPending;
  if (!pending || host.__mounted) return;

  const propsRef = { current: pending.props };
  const propsGetter = () => propsRef.current;

  host.__component = pending.type;
  host.__propsRef = propsRef;
  host.__mounted = true;
  delete host.__componentPending;

  const prevBuilding = currentBuildingComponent;
  currentBuildingComponent = host;
  try {
    const output = buildElement(pending.type.call(host, propsGetter));
    mountBuiltOutput(host, output);
  } catch (err) {
    dispatchRenderError(host, err);
  } finally {
    currentBuildingComponent = prevBuilding;
  }
}

/** Mount output of a component build (Node | function | array). */
function mountBuiltOutput(host: Element, output: Child): void {
  if (Array.isArray(output)) {
    const nodes = normalizeToNodes(output as any);
    for (const n of nodes) mountChild(host, n as any);
  } else if (typeof output === "function") {
    setupReactiveRender(host, output as ReactiveGenerator);
  } else if (output instanceof Node) {
    safeAppend(host, output);
  } else if (output != null) {
    safeAppend(host, document.createTextNode(String(output)));
  }
}

/** Flush queued component builds (breadth-first ordering). */
function flushComponentBuildQueue(): void {
  if (isFlushingComponentBuilds) return;
  isFlushingComponentBuilds = true;
  try {
    while (pendingComponentBuildQueue.length) {
      const host = pendingComponentBuildQueue.shift()!;
      buildComponentHost(host);
    }
  } finally {
    isFlushingComponentBuilds = false;
  }
}

/* -------------------------------------------------------------------------- */
/* Error Dispatch                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Dispatch a bubbling, cancelable render error event.
 * Parents can intercept by listening for "error" and calling preventDefault().
 * Unhandled errors are logged.
 */
function dispatchRenderError(origin: Element, error: unknown): void {
  const event = new CustomEvent("error", {
    detail: { error },
    bubbles: true,
    cancelable: true,
  });
  try {
    origin.dispatchEvent(event);
  } catch (e) {
    console.error(e);
  }
  if (!(event.defaultPrevented || (event as any).cancelBubble)) {
    console.error(error);
  }
}

let currentBuildingComponent: Element | null = null;

/* -------------------------------------------------------------------------- */
/* Event Sink                                                                 */
/* -------------------------------------------------------------------------- */

/** Generic element subtree walker with optional child-skip predicate. */
function walkElements(
  root: Node,
  visit: (el: Element) => void,
  skipChildren?: (el: Element) => boolean,
): void {
  let node: Node | null = root;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      visit(el);
      if (skipChildren && skipChildren(el)) {
        // skip descending
      } else if (el.firstChild) {
        node = el.firstChild;
        continue;
      }
    } else if (node.firstChild) {
      node = node.firstChild;
      continue;
    }
    while (node && node !== root && !node.nextSibling) {
      node = node.parentNode;
    }
    if (!node || node === root) break;
    node = node.nextSibling;
  }
}

/**
 * Walk an element subtree and dispatch an event to each element node.
 * Uses unified walker; update events dedupe via __lastUpdateId.
 */
export function dispatchEventSink(root: Node, event: Event): void {
  const targets: Element[] = [];
  if (event.type === "update") {
    walkElements(
      root,
      (el) => {
        if ((el as any).__lastUpdateId === currentUpdateDispatchId) return;
        (el as any).__lastUpdateId = currentUpdateDispatchId;
        targets.push(el);
      },
      (el) => el !== root && (el as any).__reactiveRoot,
    );
  } else {
    walkElements(root, (el) => targets.push(el));
  }
  for (const el of targets) {
    try {
      el.dispatchEvent(event);
    } catch (err) {
      dispatchRenderError(el, err);
    }
  }
  if (event.type === "connect") {
    flushComponentBuildQueue();
  }
}

/* -------------------------------------------------------------------------- */
/* Abort Signal                                                               */
/* -------------------------------------------------------------------------- */

/** Create an AbortSignal that aborts when the target Node disconnects. */
export function createAbortSignal(target: Node): AbortSignal {
  const controller = new AbortController();
  target.addEventListener("disconnect", () => controller.abort());
  return controller.signal;
}

/* -------------------------------------------------------------------------- */
/* DOM Operation Helpers                                                      */
/* -------------------------------------------------------------------------- */

/** Dispatch connect lifecycle if node is an element. */
function dispatchConnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    dispatchLifecycle(node, "connect");
  }
}

/** Dispatch disconnect lifecycle if node is an element. */
function dispatchDisconnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    (node as any).__radiAlreadyDisconnected = true;
    dispatchLifecycle(node, "disconnect");
  }
}

/** If a node is moving between parents, emit disconnect first. */
function detachIfMoving(node: Node): void {
  if (node.isConnected && node.parentNode) {
    dispatchDisconnectIfElement(node);
  }
}

/** Append while handling lifecycle dispatch. */
function safeAppend(parent: Node & ParentNode, child: Node): void {
  detachIfMoving(child);
  parent.appendChild(child);
  if (child.isConnected) {
    if ((child as any).__deferConnect) {
      delete (child as any).__deferConnect;
    } else {
      dispatchConnectIfElement(child);
    }
  }
}

/** Insert before while handling lifecycle dispatch. */
function safeInsertBefore(
  parent: Node & ParentNode,
  child: Node,
  before: Node | null,
): void {
  detachIfMoving(child);
  parent.insertBefore(child, before);
  if (child.isConnected) dispatchConnectIfElement(child);
}

/** Remove while handling lifecycle dispatch. */
function safeRemove(parent: Node & ParentNode, child: Node): void {
  if (child.parentNode === parent) {
    dispatchDisconnectIfElement(child);
    parent.removeChild(child);
  }
}

/** Replace while handling lifecycle dispatch. */
function safeReplace(
  parent: Node & ParentNode,
  next: Node,
  prev: Node,
): void {
  detachIfMoving(next);
  dispatchDisconnectIfElement(prev);
  parent.replaceChild(next, prev);
  if (next.isConnected) dispatchConnectIfElement(next);
}

/* -------------------------------------------------------------------------- */
/* Reconciliation Core                                                        */
/* -------------------------------------------------------------------------- */

/** Patch text content if both nodes are text nodes. */
function patchText(a: Node, b: Node): boolean {
  if (a.nodeType === Node.TEXT_NODE && b.nodeType === Node.TEXT_NODE) {
    if ((a as Text).nodeValue !== (b as Text).nodeValue) {
      (a as Text).nodeValue = (b as Text).nodeValue;
    }
    return true;
  }
  return false;
}

/** Derive a stable key from an element (internal or data-key). */
function getNodeKey(node: Node): string | null {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element & { __key?: string };
  return (el as any).__key || el.getAttribute("data-key");
}

/** Sync attributes and inline style from a virtual (toEl) element to an existing (fromEl). */
function syncElementProperties(fromEl: Element, toEl: Element): void {
  // Attributes
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
    } else if (fromEl.getAttribute(name) !== value) {
      fromEl.setAttribute(name, value);
    }
  }
  const fromAttrs = fromEl.attributes;
  for (let i = fromAttrs.length - 1; i >= 0; i--) {
    const attr = fromAttrs[i];
    const ns = attr.namespaceURI;
    let name = attr.name;
    if (ns) {
      name = attr.localName || name;
      if (!toEl.hasAttributeNS(ns, name)) fromEl.removeAttributeNS(ns, name);
    } else if (!toEl.hasAttribute(name)) {
      fromEl.removeAttribute(name);
    }
  }
  // Style (cssText fast path)
  const fromStyle = (fromEl as HTMLElement).style.cssText;
  const toStyle = (toEl as HTMLElement).style.cssText;
  if (fromStyle !== toStyle) {
    (fromEl as HTMLElement).style.cssText = toStyle;
  }
}
/** Attempt to patch an existing element with a new one; return success status. */
function patchElement(oldEl: Element, newEl: Element): boolean {
  if (oldEl.nodeName !== newEl.nodeName) return false;

  const oAny = oldEl as ComponentElement;
  const nAny = newEl as ComponentElement;

  const oldKey = (oAny as any).__key || oldEl.getAttribute("data-key");
  const newKey = (nAny as any).__key || newEl.getAttribute("data-key");
  if (oldKey !== newKey && (oldKey != null || newKey != null)) {
    return false;
  }

  // Component host re-use reconciliation
  if (
    oAny.__component &&
    (nAny as any).__componentPending &&
    oAny.__component === (nAny as any).__componentPending.type &&
    oldKey === newKey
  ) {
    if ((oAny as any).__propsRef) {
      (oAny as any).__propsRef.current = (nAny as any).__componentPending.props;
      delete (nAny as any).__componentPending;
      dispatchEventSink(oAny, createUpdateEvent());
    }
    return true;
  }

  if (
    oAny.__component &&
    nAny.__component &&
    oAny.__component !== nAny.__component
  ) {
    return false;
  }

  syncElementProperties(oldEl, newEl);
  reconcileElementChildren(oldEl, newEl);
  return true;
}

/** Sync inline style text if changed. */
function syncStyleIfChanged(oldEl: Element, newEl: Element): void {
  const oldStyle = (oldEl as HTMLElement).style.cssText;
  const newStyle = (newEl as HTMLElement).style.cssText;
  if (oldStyle !== newStyle) {
    (oldEl as HTMLElement).style.cssText = newStyle;
  }
}

/** Reconcile children for an element, delegating keyed vs non-keyed strategies. */
function reconcileElementChildren(oldEl: Element, newEl: Element): void {
  const hasKeys = detectChildKeys(oldEl, newEl);
  if (!hasKeys) {
    reconcileNonKeyedChildren(oldEl, newEl);
  } else {
    reconcileKeyedChildren(oldEl, newEl);
  }
}

/** Detect if any child of either old or new element has a key. */
function detectChildKeys(oldEl: Element, newEl: Element): boolean {
  for (let c = newEl.firstChild; c; c = c.nextSibling) {
    if (getNodeKey(c)) return true;
  }
  for (let c = oldEl.firstChild; c; c = c.nextSibling) {
    if (getNodeKey(c)) return true;
  }
  return false;
}

/** Non-keyed reconciliation strategy (single-pass pairwise). */
function reconcileNonKeyedChildren(oldEl: Element, newEl: Element): void {
  let oldChild: Node | null = oldEl.firstChild;
  let newChild: Node | null = newEl.firstChild;
  while (oldChild || newChild) {
    if (!oldChild) {
      const next = newChild!.nextSibling;
      safeAppend(oldEl, newChild!);
      newChild = next;
      continue;
    }
    if (!newChild) {
      const nextOld = oldChild.nextSibling;
      safeRemove(oldEl, oldChild);
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
      newChild.nodeType === Node.ELEMENT_NODE &&
      patchElement(oldChild as Element, newChild as Element)
    ) {
      oldChild = oldChild.nextSibling;
      newChild = newChild.nextSibling;
      continue;
    }
    const replaceTarget = oldChild;
    const nextOld = oldChild.nextSibling;
    const nextNew = newChild.nextSibling;
    safeReplace(oldEl, newChild, replaceTarget);
    oldChild = nextOld;
    newChild = nextNew;
  }
}

/** Keyed reconciliation strategy (map + positional reordering with pooled map). */
const KEY_MAP_POOL: Map<string, Node>[] = [];
function acquireKeyMap(): Map<string, Node> {
  return KEY_MAP_POOL.pop() ?? new Map();
}
function releaseKeyMap(m: Map<string, Node>): void {
  m.clear();
  if (KEY_MAP_POOL.length < 32) KEY_MAP_POOL.push(m);
}
function reconcileKeyedChildren(oldEl: Element, newEl: Element): void {
  const oldKeyMap = acquireKeyMap();
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

  for (let newPointer = newEl.firstChild; newPointer;) {
    const next = newPointer.nextSibling;
    const newKey = getNodeKey(newPointer);
    if (!newKey) {
      oldPointer = advancePastKeyed(oldPointer);
      if (!oldPointer) {
        safeAppend(oldEl, newPointer);
        newPointer = next;
        continue;
      }
      if (oldPointer === newPointer) {
        processed.add(oldPointer);
        oldPointer = oldPointer.nextSibling;
        newPointer = next;
        continue;
      }
      if (patchText(oldPointer, newPointer)) {
        processed.add(oldPointer);
        oldPointer = oldPointer.nextSibling;
        newPointer = next;
        continue;
      }
      if (
        oldPointer.nodeType === Node.ELEMENT_NODE &&
        newPointer.nodeType === Node.ELEMENT_NODE &&
        patchElement(oldPointer as Element, newPointer as Element)
      ) {
        processed.add(oldPointer);
        oldPointer = oldPointer.nextSibling;
        newPointer = next;
        continue;
      }
      const nextOld = oldPointer.nextSibling;
      safeReplace(oldEl, newPointer, oldPointer);
      processed.add(newPointer);
      oldPointer = nextOld;
      newPointer = next;
      continue;
    }

    const match = oldKeyMap.get(newKey);
    if (match) {
      oldKeyMap.delete(newKey);
      processed.add(match);
      if (match === oldPointer) {
        oldPointer = oldPointer.nextSibling;
      } else {
        if (oldPointer) safeInsertBefore(oldEl, match, oldPointer);
        else safeAppend(oldEl, match);
      }
      reconcileMatchedNode(match, newPointer);
    } else {
      if (oldPointer) safeInsertBefore(oldEl, newPointer, oldPointer);
      else safeAppend(oldEl, newPointer);
    }
    newPointer = next;
  }

  for (const [, node] of oldKeyMap) {
    if (processed.has(node)) continue;
    safeRemove(oldEl, node);
  }
  removeRemainingUnprocessed(oldEl, processed);
  releaseKeyMap(oldKeyMap);
}

/** Advance pointer past keyed nodes to first non-keyed sibling. */
function advancePastKeyed(pointer: Node | null): Node | null {
  while (pointer && getNodeKey(pointer)) {
    pointer = pointer.nextSibling;
  }
  return pointer;
}

/** Reconcile a matched node vs its new counterpart (patch semantics). */
function reconcileMatchedNode(match: Node, newPointer: Node): void {
  if (
    match.nodeType === Node.ELEMENT_NODE &&
    newPointer.nodeType === Node.ELEMENT_NODE
  ) {
    if (match !== newPointer) {
      patchElement(match as Element, newPointer as Element);
    }
  } else if (!patchText(match, newPointer) && match !== newPointer) {
    safeReplace(match.parentNode as any, newPointer, match);
  }
}

/** Remove all remaining unprocessed, non-keyed child nodes from old element. */
function removeRemainingUnprocessed(
  oldEl: Element,
  processed: Set<Node>,
): void {
  for (let c = oldEl.firstChild; c;) {
    const next = c.nextSibling;
    if (!processed.has(c) && !getNodeKey(c)) {
      safeRemove(oldEl, c);
    }
    c = next;
  }
}

/* -------------------------------------------------------------------------- */
/* Range Reconciliation                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Reconcile a comment-delimited range with a new ordered list of nodes.
 * Used for fragment / dynamic reactive outputs.
 */
function reconcileRange(start: Comment, end: Comment, newNodes: Node[]): void {
  const parent = start.parentNode;
  if (!parent || end.parentNode !== parent) return;

  let oldCur: Node | null = start.nextSibling;
  let idx = 0;

  // Pure text-only fast path: single existing text node and single new text node.
  if (
    oldCur &&
    oldCur.nextSibling === end &&
    newNodes.length === 1 &&
    oldCur.nodeType === Node.TEXT_NODE &&
    newNodes[0].nodeType === Node.TEXT_NODE
  ) {
    patchText(oldCur, newNodes[0]);
    return;
  }

  while ((oldCur && oldCur !== end) || idx < newNodes.length) {
    if (oldCur === end) {
      if (idx < newNodes.length) {
        const frag = document.createDocumentFragment();
        const inserted: Node[] = [];
        while (idx < newNodes.length) {
          const n = newNodes[idx++];
          detachIfMoving(n);
          frag.appendChild(n);
          inserted.push(n);
        }
        parent.insertBefore(frag, end);
        // Manually simulate connect lifecycle for each inserted element
        for (const n of inserted) {
          if (n.isConnected) dispatchConnectIfElement(n);
        }
      }
      break;
    }
    const newNode = newNodes[idx];
    if (!oldCur) {
      safeInsertBefore(parent as any, newNode, end);
      idx++;
      continue;
    }
    if (!newNode) {
      while (oldCur && oldCur !== end) {
        const next: Node | null = oldCur.nextSibling;
        safeRemove(parent as any, oldCur);
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
      const oldEl: any = oldCur;
      const newEl: any = newNode;
      // Component host prop reconciliation (reuse host; update props; trigger update)
      if (canReuseComponentHost(oldEl, newEl)) {
        oldEl.__propsRef.current = newEl.__componentPending.props;
        oldEl.dispatchEvent(createUpdateEvent());
        idx++;
        oldCur = oldCur.nextSibling;
        continue;
      }
      if (patchElement(oldEl as Element, newEl as Element)) {
        oldCur = oldCur.nextSibling;
        idx++;
        continue;
      }
    }
    safeInsertBefore(parent as any, newNode, oldCur);
    safeRemove(parent as any, oldCur);
    oldCur = newNode.nextSibling;
    idx++;
  }
}

/** Determine if two nodes represent the same component host, permitting prop update reuse. */
function canReuseComponentHost(oldEl: any, newEl: any): boolean {
  return (
    oldEl.__component &&
    oldEl.__mounted &&
    newEl.__componentPending &&
    oldEl.__component === newEl.__componentPending.type &&
    ((oldEl.__key || null) ===
      (newEl.__key || newEl.getAttribute?.("data-key") || null))
  );
}

/* -------------------------------------------------------------------------- */
/* Reactive Rendering                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Setup reactive rendering: append fragment boundary, subscribe to updates via "update" events.
 * Each render fully reconciles range with newly expanded produced nodes.
 */
function setupReactiveRender(container: Element, fn: ReactiveGenerator): void {
  const { start, end } = createFragmentBoundary();
  container.append(start, end); // boundaries only
  const renderFn = () => {
    try {
      const produced = fn(container);
      const expanded = produceExpandedNodes(container, produced, true);
      reconcileRange(start, end, expanded);
    } catch (err) {
      dispatchRenderError(container, err);
    }
  };
  (container as any).__reactiveRoot = true;
  container.addEventListener("update", renderFn);
  renderFn();
}

/* (expandNormalizedToNodes inlined into produceExpandedNodes) */

/** Produce expanded concrete nodes from a produced value (optionally already built). */
function produceExpandedNodes(
  parent: Element,
  output: unknown,
  alreadyBuilt: boolean,
): Node[] {
  // Fast paths to avoid normalization/allocation when possible.
  if (alreadyBuilt) {
    if (output instanceof Node) return [output];
    if (
      Array.isArray(output) && output.length === 1 && output[0] instanceof Node
    ) {
      return [output[0]];
    }
  } else {
    if (output instanceof Node) return [output];
    const t = typeof output;
    if (t === "string" || t === "number") {
      return [document.createTextNode(String(output))];
    }
    if (output == null || t === "boolean") {
      return [document.createComment(output ? "true" : "null")];
    }
  }
  const built = alreadyBuilt ? output : buildElement(output as Child);
  const arr = Array.isArray(built) ? built : [built];
  const normalized = normalizeToNodes(arr as any);
  const expanded: Node[] = [];
  for (const item of normalized) {
    if (item instanceof Node) {
      expanded.push(item);
      continue;
    }
    if (typeof item === "function") {
      try {
        const innerProduced = (item as ReactiveGenerator)(parent);
        const innerNorm = normalizeToNodes(innerProduced);
        for (const inner of innerNorm) {
          if (inner instanceof Node) expanded.push(inner);
        }
      } catch (err) {
        dispatchRenderError(parent, err);
      }
    }
  }
  return expanded;
}

/* -------------------------------------------------------------------------- */
/* Mount Helper                                                               */
/* -------------------------------------------------------------------------- */

/** Mount either a node or a reactive generator under a parent element. */
function mountChild(parent: Element, nodeOrFn: Node | ReactiveGenerator): void {
  if (typeof nodeOrFn === "function") {
    setupReactiveRender(parent, nodeOrFn as ReactiveGenerator);
  } else {
    safeAppend(parent, nodeOrFn);
  }
}

/* -------------------------------------------------------------------------- */
/* Core Public API                                                            */
/* -------------------------------------------------------------------------- */

export const Fragment = "fragment";

/**
 * Create a Radi element (plain element, fragment, or component placeholder).
 * Function components mount lazily after "connect" to allow error boundary setup.
 */
export function createElement(
  type: string | Function,
  props: Record<string, unknown> | null,
  ...childrenRaw: Child[]
): Child {
  const buildChildrenArray = () => childrenRaw.map(buildElement);
  const buildNormalized = () => normalizeToNodes(buildChildrenArray() as any);

  if (type === "fragment") {
    return buildArrayChild(childrenRaw, true);
  }

  if (typeof type === "function") {
    return createComponentPlaceholder(type, props, childrenRaw);
  }

  return createPlainElement(type, props, buildNormalized());
}

// (createFragmentNodeSet removed; unified into buildArrayChild with reactivePlaceholder flag)

/** Create a component placeholder host element for lazy initial build. */
function createComponentPlaceholder(
  type: Function,
  props: Record<string, unknown> | null,
  childrenRaw: Child[],
): ComponentElement {
  const placeholder = document.createElement(
    "cmp-" + (type.name || "component"),
  ) as ComponentElement & {
    __componentPending?: { type: Function; props: any };
    __deferConnect?: boolean;
  };

  assignKeyIfPresent(placeholder, props);
  placeholder.style.display = "contents";

  const rawChildren = childrenRaw;
  let builtChildrenCache: Child[] | null = null;
  const ensureBuiltChildren = (): Child[] => {
    if (builtChildrenCache) return builtChildrenCache;
    builtChildrenCache = rawChildren.map(buildElement);
    return builtChildrenCache;
  };

  (placeholder as any).__componentPending = {
    type,
    props: {
      ...(props || {}),
      get children() {
        return ensureBuiltChildren();
      },
    },
  };

  placeholder.addEventListener("connect", () => {
    queueComponentForBuild(placeholder as any);
  });

  return placeholder;
}

/** Create and populate a plain DOM element with props and children. */
function createPlainElement(
  type: string,
  props: Record<string, unknown> | null,
  normalizedChildren: (Node | ReactiveGenerator)[],
): ComponentElement {
  const element = document.createElement(type) as ComponentElement;
  assignKeyIfPresent(element, props);
  if (props) applyPropsToPlainElement(element, props);
  for (const c of normalizedChildren) {
    mountChild(element, c as any);
  }
  return element;
}

/** Assign a key from props to element if present (key or data-key). */
function assignKeyIfPresent(
  el: ComponentElement,
  props: Record<string, unknown> | null,
): void {
  if (!props) return;
  const pAny = props as Record<string, unknown>;
  if (pAny.key != null) {
    (el as any).__key = String(pAny.key);
    el.setAttribute("data-key", String(pAny.key));
    delete pAny.key;
  } else if (pAny["data-key"] != null) {
    (el as any).__key = String(pAny["data-key"]);
  }
}

/** Apply props to a plain DOM element (events, functions, subscribables, primitives). */
function applyPropsToPlainElement(
  element: HTMLElement,
  props: Record<string, unknown>,
): void {
  for (const key in props) {
    const value = props[key];
    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(
        key.slice(2).toLowerCase(),
        value as EventListener,
      );
      continue;
    }
    if (typeof value === "function") {
      bindFunctionProp(element, key, value as (el: Element) => unknown);
      continue;
    }
    if (isSubscribable(value)) {
      bindSubscribableProp(element, key, value);
      continue;
    }
    setPropValue(element, key, value);
  }
}

/** Bind a function-valued prop and re-evaluate on "update" events. */
function bindFunctionProp(
  element: HTMLElement,
  key: string,
  value: (el: Element) => unknown,
): void {
  const evaluate = () => {
    try {
      const v = value(element);
      setPropValue(element, key, v);
    } catch (err) {
      reportPropError(element, err);
    }
  };
  element.addEventListener("update", evaluate);
  evaluate();
}

/** Subscribe a subscribable prop and reflect changes into an element property. */
function bindSubscribableProp(
  element: HTMLElement,
  key: string,
  subscribable: Subscribable<unknown>,
): void {
  subscribeAndReconcileRange(
    subscribable,
    undefined,
    undefined,
    (v) => {
      try {
        setPropValue(element, key, v);
      } catch (err) {
        dispatchRenderError(element, err);
      }
    },
    element,
  );
}

/** Report an error for a function prop evaluation (prefers current building component boundary). */
function reportPropError(element: HTMLElement, err: unknown): void {
  if (!element.isConnected && currentBuildingComponent) {
    dispatchRenderError(currentBuildingComponent, err);
  } else {
    dispatchRenderError(element, err);
  }
}

/* -------------------------------------------------------------------------- */
/* Root Management                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Create a managed Radi root for a container element.
 * Repeated renders reconcile instead of full teardown.
 */
export function createRoot(container: HTMLElement): {
  root: HTMLElement;
  render: (node: JSX.Element) => HTMLElement;
  unmount: () => void;
} {
  clearContainerInitialChildren(container);

  const { start, end } = createFragmentBoundary();
  container.append(start, end);

  function render(node: JSX.Element): HTMLElement {
    const built = buildElement(node as any);
    const normalized = normalizeToNodes(
      Array.isArray(built) ? (built as any) : [built as any],
    ) as Node[];
    reconcileRange(start, end, normalized);
    return node as any;
  }

  function unmount(): void {
    let cur: Node | null = start.nextSibling;
    while (cur && cur !== end) {
      const next = cur.nextSibling;
      safeRemove(container as any, cur);
      cur = next;
    }
  }

  return { root: container, render, unmount };
}

/** Remove all existing child nodes from the container (with disconnect dispatch). */
function clearContainerInitialChildren(container: HTMLElement): void {
  for (let c = container.firstChild; c;) {
    const next = c.nextSibling;
    if (c.parentNode === container) {
      dispatchDisconnectIfElement(c);
      container.removeChild(c);
    }
    c = next;
  }
}

/* -------------------------------------------------------------------------- */
/* Update Scheduling                                                          */
/* -------------------------------------------------------------------------- */

let currentUpdateDispatchId = 0;

/** Create a new "update" Event instance. */
function createUpdateEvent(): Event {
  return new Event("update");
}

const scheduledUpdateRoots = new Set<Node>();
let updateFlushScheduled = false;

/**
 * Dispatch update events to all elements under root (skipping nested reactive roots).
 * Avoids duplicates via visited set.
 */
function dispatchUpdateSink(root: Node, visited: Set<Element>): void {
  const toDispatch: Element[] = [];
  walkElements(
    root,
    (el) => {
      if (visited.has(el)) return;
      visited.add(el);
      toDispatch.push(el);
    },
    (el) => el !== root && (el as any).__reactiveRoot,
  );
  for (const el of toDispatch) {
    try {
      el.dispatchEvent(createUpdateEvent());
    } catch (err) {
      dispatchRenderError(el, err);
    }
  }
}

/** Schedule a microtask flush for all pending update roots. */
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
      } catch (err) {
        if (r instanceof Element) {
          dispatchRenderError(r, err);
        } else {
          console.error(err);
        }
      }
    }
  });
}

/** Mark an element for update dispatch inclusion. */
function scheduleElementUpdate(el: Element): void {
  scheduledUpdateRoots.add(el);
  scheduleUpdateFlush();
}

/**
 * Dispatch a global update cycle from a root Node.
 * Triggers component reactive evaluation and prop function re-execution.
 */
export function update(root: Node): void {
  currentUpdateDispatchId++;
  try {
    dispatchEventSink(root, createUpdateEvent());
  } catch (err) {
    if (root instanceof Element) {
      dispatchRenderError(root, err);
    } else {
      console.error(err);
    }
  }
}
