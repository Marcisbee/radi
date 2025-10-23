import {
  connect,
  createAbortSignal,
  createAbortSignalOnUpdate,
  disconnect,
  dispatchConnect,
  dispatchDisconnect,
  isComponentHost,
  update,
} from './lifecycle.ts';
import type { Child } from './types.ts';
import {
  createFragmentBoundary,
  reconcileRange,
  safeRemove,
} from './dom/reconciler.ts';
import { normalizeToNodes } from './dom/normalize.ts';
import { buildElement, buildArrayChild } from './dom/build.ts';
import {
  createComponentPlaceholder,
  createPlainElement,
  currentBuildingComponent,
  clearContainerInitialChildren,
  FragmentSymbol as Fragment,
  RADI_HOST_TAG,
} from './dom/core.ts';
import type {
  dispatchDisconnectIfElement as _dispatchDisconnectIfElement,
  ComponentElement as _ComponentElement,
  ComponentFn,
} from './dom/core.ts';

export {
  connect,
  createAbortSignal,
  createAbortSignalOnUpdate,
  disconnect,
  dispatchConnect,
  dispatchDisconnect,
  update,
  currentBuildingComponent,
  Fragment,
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
if (!customElements.get(RADI_HOST_TAG)) {
  customElements.define(RADI_HOST_TAG, RadiHostElement);
}

/* -------------------------------------------------------------------------- */
/* Core Public API                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Create a Radi element (plain element, fragment, or component placeholder).
 * Function components mount lazily after "connect" to allow error boundary setup.
 */
export function createElement(
  type: string | ComponentFn,
  props: Record<string, unknown> | null,
  ...childrenRaw: Child[]
): Child {
  const buildChildrenArray = () =>
    childrenRaw.map((c: Child) => buildElement(c) as Child);
  const buildNormalized = () => normalizeToNodes(buildChildrenArray());

  if (type === 'fragment') {
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
