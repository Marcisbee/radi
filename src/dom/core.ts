/**
 * Internal DOM/core utilities extracted from main.ts.
 * Non-public implementation details kept here to keep the public API surface small.
 *
 * Responsibilities:
 * - Element building (primitive -> Node, arrays, reactive functions, subscribables)
 * - Component host placeholder creation and initial build queue
 * - Subscribable child handling (range reconciliation)
 * - Root/container cleanup helpers
 *
 * Public API (main.ts) should import only what it needs from this module.
 */

import { markComponentHost } from '../lifecycle.ts';
import { dispatchRenderError } from '../error.ts';
import type { Child, ReactiveGenerator } from '../types.ts';
import { createFragmentBoundary, safeAppend } from './reconciler.ts';
import { mountChild, setupReactiveRender } from './reactive.ts';
import type { ComponentHost } from './reconciler.ts';
import { normalizeToNodes } from './normalize.ts';
import { applyPropsToPlainElement } from './props.ts';
import { maybeBuildSubscribableChild } from './subscribeable.ts';

/* -------------------------------------------------------------------------- */
/* Types & Constants                                                          */
/* -------------------------------------------------------------------------- */

export type ComponentFn = (this: HTMLElement, props: () => unknown) => Child;

export type ComponentElement = HTMLElement & {
  __component?: ComponentFn;
  __componentPending?: { type: ComponentFn; props: Record<string, unknown> };
  __propsRef?: { current: Record<string, unknown> };
  __mounted?: boolean;
  __key?: string;
  [key: string]: unknown;
};

export const RADI_HOST_TAG = 'radi-host';

/* -------------------------------------------------------------------------- */
/* (Subscribable child logic moved to subscribeable.ts)                       */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Element Building                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Build a single child into one of:
 * - DOM Node
 * - Reactive function (wrapped)
 * - Fragment (array with boundary comments)
 * - Component host placeholder
 */
