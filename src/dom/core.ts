/**
 * Internal DOM/core utilities extracted from main.ts.
 * Non-public implementation details kept here to keep the public API surface small.
 *
 * Responsibilities:
 * - Component host placeholder creation and initial build queue
 * - Root/container cleanup helpers
 * - Component lifecycle build + mounting
 *
 * Public API (main.ts) should import only what it needs from this module.
 */

import { markComponentHost } from "../lifecycle.ts";
import { dispatchRenderError } from "../error.ts";
import type { Child, ReactiveGenerator } from "../types.ts";
import { safeAppend } from "./reconciler.ts";
import type { ComponentHost } from "./reconciler.ts";

import { normalizeToNodes } from "./normalize.ts";
import { buildElement } from "./build.ts";
import { mountChild, setupReactiveRender } from "./reactive.ts";

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

export const RADI_HOST_TAG = "radi-host";

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
  } else if (typeof output === "function") {
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

// key assignment logic in core.ts removed; component placeholder assigns key inline

/** Create a component placeholder host element for deferred initial build. */
export function createComponentPlaceholder(
  type: ComponentFn,
  props: Record<string, unknown> | null,
  childrenRaw: Child[],
): ComponentElement {
  const placeholder = document.createElement(RADI_HOST_TAG) as ComponentElement;
  markComponentHost(placeholder);

  // Inline key assignment (assignKeyIfPresent removed)
  if (props) {
    const pAny = props as Record<string, unknown>;
    if (pAny.key != null) {
      placeholder.__key = String(pAny.key);
      delete pAny.key;
    }
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
      queueComponentForBuild(placeholder as ComponentHost);
      flushComponentBuildQueue();
    },
    { passive: true, capture: true, once: true },
  );

  return placeholder;
}

/* Plain element creation moved to build.ts */

/* -------------------------------------------------------------------------- */
/* Root Helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Dispatch disconnect lifecycle if node is an element (used for root cleanup). */
export function dispatchDisconnectIfElement(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    // dispatchDisconnect imported indirectly via lifecycle in main; avoid circular import
    // main.ts should wrap this with its own public unmount logic.
    (node as Element).dispatchEvent(
      new CustomEvent("disconnect", { bubbles: true }),
    );
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

export const FragmentSymbol = "fragment"; // internal marker (main can re-export as Fragment)
