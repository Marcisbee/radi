/**
 * Radi client + DOM implementation (single-file build).
 * Exposes high-level element / root APIs plus keyed reconciliation & reactive regions.
 * Internal helpers favor minimal passes and small surface area.
 */

import {
  connect,
  createAbortSignal,
  createAbortSignalOnUpdate,
  disconnect,
  dispatchConnect,
  dispatchDisconnect,
  isComponentHost,
  markComponentHost,
  markEventable,
  markReactiveRoot,
  update,
} from "./lifecycle.ts";
import type { Child, ReactiveGenerator, Subscribable } from "./types.ts";
import { dispatchRenderError } from "./error.ts";
import {
  createDomAdapter,
  createRenderer,
  createServerStringAdapter,
  DOM_RENDERER,
} from "./renderer.ts";

/* -------------------------------------------------------------------------- */
/* Fragment Boundary                                                          */
/* -------------------------------------------------------------------------- */

const FRAGMENT_START_TEMPLATE: Comment = document.createComment("(");
const FRAGMENT_END_TEMPLATE: Comment = document.createComment(")");

function createFragmentBoundary(): { start: Comment; end: Comment } {
  return {
    start: FRAGMENT_START_TEMPLATE.cloneNode() as Comment,
    end: FRAGMENT_END_TEMPLATE.cloneNode() as Comment,
  };
}

/* -------------------------------------------------------------------------- */
/* Normalization                                                              */
/* -------------------------------------------------------------------------- */

// normalizeToNodes removed (logic merged into expandToNodes)

/* -------------------------------------------------------------------------- */
/* Subscribable Helpers                                                       */
/* -------------------------------------------------------------------------- */

function isSubscribableValue<T = unknown>(
  value: unknown,
): value is Subscribable<T> {
  return !!(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Node) &&
    typeof (value as { subscribe?: unknown }).subscribe === "function"
  );
}

function safelyRunUnsubscribe(
  unsub: void | (() => void) | { unsubscribe(): void },
): void {
  try {
    if (typeof unsub === "function") unsub();
    else if (
      typeof unsub === "object" && unsub &&
      typeof (unsub as { unsubscribe?: unknown }).unsubscribe === "function"
    ) {
      (unsub as { unsubscribe(): void }).unsubscribe();
    }
  } catch {
    // ignore
  }
}

function subscribeAndReconcileRange(
  store: Subscribable<unknown>,
  start: Comment,
  end: Comment,
): void {
  queueMicrotask(() => {
    const parentEl = start.parentNode as Element | null;
    if (!parentEl) return;
    let previous: unknown = Symbol("radi_initial_range");
    const unsub = store.subscribe((value: unknown) => {
      if (Object.is(value, previous)) return;
      previous = value;
      try {
        const expanded = realize(parentEl, value);
        reconcileRange(start, end, expanded);
      } catch (err) {
        dispatchRenderError(parentEl, err);
      }
    });
    markEventable(parentEl);
    parentEl.addEventListener("disconnect", () => {
      safelyRunUnsubscribe(
        unsub as (void | (() => void) | { unsubscribe(): void }),
      );
    });
  });
}

function buildSubscribableChild(store: Subscribable<unknown>): Child {
  const { start, end } = createFragmentBoundary();
  subscribeAndReconcileRange(store, start, end);
  return [start, end];
}

// removed: subscribable handling now inlined inside buildElement / expandToNodes

/* -------------------------------------------------------------------------- */
/* Unified Expansion Helper (work-in-progress)                                */
/* -------------------------------------------------------------------------- */
/**
 * expandToNodes
 *  Converts an arbitrary value (child output, reactive emission, subscribable value)
 *  into a flat array of concrete DOM Nodes. Executes reactive generator functions
 *  (functions receiving parent) eagerly so their produced structure participates
 *  in the same reconciliation frame. When alreadyBuilt=true, treats the input
 *  as structurally processed and only performs final flattening / primitive wrapping.
 */
/**
 * realize
 *  Unified conversion of any Child-like value into concrete DOM Nodes.
 *  Handles: null/boolean -> comment, string/number -> text, Node passthrough,
 *  subscribable -> fragment anchors + subscription, function -> reactive scope execution,
 *  arrays (deeply) -> flattened node list.
 */
