/**
 * Reconciliation utilities extracted from main.ts.
 * Handles DOM patching for elements, keyed/non-keyed child reconciliation,
 * fragment (comment range) reconciliation, and component host reuse.
 */

import {
  dispatchConnect,
  dispatchDisconnect,
} from "../lifecycle.ts";
import { dispatchRenderError } from "../error.ts";
import { maybeBuildSubscribableChild } from "./subscribeable.ts";
import type { Child, ReactiveGenerator } from "../types.ts";
import { normalizeToNodes } from "./normalize.ts";

/* -------------------------------------------------------------------------- */
/* Component Host Types                                                       */
/* -------------------------------------------------------------------------- */

export type ComponentRenderFn = (
  this: HTMLElement,
  props: () => unknown,
) => unknown;

export interface ComponentPending {
  type: ComponentRenderFn;
  props: Record<string, unknown>;
}

export interface ComponentHost extends HTMLElement {
  __component?: ComponentRenderFn;
  __componentPending?: ComponentPending;
  __propsRef?: { current: Record<string, unknown> };
  __mounted?: boolean;
  __key?: string;
}

/* -------------------------------------------------------------------------- */
/* Lifecycle-safe Node Operations                                             */
/* -------------------------------------------------------------------------- */

function dispatchConnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    dispatchConnect(node);
  }
}

function dispatchDisconnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    dispatchDisconnect(node);
  }
}

function detachIfMoving(node: Node): void {
  const parent = node.parentNode;
  if (parent) {
    dispatchDisconnectIfElement(node);
    parent.removeChild(node);
  }
}

export function safeAppend(parent: ParentNode & Node, child: Node): void {
  detachIfMoving(child);
  parent.appendChild(child);
  if (child.isConnected) {
    dispatchConnectIfElement(child);
  }
}

export function safeInsertBefore(
  parent: ParentNode & Node,
  child: Node,
  before: Node | null,
): void {
  detachIfMoving(child);
  parent.insertBefore(child, before);
  if (child.isConnected) {
    dispatchConnectIfElement(child);
  }
}

export function safeRemove(parent: ParentNode & Node, child: Node): void {
  if (child.parentNode === parent) {
    dispatchDisconnectIfElement(child);
    parent.removeChild(child);
  }
}

export function safeReplace(
  parent: ParentNode & Node,
  next: Node,
  prev: Node,
): void {
  detachIfMoving(next);
  dispatchDisconnectIfElement(prev);
  parent.replaceChild(next, prev);
  if (next.isConnected) {
    dispatchConnectIfElement(next);
  }
}

/* -------------------------------------------------------------------------- */
/* Element Patching                                                           */
/* -------------------------------------------------------------------------- */

export function patchText(a: Node, b: Node): boolean {
  if (a.nodeType === Node.TEXT_NODE && b.nodeType === Node.TEXT_NODE) {
    const ta = a as Text;
    const tb = b as Text;
    if (ta.nodeValue !== tb.nodeValue) {
      ta.nodeValue = tb.nodeValue;
    }
    return true;
  }
  return false;
}

export function getNodeKey(node: Node): string | null {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element & { __key?: string };
  return el.__key ?? el.getAttribute("data-key");
}

export function syncElementProperties(fromEl: Element, toEl: Element): void {
  // Add/update attributes
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
        if (attr.prefix === "xmlns") {
          name = attr.name;
        }
        fromEl.setAttributeNS(ns, name, value);
      }
    } else if (fromEl.getAttribute(name) !== value) {
      fromEl.setAttribute(name, value);
    }
  }
  // Remove stale attributes
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
    } else if (!toEl.hasAttribute(name)) {
      fromEl.removeAttribute(name);
    }
  }
  // Style sync
  const fromStyle = (fromEl as HTMLElement).style.cssText;
  const toStyle = (toEl as HTMLElement).style.cssText;
  if (fromStyle !== toStyle) {
    (fromEl as HTMLElement).style.cssText = toStyle;
  }
}

export function patchElement(oldEl: Element, newEl: Element): boolean {
  if (oldEl.nodeName !== newEl.nodeName) return false;

  const prevHost = oldEl as ComponentHost;
  const nextHost = newEl as ComponentHost;

  const oldKey = prevHost.__key ?? oldEl.getAttribute("data-key");
  const newKey = nextHost.__key ?? newEl.getAttribute("data-key");

  if (oldKey !== newKey && (oldKey != null || newKey != null)) {
    return false;
  }

  const nextPending = nextHost.__componentPending;

  // Component host reuse path
  if (
    prevHost.__component &&
    nextPending &&
    prevHost.__component === nextPending.type &&
    oldKey === newKey
  ) {
    if (prevHost.__propsRef) {
      prevHost.__propsRef.current = nextPending.props;
      nextHost.__componentPending = undefined;
      prevHost.dispatchEvent(new Event("update"));
    }
    return true;
  }

  // Different component types cannot patch
  if (
    prevHost.__component &&
    nextPending &&
    prevHost.__component !== nextPending.type
  ) {
    return false;
  }

  if (
    prevHost.__component &&
    nextHost.__component &&
    prevHost.__component !== nextHost.__component
  ) {
    return false;
  }

  syncElementProperties(oldEl, newEl);
  reconcileElementChildren(oldEl, newEl);
  return true;
}

/* -------------------------------------------------------------------------- */
/* Child Reconciliation                                                       */
/* -------------------------------------------------------------------------- */

export function reconcileElementChildren(oldEl: Element, newEl: Element): void {
  if (!detectChildKeys(oldEl, newEl)) {
    reconcileNonKeyedChildren(oldEl, newEl);
  } else {
    reconcileKeyedChildren(oldEl, newEl);
  }
}

