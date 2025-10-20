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

function createFragmentBoundary(): { start: Comment; end: Comment } {
  return {
    start: FRAGMENT_START_TEMPLATE.cloneNode() as Comment,
    end: FRAGMENT_END_TEMPLATE.cloneNode() as Comment,
  };
}

/* ========================= Node Normalization ========================= */

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

function applyStyleObject(
  el: HTMLElement,
  styleObj: Record<string, string | number>,
): void {
  for (const k in styleObj) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el.style as any)[k] = styleObj[k];
  }
}

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

/* ========================= Lifecycle Events ========================= */

export const connectedEvent = new Event("connect");
export const disconnectedEvent = new Event("disconnect");

/**
 * Dispatch a bubbling, cancelable render error event.
 * Parents can listen for "error" and call stopPropagation()/preventDefault()
 * to intercept the error. If left unhandled (default not prevented) it is logged.
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
    // eslint-disable-next-line no-console
    console.error(e);
  }
  if (!(event.defaultPrevented || (event as any).cancelBubble)) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}
let currentBuildingComponent: Element | null = null;

/**
 * Walk an element subtree (snapshot first) and dispatch an event to each element node.
 * Errors thrown by listeners on individual elements are converted into bubbling error events.
 */
export function dispatchEventSink(el: Node, event: Event): void {
  const list: Element[] = [];
  let node: Node | null = el;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const elNode = node as Element;
      if (event.type === "update") {
        if ((elNode as any).__lastUpdateId === currentUpdateDispatchId) {
          // already handled
        } else {
          (elNode as any).__lastUpdateId = currentUpdateDispatchId;
          list.push(elNode);
        }
      } else {
        list.push(elNode);
      }
    }
    if (node.firstChild) {
      node = node.firstChild;
      continue;
    }
    while (node && node !== el && !node.nextSibling) {
      node = node.parentNode;
    }
    if (!node || node === el) break;
    node = node.nextSibling;
  }
  for (const n of list) {
    try {
      n.dispatchEvent(event);
    } catch (err) {
      dispatchRenderError(n, err);
    }
  }
}

/**
 * AbortSignal tied to disconnect event.
 */
export function createAbortSignal(target: Node): AbortSignal {
  const controller = new AbortController();
  target.addEventListener("disconnect", () => controller.abort());
  return controller.signal;
}

/* ========================= DOM Operation Helpers ========================= */

function dispatchConnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    dispatchEventSink(node, connectedEvent);
  }
}

function dispatchDisconnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    // Mark root so external removal observer can ignore duplicate disconnect.
    (node as any).__radiAlreadyDisconnected = true;
    dispatchEventSink(node, disconnectedEvent);
  }
}

function detachIfMoving(node: Node): void {
  if (node.isConnected && node.parentNode) {
    dispatchDisconnectIfElement(node);
  }
}

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

function safeInsertBefore(
  parent: Node & ParentNode,
  child: Node,
  before: Node | null,
): void {
  detachIfMoving(child);
  parent.insertBefore(child, before);
  if (child.isConnected) dispatchConnectIfElement(child);
}

function safeRemove(parent: Node & ParentNode, child: Node): void {
  if (child.parentNode === parent) {
    dispatchDisconnectIfElement(child);
    parent.removeChild(child);
  }
}

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

/* ========================= Reconciliation Core ========================= */

function patchText(a: Node, b: Node): boolean {
  if (a.nodeType === Node.TEXT_NODE && b.nodeType === Node.TEXT_NODE) {
    if ((a as Text).nodeValue !== (b as Text).nodeValue) {
      (a as Text).nodeValue = (b as Text).nodeValue;
    }
    return true;
  }
  return false;
}

function getNodeKey(node: Node): string | null {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element & { __key?: string };
  return (el as any).__key || el.getAttribute("data-key");
}