function realize(parent: Element, value: unknown): Node[] {
  const queue: unknown[] = Array.isArray(value) ? [...value] : [value];
  const out: Node[] = [];
  while (queue.length) {
    const v = queue.shift();
    if (v == null) {
      out.push(document.createComment("null"));
      continue;
    }
    if (v instanceof Node) {
      out.push(v);
      continue;
    }
    if (typeof v === "string" || typeof v === "number") {
      out.push(document.createTextNode(String(v)));
      continue;
    }
    if (typeof v === "boolean") {
      out.push(document.createComment(v ? "true" : "false"));
      continue;
    }
    if (isSubscribableValue(v)) {
      // Expand subscribable to its placeholder (fragment) and keep going.
      const placeholder = buildSubscribableChild(v as Subscribable<unknown>);
      if (Array.isArray(placeholder)) {
        queue.unshift(...placeholder);
      } else {
        queue.unshift(placeholder);
      }
      continue;
    }
    if (typeof v === "function") {
      try {
        const produced = (v as ReactiveGenerator)(parent);
        if (Array.isArray(produced)) queue.unshift(...produced);
        else queue.unshift(produced);
      } catch (err) {
        dispatchRenderError(parent, err);
      }
      continue;
    }
    if (Array.isArray(v)) {
      queue.unshift(...v);
      continue;
    }
    // Fallback: stringify
    out.push(document.createTextNode(String(v)));
  }
  return out;
}

function bindSubscribableProp(
  element: HTMLElement,
  key: string,
  subscribable: Subscribable<unknown>,
): void {
  let previous: unknown = Symbol("radi_initial_prop");
  let unsub: void | (() => void) | { unsubscribe(): void };
  try {
    unsub = subscribable.subscribe((value: unknown) => {
      if (Object.is(value, previous)) return;
      previous = value;
      try {
        setPropValue(element, key, value);
      } catch (err) {
        dispatchRenderError(element, err);
      }
    });
  } catch (err) {
    dispatchRenderError(element, err);
  }
  markEventable(element);
  element.addEventListener("disconnect", () => {
    safelyRunUnsubscribe(
      unsub as (void | (() => void) | { unsubscribe(): void }),
    );
  });
}

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

function applyStyleObject(
  el: HTMLElement,
  styleObj: Record<string, string | number>,
): void {
  for (const k in styleObj) {
    (el.style as unknown as Record<string, string>)[k] = String(styleObj[k]);
  }
}

function setPropValue(
  el: HTMLElement,
  key: string,
  value: unknown,
): void {
  if (key === "style" && value && typeof value === "object") {
    applyStyleObject(el, value as Record<string, string | number>);
  } else if (key in el) {
    (el as HTMLElement & Record<string, unknown>)[key] = value as unknown;
  } else {
    el.setAttribute(key, String(value));
  }
}

function reportPropError(element: HTMLElement, err: unknown): void {
  const boundary = !element.isConnected ? currentBuildingComponent : null;
  dispatchRenderError(boundary || element, err);
}

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
      markReactiveRoot(element);
      bindFunctionProp(element, key, value as (el: Element) => unknown);
      continue;
    }
    if (isSubscribableValue(value)) {
      bindSubscribableProp(element, key, value);
      continue;
    }
    setPropValue(element, key, value);
  }
}

/* -------------------------------------------------------------------------- */
/* Reactive Regions                                                           */
/* -------------------------------------------------------------------------- */

function setupReactiveRender(
  container: Element,
  fn: ReactiveGenerator,
): void {
  const { start, end } = createFragmentBoundary();
  container.append(start, end);

  const renderFn = () => {
    try {
      const produced = fn(container);
      const expanded = realize(container, produced);
      reconcileRange(start, end, expanded);
    } catch (err) {
      dispatchRenderError(container, err);
    }
  };

  markReactiveRoot(container);
  container.addEventListener("update", renderFn);
  renderFn();
}

/* -------------------------------------------------------------------------- */
/* Component Placeholder & Build Queue                                        */
/* -------------------------------------------------------------------------- */

export type ComponentFn = (this: HTMLElement, props: () => unknown) => Child;