export function detectChildKeys(oldEl: Element, newEl: Element): boolean {
  for (let c = newEl.firstChild; c; c = c.nextSibling) {
    if (getNodeKey(c)) return true;
  }
  for (let c = oldEl.firstChild; c; c = c.nextSibling) {
    if (getNodeKey(c)) return true;
  }
  return false;
}

export function reconcileNonKeyedChildren(
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

/* -------------------------------------------------------------------------- */
/* Keyed Reconciliation                                                       */
/* -------------------------------------------------------------------------- */

const KEY_NODE_MAP_POOL: Map<string, Node>[] = [];
const MAX_KEY_NODE_MAP_POOL = 32;

function acquireKeyMap(): Map<string, Node> {
  return KEY_NODE_MAP_POOL.pop() ?? new Map();
}

function releaseKeyMap(m: Map<string, Node>): void {
  m.clear();
  if (KEY_NODE_MAP_POOL.length < MAX_KEY_NODE_MAP_POOL) {
    KEY_NODE_MAP_POOL.push(m);
  }
}

export function reconcileKeyedChildren(oldEl: Element, newEl: Element): void {
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
        if (oldPointer) {
          safeInsertBefore(oldEl, match, oldPointer);
        } else {
          safeAppend(oldEl, match);
        }
      }
      reconcileMatchedNode(match, newPointer);
    } else {
      if (oldPointer) {
        safeInsertBefore(oldEl, newPointer, oldPointer);
      } else {
        safeAppend(oldEl, newPointer);
      }
    }
    newPointer = next;
  }

  for (const [, node] of oldKeyMap) {
    if (!processed.has(node)) {
      safeRemove(oldEl, node);
    }
  }

  removeRemainingUnprocessed(oldEl, processed);
  releaseKeyMap(oldKeyMap);
}

function advancePastKeyed(pointer: Node | null): Node | null {
  while (pointer && getNodeKey(pointer)) {
    pointer = pointer.nextSibling;
  }
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
    if (!processed.has(c) && !getNodeKey(c)) {
      safeRemove(oldEl, c);
    }
    c = next;
  }
}

/* -------------------------------------------------------------------------- */
/* Range Reconciliation                                                       */
/* -------------------------------------------------------------------------- */

export function reconcileRange(
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
          if (n.isConnected) {
            dispatchConnectIfElement(n);
          }
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
      const oldEl = oldCur as ComponentHost;
      const newEl = newNode as ComponentHost;
      if (canReuseComponentHost(oldEl, newEl)) {
        if (oldEl.__propsRef && newEl.__componentPending) {
          oldEl.__propsRef.current = newEl.__componentPending.props;
          newEl.__componentPending = undefined;
          oldEl.dispatchEvent(new Event("update"));
        }
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
    safeInsertBefore(parent as ParentNode & Node, newNode, oldCur);
    safeRemove(parent as ParentNode & Node, oldCur);
    oldCur = newNode.nextSibling;
    idx++;
  }
}

/* -------------------------------------------------------------------------- */
/* Component Host Reuse Check                                                 */
/* -------------------------------------------------------------------------- */

export function canReuseComponentHost(
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
  const oldKey = oldEl.__key ?? null;
  const newKey = newEl.__key ?? newEl.getAttribute?.("data-key") ?? null;
  return oldKey === newKey;
}

/* -------------------------------------------------------------------------- */
/* Fragment Helpers                                                           */
/* -------------------------------------------------------------------------- */

export const FRAGMENT_START_TEMPLATE = document.createComment("(");
export const FRAGMENT_END_TEMPLATE = document.createComment(")");

export function createFragmentBoundary(): { start: Comment; end: Comment } {
  return {
    start: FRAGMENT_START_TEMPLATE.cloneNode() as Comment,
    end: FRAGMENT_END_TEMPLATE.cloneNode() as Comment,
  };
}

/* -------------------------------------------------------------------------- */
/* Normalization (shared import)                                              */
/* -------------------------------------------------------------------------- */
// normalizeToNodes implementation moved to ./normalize.ts and imported above.

/* -------------------------------------------------------------------------- */
/* Element Building (minimal duplicate)                                       */
/* -------------------------------------------------------------------------- */

/* Subscription helpers for subscribable children */
/* Subscribable handling moved to subscribeable.ts (safelyRunUnsubscribe, subscribeAndReconcileRange, buildSubscribableChild).
   buildElement here retains only primitive / function / array normalization to support produceExpandedNodes. */
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
        ([] as Child[]).concat(produced as Child).map(buildElement) as Child[],
      );
    };
  }
  // subscribable handling delegated to maybeBuildSubscribableChild in produceExpandedNodes
  if (Array.isArray(child)) {
    const { start, end } = createFragmentBoundary();
    const built = child
      .map(buildElement)
      .flat(1)
      .filter(Boolean) as Child[];
    const normalized = normalizeToNodes(built).filter(Boolean) as (
      | Node
      | ReactiveGenerator
    )[];
    return [start, ...normalized, end];
  }
  if (child == null) {
    return document.createComment("null");
  }
  return child;
}

/* -------------------------------------------------------------------------- */
/* Produce Expanded Nodes                                                     */
/* -------------------------------------------------------------------------- */

export function produceExpandedNodes(
  parent: Element,
  output: unknown,
  alreadyBuilt: boolean,
): Node[] {
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
/* Reactive Rendering + Mounting                                              */
/* -------------------------------------------------------------------------- */

/* Reactive rendering (setupReactiveRender, mountChild) moved to reactive.ts */
