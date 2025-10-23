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
  update,
} from "./lifecycle.ts";
import { dispatchRenderError } from "./error.ts";
import type { Child, ReactiveGenerator, Subscribable } from "./types.ts";
import { applyPropsToPlainElement } from "./dom/props.ts";
import {
  createFragmentBoundary,
  mountChild,
  produceExpandedNodes,
  reconcileRange,
  safeAppend,
  safeRemove,
  setupReactiveRender,
} from "./dom/reconciler.ts";
import type { ComponentHost } from "./dom/reconciler.ts";
import { normalizeToNodes } from "./dom/normalize.ts";

export {
  connect,
  createAbortSignal,
  createAbortSignalOnUpdate,
  disconnect,
  dispatchConnect,
  dispatchDisconnect,
  update,
};

/** Internal component element extension retained locally (host types centralized). */
type ComponentElement = HTMLElement & {
  __component?: (this: HTMLElement, props: () => unknown) => Child;
  [key: string]: unknown;
};

/** Custom Radi component host element with built-in connect/disconnect lifecycle. */
export class RadiHostElement extends HTMLElement {
  connectedCallback() {
    connect(this);
  }
  disconnectedCallback() {
    disconnect(this);
  }
}

// Register the custom element if not already defined
const RADI_HOST_TAG = "radi-host";
if (!customElements.get(RADI_HOST_TAG)) {
  customElements.define(RADI_HOST_TAG, RadiHostElement);
}

/* -------------------------------------------------------------------------- */
/* Subscribable Detection + Handling                                          */
/* -------------------------------------------------------------------------- */

/** Determine if value conforms to a simple Subscribable interface. */
import { isSubscribable } from "./dom/is-subscribable.ts"; // centralized

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
    if (disconnectTarget) {
      markEventable(disconnectTarget);
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
    markEventable(parentEl);
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
/* Component Build Queue                                                      */
/* -------------------------------------------------------------------------- */

const pendingComponentBuildQueue: ComponentHost[] = [];
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

/** Mount output of a component build (Node | function | array). */
function mountBuiltOutput(host: Element, output: Child): void {
  if (Array.isArray(output)) {
    const nodes = normalizeToNodes(output as Child[]);
    for (const n of nodes) mountChild(host, n);
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
      const host = pendingComponentBuildQueue.shift();
      if (!host) break;
      buildComponentHost(host);
    }
  } finally {
    isFlushingComponentBuilds = false;
  }
}

/* -------------------------------------------------------------------------- */
/* Error Dispatch                                                             */
/* -------------------------------------------------------------------------- */

export let currentBuildingComponent: Element | null = null;
/* -------------------------------------------------------------------------- */
/* DOM Operation Helpers                                                      */
/* -------------------------------------------------------------------------- */

/** Dispatch disconnect lifecycle if node is an element (restored for root cleanup). */
function dispatchDisconnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    dispatchDisconnect(node);
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
  // Explicit return and intermediate types to avoid unknown casts.
  const buildChildrenArray: () => Child[] = () =>
    childrenRaw.map((c: Child) => buildElement(c) as Child);
  const buildNormalized: () => (Node | ReactiveGenerator)[] = () =>
    normalizeToNodes(buildChildrenArray());

  if (type === "fragment") {
    return buildArrayChild(childrenRaw, true);
  }

  if (typeof type === "function") {
    return createComponentPlaceholder(type, props, childrenRaw);
  }

  return createPlainElement(type as string, props, buildNormalized());
}

/** Create a component placeholder host element for lazy initial build. */
function createComponentPlaceholder(
  type: Function,
  props: Record<string, unknown> | null,
  childrenRaw: Child[],
): ComponentElement {
  const placeholder = document.createElement(RADI_HOST_TAG) as
    & ComponentElement
    & {
      __componentPending?: { type: Function; props: any };
      __deferConnect?: boolean;
    };
  markComponentHost(placeholder);

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
    flushComponentBuildQueue();
  }, { passive: true, capture: true, once: true });

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
    mountChild(element, c);
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
    // Build and normalize once
    const built = buildElement(node as Child);
    const normalized = normalizeToNodes(Array.isArray(built) ? built : [built]);
    // Reconcile only concrete Nodes
    const concreteNodes = normalized.filter((n): n is Node =>
      n instanceof Node
    );
    reconcileRange(start, end, concreteNodes);
    // Connect plain element root if it is not a component host
    if (built instanceof HTMLElement && !isComponentHost(built)) {
      connect(built);
    }
    // Return the built HTMLElement if available, otherwise the container root
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