export interface ComponentElement extends HTMLElement {
  __component?: ComponentFn;
  __componentPending?: { type: ComponentFn; props: Record<string, unknown> };
  __propsRef?: { current: Record<string, unknown> };
  __mounted?: boolean;
  __key?: string;
  [key: string]: unknown;
}

const RADI_HOST_TAG = "radi-host";

export let currentBuildingComponent: Element | null = null;

/* Lazy component build queue (reintroduced for correct lifecycle ordering) */
const pendingComponentBuildQueue: ComponentElement[] = [];
let isFlushingComponentBuilds = false;

/** Queue a component host for initial build if not already mounted. */
function queueComponentForBuild(host: ComponentElement): void {
  if (host.__mounted) return;
  pendingComponentBuildQueue.push(host);
}

/** Perform initial component build (invokes component function and mounts output). */
function mountChild(parent: Element, value: unknown): void {
  if (value == null) {
    safeAppend(parent, document.createComment("null"));
    return;
  }
  if (value instanceof Node) {
    safeAppend(parent, value);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) mountChild(parent, v);
    return;
  }
  if (isSubscribableValue(value)) {
    const placeholder = buildSubscribableChild(value as Subscribable<unknown>);
    if (Array.isArray(placeholder)) {
      for (const p of placeholder) mountChild(parent, p);
    } else {
      mountChild(parent, placeholder);
    }
    return;
  }
  const t = typeof value;
  if (t === "string" || t === "number") {
    safeAppend(parent, document.createTextNode(String(value)));
    return;
  }
  if (t === "boolean") {
    safeAppend(parent, document.createComment(value ? "true" : "false"));
    return;
  }
  if (t === "function") {
    // Treat as reactive generator – do NOT execute immediately
    setupReactiveRender(parent, value as ReactiveGenerator);
    return;
  }
  // Fallback
  safeAppend(parent, document.createTextNode(String(value)));
}
function buildComponentHost(host: ComponentElement): void {
  const pending = host.__componentPending;
  if (!pending || host.__mounted) return;

  const propsRef: { current: Record<string, unknown> } = {
    current: pending.props as Record<string, unknown>,
  };
  const propsGetter = (): Record<string, unknown> => propsRef.current;

  host.__component = pending.type;
  host.__propsRef = propsRef;
  host.__mounted = true;
  delete host.__componentPending;

  const prev = currentBuildingComponent;
  currentBuildingComponent = host;
  try {
    const output = pending.type.call(host, propsGetter) as Child;
    mountChild(host, output);
  } catch (err) {
    dispatchRenderError(host, err);
  } finally {
    currentBuildingComponent = prev;
  }
}

/** Flush queued component builds (breadth-first). */
function flushComponentBuildQueue(): void {
  if (isFlushingComponentBuilds) return;
  isFlushingComponentBuilds = true;
  try {
    while (pendingComponentBuildQueue.length) {
      const host = pendingComponentBuildQueue.shift();
      if (!host) break;
      buildComponentHost(host);
    }
  } finally {
    isFlushingComponentBuilds = false;
  }
}

function createComponentPlaceholder(
  type: ComponentFn,
  props: Record<string, unknown> | null,
  childrenRaw: Child[],
): ComponentElement {
  const placeholder = document.createElement(RADI_HOST_TAG) as ComponentElement;
  markComponentHost(placeholder);

  if (props && (props as Record<string, unknown>).key != null) {
    const propsRecord = props as Record<string, unknown>;
    placeholder.__key = String(propsRecord.key);
    delete propsRecord.key;
  }

  placeholder.style.display = "contents";

  const rawChildren = childrenRaw;
  const ensureBuiltChildren = (): Child[] => rawChildren;

  placeholder.__componentPending = {
    type,
    props: {
      ...(props || {}),
      get children() {
        return ensureBuiltChildren();
      },
    },
  };

  placeholder.addEventListener(
    "connect",
    () => {
      queueComponentForBuild(placeholder);
      flushComponentBuildQueue();
    },
    { passive: true, capture: true, once: true },
  );

  return placeholder;
}

/* -------------------------------------------------------------------------- */
/* Plain Element Creation                                                     */
/* -------------------------------------------------------------------------- */