export function buildElement(child: Child): Child {
  if (typeof child === 'string' || typeof child === 'number') {
    return document.createTextNode(String(child));
  }
  if (typeof child === 'boolean') {
    return document.createComment(child ? 'true' : 'false');
  }
  if (typeof child === 'function') {
    return (parent: Element) => {
      const produced = (child as ReactiveGenerator)(parent);
      return normalizeToNodes(
        ([] as Child[]).concat(produced as Child).map(buildElement) as Child[],
      );
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

/** Build an array child into a fragment boundary wrapping normalized nodes (reactive functions deferred). */
export function buildArrayChild(
  childArray: Child[],
  reactivePlaceholder = false,
): Child {
  const { start, end } = createFragmentBoundary();
  const built = childArray.reduce<Child[]>((acc, ch) => {
    const res = buildElement(ch);
    if (Array.isArray(res)) {
      for (const item of res) {
        if (item) acc.push(item as Child);
      }
    } else if (res) {
      acc.push(res as Child);
    }
    return acc;
  }, []);
  const normalized = normalizeToNodes(built).filter(
    (n): n is Node | ReactiveGenerator => !!n,
  );
  if (!reactivePlaceholder) {
    return [start, ...normalized, end];
  }
  // reactivePlaceholder: convert reactive functions into deferred mount comments
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
    } else {
      out.push(n);
    }
  }
  return [start, ...out, end];
}

/* -------------------------------------------------------------------------- */
/* Component Build Queue                                                      */
/* -------------------------------------------------------------------------- */

const pendingComponentBuildQueue: ComponentHost[] = [];
let isFlushingComponentBuilds = false;

export let currentBuildingComponent: Element | null = null;

/** Queue a component host for initial build if not mounted. */
export function queueComponentForBuild(host: ComponentHost): void {
  if (host.__mounted) return;
  pendingComponentBuildQueue.push(host);
}

/** Perform initial component build (invokes component function and mounts output). */
function buildComponentHost(host: ComponentHost): void {
  const pending = host.__componentPending;
  if (!pending || host.__mounted) return;

  const propsRef: { current: Record<string, unknown> } = {
    current: pending.props as Record<string, unknown>,
  };
  const propsGetter = (): Record<string, unknown> => propsRef.current;

  host.__component = pending.type as (
    this: HTMLElement,
    props: () => unknown,
  ) => Child;
  host.__propsRef = propsRef;
  host.__mounted = true;
  delete host.__componentPending;

  const prevBuilding = currentBuildingComponent;
  currentBuildingComponent = host;
  try {
    const output = buildElement(pending.type.call(host, propsGetter) as Child);
    mountBuiltOutput(host, output);
  } catch (err) {
    dispatchRenderError(host, err);
  } finally {
    currentBuildingComponent = prevBuilding;
  }
}

/** Mount output of component build. */
function mountBuiltOutput(host: Element, output: Child): void {
  if (Array.isArray(output)) {
    const nodes = normalizeToNodes(output as Child[]);
    for (const n of nodes) mountChild(host, n);
  } else if (typeof output === 'function') {
    setupReactiveRender(host, output as ReactiveGenerator);
  } else if (output instanceof Node) {
    safeAppend(host, output);
  } else if (output != null) {
    safeAppend(host, document.createTextNode(String(output)));
  }
}

/** Flush queued component builds (breadth-first). */
export function flushComponentBuildQueue(): void {
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

/* -------------------------------------------------------------------------- */
/* Component Placeholder Creation                                             */
/* -------------------------------------------------------------------------- */

/** Assign a key from props to element if present (key or data-key). */
export function assignKeyIfPresent(
  el: ComponentElement,
  props: Record<string, unknown> | null,
): void {
  if (!props) return;
  const pAny = props as Record<string, unknown>;
  if (pAny.key != null) {
    el.__key = String(pAny.key);
    el.setAttribute('data-key', String(pAny.key));
    delete pAny.key;
  } else if (pAny['data-key'] != null) {
    el.__key = String(pAny['data-key']);
  }
}

/** Create a component placeholder host element for deferred initial build. */
export function createComponentPlaceholder(
  type: ComponentFn,
  props: Record<string, unknown> | null,
  childrenRaw: Child[],
): ComponentElement {
  const placeholder = document.createElement(RADI_HOST_TAG) as ComponentElement;
  markComponentHost(placeholder);

  assignKeyIfPresent(placeholder, props);
  placeholder.style.display = 'contents';

  const rawChildren = childrenRaw;
  let builtChildrenCache: Child[] | null = null;
  const ensureBuiltChildren = (): Child[] => {
    if (builtChildrenCache) return builtChildrenCache;
    builtChildrenCache = rawChildren.map(buildElement);
    return builtChildrenCache;
  };

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
      queueComponentForBuild(placeholder as ComponentHost);
      flushComponentBuildQueue();
    },
    { passive: true, capture: true, once: true },
  );

  return placeholder;
}

/* -------------------------------------------------------------------------- */
/* Plain Element Creation                                                     */
/* -------------------------------------------------------------------------- */

/** Create and populate a plain DOM element with props and children. */
export function createPlainElement(
  type: string,
  props: Record<string, unknown> | null,
  normalizedChildren: (Node | ReactiveGenerator)[],
): ComponentElement {
  const element = document.createElement(type) as ComponentElement;
  assignKeyIfPresent(element, props);
  if (props) applyPropsToPlainElement(element, props);
  for (const c of normalizedChildren) {
    mountChild(element, c);
  }
  return element;
}

/* -------------------------------------------------------------------------- */
/* Root Helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Dispatch disconnect lifecycle if node is an element (used for root cleanup). */
export function dispatchDisconnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    // dispatchDisconnect imported indirectly via lifecycle in main; avoid circular import
    // main.ts should wrap this with its own public unmount logic.
    (node as Element).dispatchEvent(new CustomEvent('disconnect', { bubbles: true }));
  }
}

/** Remove all existing child nodes from a container (with disconnect dispatch). */
export function clearContainerInitialChildren(container: HTMLElement): void {
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
/* Convenience Exports                                                       */
/* -------------------------------------------------------------------------- */

export const FragmentSymbol = 'fragment'; // internal marker (main can re-export as Fragment)