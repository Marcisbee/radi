/**
 * Consolidated Radi client + DOM implementation in a single file.
 *
 * This merges what previously lived across:
 *  - main.ts (public DOM framework API)
 *  - dom/* (build, normalize, reconciliation, reactive, subscribables, props, core)
 *  - client.ts (entrypoint / universal renderer bridge)
 *
 * Public exports:
 *  - createElement / Fragment / createRoot
 *  - connect / disconnect / dispatchConnect / dispatchDisconnect / update
 *  - createAbortSignal / createAbortSignalOnUpdate
 *  - DOM universal renderer helpers (createRenderer/createDomAdapter/createServerStringAdapter/DOM_RENDERER)
 *  - Lower-level universal renderer aliases: domRender, domCreateElement, domCreateTextNode, domCreateComment, domFragment
 *
 * Internal implementation aims to stay small & focused (see AGENTS.md).
 */

import {
  connect,
  disconnect,
  dispatchConnect,
  dispatchDisconnect,
  update,
  createAbortSignal,
  createAbortSignalOnUpdate,
  markComponentHost,
  markReactiveRoot,
  markEventable,
  isComponentHost,
} from './lifecycle.ts';
import type { Child, ReactiveGenerator, Subscribable } from './types.ts';
import { dispatchRenderError } from './error.ts';
import {
  createRenderer,
  createDomAdapter,
  createServerStringAdapter,
  DOM_RENDERER,
} from './renderer.ts';

/* -------------------------------------------------------------------------- */
/* Fragment Boundary                                                          */
/* -------------------------------------------------------------------------- */

const FRAGMENT_START_TEMPLATE: Comment = document.createComment('(');
const FRAGMENT_END_TEMPLATE: Comment = document.createComment(')');

function createFragmentBoundary(): { start: Comment; end: Comment } {
  return {
    start: FRAGMENT_START_TEMPLATE.cloneNode() as Comment,
    end: FRAGMENT_END_TEMPLATE.cloneNode() as Comment,
  };
}

/* -------------------------------------------------------------------------- */
/* Normalization                                                              */
/* -------------------------------------------------------------------------- */