function assignKeyIfPresent(
  el: HTMLElement & { __key?: string },
  props: Record<string, unknown> | null,
): void {
  if (!props) return;
  const pAny = props as Record<string, unknown>;
  if (pAny.key != null) {
    el.__key = String(pAny.key);
    delete pAny.key;
  }
}

function createPlainElement(
  type: string,
  props: Record<string, unknown> | null,
  normalizedChildren: (Node | ReactiveGenerator)[],
): HTMLElement & { __key?: string } {
  const element = document.createElement(type) as HTMLElement & {
    __key?: string;
  };
  assignKeyIfPresent(element, props);
  if (props) applyPropsToPlainElement(element, props);
  for (const c of normalizedChildren) {
    if (typeof c === "function") {
      setupReactiveRender(element, c as ReactiveGenerator);
    } else {
      for (const n of realize(element, c)) element.appendChild(n);
    }
  }
  return element;
}

/* -------------------------------------------------------------------------- */
/* Element Building                                                           */
/* -------------------------------------------------------------------------- */

// buildElement removed (logic unified into realize)

// buildArrayChild removed (arrays flattened by realize)

/* -------------------------------------------------------------------------- */
/* Reconciliation: Node Ops                                                   */
/* -------------------------------------------------------------------------- */

function dispatchConnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) dispatchConnect(node);
}

function dispatchDisconnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) dispatchDisconnect(node);
}

function detachIfMoving(node: Node): void {
  const parent = node.parentNode;
  if (parent) {
    dispatchDisconnectIfElement(node);
    parent.removeChild(node);
  }
}

function safeAppend(parent: ParentNode & Node, child: Node): void {
  detachIfMoving(child);
  parent.appendChild(child);
  if (child.isConnected) dispatchConnectIfElement(child);
}

function safeInsertBefore(
  parent: ParentNode & Node,
  child: Node,
  before: Node | null,
): void {
  detachIfMoving(child);
  parent.insertBefore(child, before);
  if (child.isConnected) dispatchConnectIfElement(child);
}

function safeRemove(parent: ParentNode & Node, child: Node): void {
  if (child.parentNode === parent) {
    dispatchDisconnectIfElement(child);
    parent.removeChild(child);
  }
}

function safeReplace(
  parent: ParentNode & Node,
  next: Node,
  prev: Node,
): void {
  detachIfMoving(next);
  dispatchDisconnectIfElement(prev);
  parent.replaceChild(next, prev);
  if (next.isConnected) dispatchConnectIfElement(next);
}

/* -------------------------------------------------------------------------- */
/* Reconciliation: Patch Helpers                                              */
/* -------------------------------------------------------------------------- */

function patchText(a: Node, b: Node): boolean {
  if (a.nodeType === Node.TEXT_NODE && b.nodeType === Node.TEXT_NODE) {
    const ta = a as Text;
    const tb = b as Text;
    if (ta.nodeValue !== tb.nodeValue) ta.nodeValue = tb.nodeValue;
    return true;
  }
  return false;
}

function getNodeKey(node: Node): string | null {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  return (node as Element & { __key?: string }).__key ?? null;
}

function syncElementProperties(targetEl: Element, sourceEl: Element): void {
  // Simplified wholesale attr/style sync (no namespace diffing; small & fast)
  const keep = new Set<string>();
  for (let i = 0; i < sourceEl.attributes.length; i++) {
    const a = sourceEl.attributes[i];
    targetEl.setAttribute(a.name, a.value);
    keep.add(a.name);
  }
  for (let i = targetEl.attributes.length - 1; i >= 0; i--) {
    const a = targetEl.attributes[i];
    if (!keep.has(a.name)) targetEl.removeAttribute(a.name);
  }
  const t = targetEl as HTMLElement;
  const s = sourceEl as HTMLElement;
  if (t.style.cssText !== s.style.cssText) t.style.cssText = s.style.cssText;
}