function diffAttributes(fromEl: Element, toEl: Element): void {
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

function patchElement(oldEl: Element, newEl: Element): boolean {
  if (oldEl.nodeName !== newEl.nodeName) return false;

  const oAny = oldEl as ComponentElement;
  const nAny = newEl as ComponentElement;

  const oldKey = (oAny as any).__key || oldEl.getAttribute("data-key");
  const newKey = (nAny as any).__key || newEl.getAttribute("data-key");
  if (oldKey !== newKey && (oldKey != null || newKey != null)) {
    return false;
  }

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

  diffAttributes(oldEl, newEl);

  const oldStyle = (oldEl as HTMLElement).style.cssText;
  const newStyle = (newEl as HTMLElement).style.cssText;
  if (oldStyle !== newStyle) {
    (oldEl as HTMLElement).style.cssText = newStyle;
  }

  reconcileElementChildren(oldEl, newEl);
  return true;
}

function reconcileElementChildren(oldEl: Element, newEl: Element): void {
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
    let oldChild: Node | null = oldEl.firstChild;
    let newChild: Node | null = newEl.firstChild;
    while (oldChild || newChild) {
      if (!oldChild) {
        safeAppend(oldEl, newChild!);
        newChild = newChild!.nextSibling;
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
      safeReplace(oldEl, newChild, replaceTarget);
      oldChild = nextOld;
      newChild = nextNew;
    }
    return;
  }

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
      while (oldPointer && getNodeKey(oldPointer)) {
        oldPointer = oldPointer.nextSibling;
      }
      if (!oldPointer) {
        safeAppend(oldEl, newPointer);
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
      const nextOld = oldPointer.nextSibling;
      safeReplace(oldEl, newPointer, oldPointer);
      processed.add(newPointer);
      oldPointer = nextOld;
      continue;
    }

    const match = oldKeyMap.get(newKey);
    if (match) {
      oldKeyMap.delete(newKey);
      processed.add(match);
      if (match === oldPointer) {
        oldPointer = oldPointer.nextSibling;
      } else {
        if (oldPointer) {
          safeInsertBefore(oldEl, match, oldPointer);
        } else {
          safeAppend(oldEl, match);
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
        safeReplace(oldEl, newPointer, match);
      }
    } else {
      if (oldPointer) {
        safeInsertBefore(oldEl, newPointer, oldPointer);
      } else {
        safeAppend(oldEl, newPointer);
      }
    }
  }

  for (const [, node] of oldKeyMap) {
    if (processed.has(node)) continue;
    safeRemove(oldEl, node);
  }
  for (let c = oldEl.firstChild; c;) {
    const next = c.nextSibling;
    if (!processed.has(c) && !getNodeKey(c)) {
      safeRemove(oldEl, c);
    }
    c = next;
  }
}

function reconcileRange(start: Comment, end: Comment, newNodes: Node[]): void {
  const parent = start.parentNode;
  if (!parent || end.parentNode !== parent) return;

  let oldCur: Node | null = start.nextSibling;
  let idx = 0;

  while ((oldCur && oldCur !== end) || idx < newNodes.length) {
    if (oldCur === end) {
      while (idx < newNodes.length) {
        safeInsertBefore(parent as any, newNodes[idx++], end);
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
      if (patchElement(oldCur as Element, newNode as Element)) {
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

/* ========================= Reactive Rendering ========================= */

function setupReactiveRender(container: Element, fn: ReactiveGenerator): void {
  const { start, end } = createFragmentBoundary();
  container.append(start, end); // comments only (skip connect dispatch)
  const renderFn = () => {
    try {
      const produced = fn(container);
      const flat = normalizeToNodes(produced).filter(
        (n): n is Node => n instanceof Node,
      );
      reconcileRange(start, end, flat);
    } catch (err) {
      dispatchRenderError(container, err);
    }
  };
  container.addEventListener("update", renderFn);
  renderFn();
}

/* ========================= Mount Helper ========================= */

function mountChild(parent: Element, nodeOrFn: Node | ReactiveGenerator): void {
  if (typeof nodeOrFn === "function") {
    setupReactiveRender(parent, nodeOrFn as ReactiveGenerator);
  } else {
    safeAppend(parent, nodeOrFn);
  }
}

/* ========================= Radi Core ========================= */

export const Fragment = "fragment";

export function createElement(
  type: string | Function,
  props: Record<string, unknown> | null,
  ...childrenRaw: Child[]
): Node | Node[] {
  const builtChildren = childrenRaw.map(buildElement);
  const normalizedChildren = normalizeToNodes(builtChildren as any);

  if (type === "fragment") {
    const { start, end } = createFragmentBoundary();
    const fragmentNodes: Node[] = [];
    for (const c of normalizedChildren) {
      if (typeof c === "function") {
        const placeholder = document.createComment("deferred-reactive");
        fragmentNodes.push(placeholder);
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

  if (typeof type === "function") {
    const placeholder = document.createElement(
      "cmp-" + (type.name || "component"),
    ) as ComponentElement & {
      __componentPending?: { type: Function; props: any };
      __deferConnect?: boolean;
    };
    (placeholder as any).__deferConnect = true;
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
    queueMicrotask(() => {
      const pending = (placeholder as any).__componentPending;
      if (!pending) return;
      if ((placeholder as any).__mounted) return;

      const propsRef = { current: pending.props };
      const propsGetter = () => propsRef.current;

      placeholder.__component = pending.type;
      (placeholder as any).__propsRef = propsRef;
      (placeholder as any).__mounted = true;
      delete (placeholder as any).__componentPending;

      const prevBuilding = currentBuildingComponent;
      currentBuildingComponent = placeholder;
      try {
        const output = buildElement(
          pending.type.call(placeholder, propsGetter),
        );
        if (Array.isArray(output)) {
          const nodes = normalizeToNodes(output as any);
          for (const n of nodes) mountChild(placeholder, n as any);
        } else if (typeof output === "function") {
          setupReactiveRender(placeholder, output as ReactiveGenerator);
        } else if (output instanceof Node) {
          safeAppend(placeholder, output);
        } else {
          safeAppend(
            placeholder,
            document.createTextNode(String(output)),
          );
        }
      } catch (err) {
        dispatchRenderError(placeholder, err);
      } finally {
        currentBuildingComponent = prevBuilding;
      }
      // Emit deferred connect for the component placeholder after its output mounts (or after error).
      placeholder.dispatchEvent(connectedEvent);
    });
    return placeholder;
  }

  const element = document.createElement(type) as ComponentElement;
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
        const evaluate = () => {
          try {
            const v = (value as (el: Element) => unknown)(element);
            setPropValue(element, key, v);
          } catch (err) {
            if (!element.isConnected && currentBuildingComponent) {
              dispatchRenderError(currentBuildingComponent, err);
            } else {
              dispatchRenderError(element, err);
            }
          }
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

/* ========================= Render Root ========================= */

export function render(
  node: JSX.Element,
  container: HTMLElement,
): HTMLElement {
  // Remove existing children with disconnect events
  const toRemove: Node[] = [];
  for (let c = container.firstChild; c; c = c.nextSibling) {
    toRemove.push(c);
  }
  for (const c of toRemove) {
    if (c.parentNode === container) {
      dispatchDisconnectIfElement(c);
      container.removeChild(c);
    }
  }
  // Append new root (fragment array or single)
  safeAppend(container, node as any);
  return node as any;
}

/* ========================= Update & Lifecycle (Update) ========================= */

let currentUpdateDispatchId = 0;

function createUpdateEvent(): Event {
  return new Event("update");
}

const scheduledUpdateRoots = new Set<Node>();
let updateFlushScheduled = false;

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
    try {
      el.dispatchEvent(createUpdateEvent());
    } catch (err) {
      dispatchRenderError(el, err);
    }
  }
}

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
          // eslint-disable-next-line no-console
          console.error(err);
        }
      }
    }
  });
}

function scheduleElementUpdate(el: Element): void {
  scheduledUpdateRoots.add(el);
  scheduleUpdateFlush();
}

export function update(root: Node): void {
  currentUpdateDispatchId++;
  try {
    dispatchEventSink(root, createUpdateEvent());
  } catch (err) {
    if (root instanceof Element) {
      dispatchRenderError(root, err);
    } else {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }
}

/* ========================= External Removal Observer ========================= */
/*
  Restores disconnect events for element removals performed outside Radi helpers
  (e.g. direct DOM APIs like el.remove() or parent.removeChild(el)).
  Guards against duplicate disconnect by skipping nodes marked during
  Radi-managed removal (flag: __radiAlreadyDisconnected).
*/
const removalObserverRoot = document.documentElement || document;
const removalObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const removed of Array.from(m.removedNodes)) {
      if (
        removed.nodeType === Node.ELEMENT_NODE &&
        !(removed as any).__radiAlreadyDisconnected
      ) {
        dispatchEventSink(removed, disconnectedEvent);
      }
    }
  }
});
removalObserver.observe(removalObserverRoot, {
  childList: true,
  subtree: true,
});