function normalizeToNodes(raw: Child | Child[]): (Node | ReactiveGenerator)[] {
  const out: (Node | ReactiveGenerator)[] = [];
  const queue: (Child | Child[])[] = Array.isArray(raw) ? [...raw] : [raw];
  while (queue.length) {
    const item = queue.shift()!;
    if (item == null) {
      out.push(document.createComment('null'));
      continue;
    }
    if (Array.isArray(item)) {
      queue.unshift(...item);
      continue;
    }
    switch (typeof item) {
      case 'string':
      case 'number':
        out.push(document.createTextNode(String(item)));
        continue;
      case 'boolean':
        out.push(document.createComment(item ? 'true' : 'false'));
        continue;
      case 'function':
        out.push(item as ReactiveGenerator);
        continue;
    }
    if (item instanceof Node) out.push(item);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Subscribable Helpers                                                       */
/* -------------------------------------------------------------------------- */

function isSubscribableValue<T = unknown>(value: unknown): value is Subscribable<T> {
  return !!(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Node) &&
    typeof (value as { subscribe?: unknown }).subscribe === 'function'
  );
}

function safelyRunUnsubscribe(
  unsub: void | (() => void) | { unsubscribe(): void },
): void {
  try {
    if (typeof unsub === 'function') unsub();
    else if (typeof unsub === 'object' && unsub && typeof (unsub as { unsubscribe?: unknown }).unsubscribe === 'function') {
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
    let previous: unknown = Symbol('radi_initial_range');
    const unsub = store.subscribe((value: unknown) => {
      if (Object.is(value, previous)) return;
      previous = value;
      try {
        const expanded = produceExpandedNodes(parentEl, value, false);
        reconcileRange(start, end, expanded);
      } catch (err) {
        dispatchRenderError(parentEl, err);
      }
    });
    markEventable(parentEl);
    parentEl.addEventListener('disconnect', () => {
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

function maybeBuildSubscribableChild(value: unknown): Child {
  if (isSubscribableValue(value)) {
    return buildSubscribableChild(value as Subscribable<unknown>);
  }
  return value as Child;
}

function bindSubscribableProp(
  element: HTMLElement,
  key: string,
  subscribable: Subscribable<unknown>,
): void {
  let previous: unknown = Symbol('radi_initial_prop');
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
  element.addEventListener('disconnect', () => {
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
  if (key === 'style' && value && typeof value === 'object') {
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
  element.addEventListener('update', evaluate);
  evaluate();
}

function applyPropsToPlainElement(
  element: HTMLElement,
  props: Record<string, unknown>,
): void {
  for (const key in props) {
    const value = props[key];
    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(
        key.slice(2).toLowerCase(),
        value as EventListener,
      );
      continue;
    }
    if (typeof value === 'function') {
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
      const expanded = produceExpandedNodes(container, produced, true);
      reconcileRange(start, end, expanded);
    } catch (err) {
      dispatchRenderError(container, err);
    }
  };

  markReactiveRoot(container);
  container.addEventListener('update', renderFn);
  renderFn();
}

function mountChild(
  parent: Element,
  nodeOrFn: Node | ReactiveGenerator,
): void {
  if (typeof nodeOrFn === 'function') {
    setupReactiveRender(parent, nodeOrFn as ReactiveGenerator);
  } else {
    safeAppend(parent, nodeOrFn);
  }
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

const RADI_HOST_TAG = 'radi-host';

const pendingComponentBuildQueue: ComponentElement[] = [];
let isFlushingComponentBuilds = false;
export let currentBuildingComponent: Element | null = null;

function queueComponentForBuild(host: ComponentElement): void {
  if (host.__mounted) return;
  pendingComponentBuildQueue.push(host);
}

function buildComponentHost(host: ComponentElement): void {
  const pending = host.__componentPending;
  if (!pending || host.__mounted) return;

  const propsRef: { current: Record<string, unknown> } = {
    current: pending.props,
  };
  const propsGetter = (): Record<string, unknown> => propsRef.current;

  host.__component = pending.type;
  host.__propsRef = propsRef;
  host.__mounted = true;
  delete host.__componentPending;

  const prev = currentBuildingComponent;
  currentBuildingComponent = host;
  try {
    const output = buildElement(pending.type.call(host, propsGetter) as Child);
    mountBuiltOutput(host, output);
  } catch (err) {
    dispatchRenderError(host, err);
  } finally {
    currentBuildingComponent = prev;
  }
}

function mountBuiltOutput(host: Element, output: Child): void {
  if (Array.isArray(output)) {
    const nodes = normalizeToNodes(output);
    for (const n of nodes) mountChild(host, n);
  } else if (typeof output === 'function') {
    setupReactiveRender(host, output as ReactiveGenerator);
  } else if (output instanceof Node) {
    safeAppend(host, output);
  } else if (output != null) {
    safeAppend(host, document.createTextNode(String(output)));
  }
}

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

  if (props) {
    const pAny = props as Record<string, unknown>;
    if (pAny.key != null) {
      placeholder.__key = String(pAny.key);
      delete pAny.key;
    }
  }

  placeholder.style.display = 'contents';

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
    'connect',
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
    if (typeof c === 'function') {
      setupReactiveRender(element, c as ReactiveGenerator);
    } else {
      element.append(c);
    }
  }
  return element;
}

/* -------------------------------------------------------------------------- */
/* Element Building                                                           */
/* -------------------------------------------------------------------------- */

function buildElement(child: Child): Child {
  if (typeof child === 'string' || typeof child === 'number') {
    return document.createTextNode(String(child));
  }
  if (typeof child === 'boolean') {
    return document.createComment(child ? 'true' : 'false');
  }
  if (typeof child === 'function') {
    return (parent: Element) => {
      const produced = (child as ReactiveGenerator)(parent);
      const arr = ([] as Child[]).concat(produced as Child);
      return normalizeToNodes(arr.map(buildElement) as Child[]);
    };
  }
  {
    const maybe = maybeBuildSubscribableChild(child);
    if (maybe !== child) return maybe;
  }
  if (Array.isArray(child)) {
    return buildArrayChild(child);
  }
  if (child == null) {
    return document.createComment('null');
  }
  return child;
}

function buildArrayChild(
  childArray: Child[],
  reactivePlaceholder = false,
): Child {
  const { start, end } = createFragmentBoundary();
  const built: Child[] = [];
  for (const ch of childArray) {
    const res = buildElement(ch);
    if (Array.isArray(res)) {
      for (const item of res) if (item != null) built.push(item as Child);
    } else if (res != null) built.push(res);
  }
  const normalized = normalizeToNodes(built).filter(
    (n): n is Node | ReactiveGenerator => !!n,
  );
  if (!reactivePlaceholder) return [start, ...normalized, end];
  const out: Node[] = [];
  for (const n of normalized) {
    if (typeof n === 'function') {
      const placeholder = document.createComment('deferred-reactive');
      out.push(placeholder);
      queueMicrotask(() => {
        const parent = placeholder.parentNode as Element | null;
        if (parent) {
          setupReactiveRender(parent, n as ReactiveGenerator);
          parent.removeChild(placeholder);
        }
      });
    } else out.push(n);
  }
  return [start, ...out, end];
}

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

function syncElementProperties(fromEl: Element, toEl: Element): void {
  const toAttrs = toEl.attributes;
  for (let i = toAttrs.length - 1; i >= 0; i--) {
    const attr = toAttrs[i];
    const ns = attr.namespaceURI;
    let name = attr.name;
    const value = attr.value;
    if (ns) {
      name = attr.localName || name;
      const existing = fromEl.getAttributeNS(ns, name);
      if (existing !== value) {
        if (attr.prefix === 'xmlns') name = attr.name;
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
  const fromStyle = (fromEl as HTMLElement).style.cssText;
  const toStyle = (toEl as HTMLElement).style.cssText;
  if (fromStyle !== toStyle) (fromEl as HTMLElement).style.cssText = toStyle;
}

interface ComponentHost extends HTMLElement {
  __component?: ComponentFn;
  __componentPending?: { type: ComponentFn; props: Record<string, unknown> };
  __propsRef?: { current: Record<string, unknown> };
  __mounted?: boolean;
  __key?: string;
}

function canReuseComponentHost(
  oldEl: ComponentHost,
  newEl: ComponentHost,
): boolean {
  if (
    !oldEl.__component ||
    !oldEl.__mounted ||
    !newEl.__componentPending ||
    oldEl.__component !== newEl.__componentPending.type
  ) {
    return false;
  }
  return oldEl.__key === newEl.__key;
}

function patchElement(oldEl: Element, newEl: Element): boolean {
  if (oldEl.nodeName !== newEl.nodeName) return false;
  const prevHost = oldEl as ComponentHost;
  const nextHost = newEl as ComponentHost;
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
      prevHost.dispatchEvent(new Event('update'));
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
  for (let c = newEl.firstChild; c; c = c.nextSibling) if (getNodeKey(c)) return true;
  for (let c = oldEl.firstChild; c; c = c.nextSibling) if (getNodeKey(c)) return true;
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

function buildOldKeyMap(oldEl: Element, oldKeyMap: Map<string, Node>, unmatched: Node[]): void {
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
    if (match !== newPointer) patchElement(match as Element, newPointer as Element);
  } else if (!patchText(match, newPointer) && match !== newPointer) {
    safeReplace(match.parentNode as ParentNode & Node, newPointer, match);
  }
}

function removeRemainingUnprocessed(oldEl: Element, processed: Set<Node>): void {
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
        for (const n of inserted) if (n.isConnected) dispatchConnectIfElement(n);
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
      const oldEl = oldCur as ComponentHost;
      const newEl = newNode as ComponentHost;
      if (canReuseComponentHost(oldEl, newEl)) {
        if (oldEl.__propsRef && newEl.__componentPending) {
          oldEl.__propsRef.current = newEl.__componentPending.props;
          newEl.__componentPending = undefined;
          oldEl.dispatchEvent(new Event('update'));
        }
        idx++;
        oldCur = oldCur.nextSibling;
        continue;
      }
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

/* -------------------------------------------------------------------------- */
/* Produce Expanded Nodes (reactive + subscribable expansion)                 */
/* -------------------------------------------------------------------------- */

function produceExpandedNodes(
  parent: Element,
  output: unknown,
  alreadyBuilt: boolean,
): Node[] {
  if (alreadyBuilt) {
    if (output instanceof Node) return [output];
    if (Array.isArray(output) && output.length === 1 && output[0] instanceof Node) {
      return [output[0]];
    }
  } else {
    if (output instanceof Node) return [output];
    const t = typeof output;
    if (t === 'string' || t === 'number') {
      return [document.createTextNode(String(output))];
    }
    if (output == null || t === 'boolean') {
      return [document.createComment(output ? 'true' : 'null')];
    }
  }
  const initial = alreadyBuilt ? output : maybeBuildSubscribableChild(output);
  const built = alreadyBuilt ? initial : buildElement(initial as Child);
  const arr = Array.isArray(built) ? built : [built];
  const normalized = normalizeToNodes(arr as Child[]);
  const expanded: Node[] = [];
  for (const item of normalized) {
    if (item instanceof Node) {
      expanded.push(item);
      continue;
    }
    if (typeof item === 'function') {
      try {
        const innerProduced = (item as ReactiveGenerator)(parent);
        const innerNorm = normalizeToNodes(innerProduced);
        for (const inner of innerNorm) if (inner instanceof Node) expanded.push(inner);
      } catch (err) {
        dispatchRenderError(parent, err);
      }
    }
  }
  return expanded;
}

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

const Fragment = 'fragment';

function createElement(
  type: string | ComponentFn,
  props: Record<string, unknown> | null,
  ...childrenRaw: Child[]
): Child {
  const buildChildrenArray = () =>
    childrenRaw.map((c: Child) => buildElement(c) as Child);
  const buildNormalized = () => normalizeToNodes(buildChildrenArray());

  if (type === Fragment) {
    return buildArrayChild(childrenRaw, true);
  }
  if (typeof type === 'function') {
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
    const built = buildElement(node as Child);
    const normalized = normalizeToNodes(Array.isArray(built) ? built : [built]);
    const concreteNodes = normalized.filter(
      (n): n is Node => n instanceof Node,
    );
    reconcileRange(start, end, concreteNodes);
    if (built instanceof HTMLElement && !isComponentHost(built)) {
      connect(built);
    }
    return built instanceof HTMLElement ? built : container;
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
  disconnect,
  dispatchConnect,
  dispatchDisconnect,
  update,
  createAbortSignal,
  createAbortSignalOnUpdate,
  // Core element APIs
  createElement,
  createRoot,
  Fragment,
  // Universal renderer constructors
  createRenderer,
  createDomAdapter,
  createServerStringAdapter,
  DOM_RENDERER,
  // Low-level renderer facades
  domRender,
  domCreateElement,
  domCreateTextNode,
  domCreateComment,
  domFragment,
  // Internal types
  RadiHostElement,
};