function patchElement(oldEl: Element, newEl: Element): boolean {
  if (oldEl.nodeName !== newEl.nodeName) return false;
  const prevHost = oldEl as ComponentElement;
  const nextHost = newEl as ComponentElement;
  if (prevHost.__key !== nextHost.__key) return false;

  const nextPending = nextHost.__componentPending;
  if (
    prevHost.__component &&
    nextPending &&
    prevHost.__component === nextPending.type
  ) {
    if (prevHost.__propsRef) {
      prevHost.__propsRef.current = nextPending.props;
      nextHost.__componentPending = undefined;
      prevHost.dispatchEvent(new Event("update"));
    }
    return true;
  }
  if (
    prevHost.__component &&
    nextPending &&
    prevHost.__component !== nextPending.type
  ) return false;
  if (
    prevHost.__component &&
    nextHost.__component &&
    prevHost.__component !== nextHost.__component
  ) return false;

  syncElementProperties(oldEl, newEl);
  reconcileElementChildren(oldEl, newEl);
  return true;
}

/* -------------------------------------------------------------------------- */
/* Reconciliation: Children (Non-Keyed / Keyed)                               */
/* -------------------------------------------------------------------------- */

function detectChildKeys(oldEl: Element, newEl: Element): boolean {
  for (let c = newEl.firstChild; c; c = c.nextSibling) {
    if (getNodeKey(c)) return true;
  }
  for (let c = oldEl.firstChild; c; c = c.nextSibling) {
    if (getNodeKey(c)) return true;
  }
  return false;
}

function reconcileNonKeyedChildren(
  oldEl: Element,
  newEl: Element,
): void {
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

function buildOldKeyMap(
  oldEl: Element,
  oldKeyMap: Map<string, Node>,
  unmatched: Node[],
): void {
  for (let c = oldEl.firstChild; c; c = c.nextSibling) {
    const k = getNodeKey(c);
    if (k) oldKeyMap.set(k, c);
    else unmatched.push(c);
  }
}

function advancePastKeyed(pointer: Node | null): Node | null {
  while (pointer && getNodeKey(pointer)) pointer = pointer.nextSibling;
  return pointer;
}

function reconcileMatchedNode(match: Node, newPointer: Node): void {
  if (
    match.nodeType === Node.ELEMENT_NODE &&
    newPointer.nodeType === Node.ELEMENT_NODE
  ) {
    if (match !== newPointer) {
      patchElement(match as Element, newPointer as Element);
    }
  } else if (!patchText(match, newPointer) && match !== newPointer) {
    safeReplace(match.parentNode as ParentNode & Node, newPointer, match);
  }
}

function removeRemainingUnprocessed(
  oldEl: Element,
  processed: Set<Node>,
): void {
  for (let c = oldEl.firstChild; c;) {
    const next = c.nextSibling;
    if (!processed.has(c) && !getNodeKey(c)) safeRemove(oldEl, c);
    c = next;
  }
}

function finalizeKeyed(
  oldEl: Element,
  oldKeyMap: Map<string, Node>,
  processed: Set<Node>,
): void {
  for (const [, node] of oldKeyMap) {
    if (!processed.has(node)) safeRemove(oldEl, node);
  }
  removeRemainingUnprocessed(oldEl, processed);
}

function reconcileKeyedChildren(oldEl: Element, newEl: Element): void {
  const oldKeyMap = new Map<string, Node>();
  const unmatchedOld: Node[] = [];
  buildOldKeyMap(oldEl, oldKeyMap, unmatchedOld);

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

  finalizeKeyed(oldEl, oldKeyMap, processed);
}

function reconcileElementChildren(oldEl: Element, newEl: Element): void {
  if (!detectChildKeys(oldEl, newEl)) reconcileNonKeyedChildren(oldEl, newEl);
  else reconcileKeyedChildren(oldEl, newEl);
}

/* -------------------------------------------------------------------------- */
/* Range Reconciliation                                                       */
/* -------------------------------------------------------------------------- */

function reconcileRange(
  start: Comment,
  end: Comment,
  newNodes: Node[],
): void {
  const parent = start.parentNode;
  if (!parent || end.parentNode !== parent) return;

  let oldCur: Node | null = start.nextSibling;
  let idx = 0;

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
        for (const n of inserted) {
          if (n.isConnected) dispatchConnectIfElement(n);
        }
      }
      break;
    }
    const newNode = newNodes[idx];
    if (!oldCur) {
      safeInsertBefore(parent as ParentNode & Node, newNode, end);
      idx++;
      continue;
    }
    if (!newNode) {
      while (oldCur && oldCur !== end) {
        const next: Node | null = oldCur.nextSibling;
        safeRemove(parent as ParentNode & Node, oldCur);
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
      const oldEl = oldCur as ComponentElement;
      const newEl = newNode as ComponentElement;
      if (patchElement(oldEl, newEl)) {
        oldCur = oldCur.nextSibling;
        idx++;
        continue;
      }
    }
    safeInsertBefore(parent as ParentNode & Node, newNode, oldCur);
    safeRemove(parent as ParentNode & Node, oldCur);
    oldCur = newNode.nextSibling;
    idx++;
  }
}

/* (produceExpandedNodes removed – unified by expandToNodes) */

/* -------------------------------------------------------------------------- */
/* Root Helpers                                                               */
/* -------------------------------------------------------------------------- */

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
/* Custom Element Registration                                                */
/* -------------------------------------------------------------------------- */

class RadiHostElement extends HTMLElement {
  connectedCallback() {
    connect(this);
  }
  disconnectedCallback() {
    disconnect(this);
  }
}
if (!customElements.get(RADI_HOST_TAG)) {
  customElements.define(RADI_HOST_TAG, RadiHostElement);
}

/* -------------------------------------------------------------------------- */
/* Public Element Creation API                                                */
/* -------------------------------------------------------------------------- */

const Fragment = "fragment";

function createElement(
  type: string | ComponentFn,
  props: Record<string, unknown> | null,
  ...childrenRaw: Child[]
): Child {
  const buildNormalized = () => {
    const out: (Node | ReactiveGenerator)[] = [];
    for (const raw of childrenRaw) {
      if (typeof raw === "function") {
        out.push(raw as ReactiveGenerator);
      } else if (Array.isArray(raw)) {
        for (const sub of raw) {
          if (typeof sub === "function") out.push(sub as ReactiveGenerator);
          else out.push(...realize(document.body, sub));
        }
      } else {
        out.push(...realize(document.body, raw));
      }
    }
    return out;
  };

  if (type === Fragment) {
    const { start, end } = createFragmentBoundary();
    const realized = childrenRaw.flatMap((c) => realize(document.body, c));
    return [start, ...realized, end];
  }
  if (typeof type === "function") {
    return createComponentPlaceholder(type as ComponentFn, props, childrenRaw);
  }
  return createPlainElement(type as string, props, buildNormalized());
}

/* -------------------------------------------------------------------------- */
/* Root Management                                                            */
/* -------------------------------------------------------------------------- */

function createRoot(container: HTMLElement): {
  root: HTMLElement;
  render: (node: JSX.Element) => HTMLElement;
  unmount: () => void;
} {
  clearContainerInitialChildren(container);

  const { start, end } = createFragmentBoundary();
  container.append(start, end);

  function render(node: JSX.Element): HTMLElement {
    const realized = realize(container, node as Child);
    reconcileRange(start, end, realized);
    // Return first element node if single root element
    const single = realized.length === 1 ? realized[0] : null;
    if (single instanceof HTMLElement && !isComponentHost(single)) {
      connect(single);
    }
    return single instanceof HTMLElement ? single : container;
  }

  function unmount(): void {
    let cur: Node | null = start.nextSibling;
    while (cur && cur !== end) {
      const next = cur.nextSibling;
      safeRemove(container, cur);
      cur = next;
    }
  }

  return { root: container, render, unmount };
}

/* -------------------------------------------------------------------------- */
/* Universal Renderer Aliases                                                 */
/* -------------------------------------------------------------------------- */

const {
  render: domRender,
  createElement: domCreateElement,
  createTextNode: domCreateTextNode,
  createComment: domCreateComment,
  fragment: domFragment,
  renderToString: _unusedDomRenderToString,
} = DOM_RENDERER;

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export {
  // Lifecycle + control
  connect,
  createAbortSignal,
  createAbortSignalOnUpdate,
  createDomAdapter,
  // Core element APIs
  createElement,
  // Universal renderer constructors
  createRenderer,
  createRoot,
  createServerStringAdapter,
  disconnect,
  dispatchConnect,
  dispatchDisconnect,
  DOM_RENDERER,
  domCreateComment,
  domCreateElement,
  domCreateTextNode,
  domFragment,
  // Low-level renderer facades
  domRender,
  Fragment,
  // Internal types
  RadiHostElement,
  update,
};
