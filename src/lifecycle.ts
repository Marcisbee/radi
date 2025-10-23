/**
 * Lifecycle traversal & flag utilities for Radi.
 *
 * This module provides two specialized collectors:
 *  - collectUpdateTargets(root): manual update() dispatch set
 *  - collectLifecycleTargets(root): connect()/disconnect cascade set
 *
 * Elements are annotated with a compact bitmask stored in `__radiFlags`:
 *   COMPONENT      (1 << 0)
 *   REACTIVE_ROOT  (1 << 1)
 *   EVENTABLE      (1 << 2)
 *
 * The previous backward compatibility shim `getElementsMarkedForUpdate`
 * has been removed—call the specific collector you need directly.
 */

/* -------------------------------------------------------------------------- */
/* Flag Definitions                                                           */
/* -------------------------------------------------------------------------- */

export const COMPONENT = 1 << 0;
export const REACTIVE_ROOT = 1 << 1;
export const EVENTABLE = 1 << 2;

/* -------------------------------------------------------------------------- */
/* Internal Helpers                                                           */
/* -------------------------------------------------------------------------- */

/** Read current flags from an element (0 if none). */
function getFlags(el: Element): number {
  return (el as unknown as { __radiFlags?: number }).__radiFlags || 0;
}

/** OR new flags onto an element's bitmask. */
function addFlags(el: Element, flags: number): void {
  const flagStore = el as unknown as { __radiFlags?: number };
  flagStore.__radiFlags = (flagStore.__radiFlags ?? 0) | flags;
}

/* -------------------------------------------------------------------------- */
/* Public Flag Setters                                                        */
/* -------------------------------------------------------------------------- */

/** Mark an element as a component host. */
export function markComponentHost(el: Element): void {
  addFlags(el, COMPONENT);
}

/** Mark an element as a reactive root (subscribed to "update"). */
export function markReactiveRoot(el: Element): void {
  addFlags(el, REACTIVE_ROOT);
}

/** Mark an element as eventable (needs "update" for reactive props/subscriptions). */
export function markEventable(el: Element): void {
  addFlags(el, EVENTABLE);
}

/* -------------------------------------------------------------------------- */
/* Flag Predicates                                                            */
/* -------------------------------------------------------------------------- */

/** Determine if the element is a component host. */
export function isComponentHost(el: Element): boolean {
  return !!(getFlags(el) & COMPONENT);
}

/** Determine if the element is a reactive root. */
export function isReactiveRoot(el: Element): boolean {
  return !!(getFlags(el) & REACTIVE_ROOT);
}

/** Determine if the element is eventable. */
export function isEventable(el: Element): boolean {
  return !!(getFlags(el) & EVENTABLE);
}

/* -------------------------------------------------------------------------- */
/* Update Traversal                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Collect targets for a manual update cycle (`update(root)`).
 *
 * Rules:
 * - Include the root if it is a component host.
 * - Include component hosts unless they are nested beneath any reactive root ancestor.
 * - Include all reactive roots and eventable elements.
 * - Skip descending into nested reactive roots (except the root itself) to avoid
 *   duplicate component host updates and unnecessary traversal depth.
 */
export function collectUpdateTargets(root: Node): Element[] {
  const out: Element[] = [];
  let node: Node | null = root;
  let reactiveDepth = 0; // number of reactive ancestors currently active

  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const flags = getFlags(el);

      const reactive = (flags & REACTIVE_ROOT) !== 0;
      const component = (flags & COMPONENT) !== 0;
      const eventable = (flags & EVENTABLE) !== 0;

      const nestedUnderReactive = reactiveDepth > 0 && el !== root;
      const excludeComponent = component && nestedUnderReactive;

      if (!excludeComponent && (component || reactive || eventable)) {
        out.push(el);
      }

      // Prune descent into any non-root reactive root.
      const skipChildren = reactive && el !== root;
      if (!skipChildren && el.firstElementChild) {
        if (reactive) reactiveDepth++;
        node = el.firstElementChild;
        continue;
      }
    }

    // Ascend when no next sibling; adjust reactiveDepth leaving reactive nodes.
    while (node && node !== root && !node.nextSibling) {
      if (
        node.nodeType === Node.ELEMENT_NODE && isReactiveRoot(node as Element)
      ) {
        reactiveDepth--;
        if (reactiveDepth < 0) reactiveDepth = 0;
      }
      node = node.parentNode;
    }

    if (!node || node === root) break;
    node = node.nextSibling;
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Lifecycle Traversal                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Collect targets for connect/disconnect cascades.
 *
 * Rules:
 * - Include reactive roots (they host listeners) and eventable elements.
 * - Component hosts are not automatically included unless they also have other flags.
 * - Full descent (no pruning) ensures deep subscribers are reached.
 */
export function collectLifecycleTargets(root: Node): Element[] {
  const out: Element[] = [];
  let node: Node | null = root;

  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const flags = getFlags(el);
      if ((flags & REACTIVE_ROOT) || (flags & EVENTABLE)) {
        out.push(el);
      }
      if (el.firstElementChild) {
        node = el.firstElementChild;
        continue;
      }
    }
    while (node && node !== root && !node.nextSibling) {
      node = node.parentNode;
    }
    if (!node || node === root) break;
    node = node.nextSibling;
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Lifecycle Helpers (connect / disconnect / update / abort)                  */
/* -------------------------------------------------------------------------- */

/**
 * Dispatch a non-bubbling "connect" lifecycle event on a target node.
 */
export function connect(target: Node): boolean {
  return target.dispatchEvent(
    new Event("connect", { bubbles: false, cancelable: false }),
  );
}

/**
 * Dispatch a non-bubbling "disconnect" lifecycle event on a target node.
 */
export function disconnect(target: Node): boolean {
  return target.dispatchEvent(
    new Event("disconnect", { bubbles: false, cancelable: false }),
  );
}

/**
 * Cascade connect events to lifecycle targets beneath (excluding root itself).
 * Elements are collected via collectLifecycleTargets.
 */
export function dispatchConnect(root: Node): void {
  for (const el of collectLifecycleTargets(root)) {
    if (el !== root) connect(el);
  }
}

/**
 * Cascade disconnect events to lifecycle targets beneath (excluding root itself).
 */
export function dispatchDisconnect(root: Node): void {
  for (const el of collectLifecycleTargets(root)) {
    if (el !== root) disconnect(el);
  }
}

/**
 * Manual update cycle: dispatch "update" to collected targets.
 * Component hosts nested under reactive roots are excluded by collector logic.
 */
export function update(root: Node): void {
  for (const el of collectUpdateTargets(root)) {
    el.dispatchEvent(new Event("update"));
  }
}

/**
 * Create an AbortSignal tied to a node's disconnect lifecycle.
 * The signal aborts once the node dispatches "disconnect".
 */
export function createAbortSignal(target: Node): AbortSignal {
  const controller = new AbortController();
  target.addEventListener("disconnect", () => controller.abort(), {
    once: true,
  });
  return controller.signal;
}

export function createAbortSignalOnUpdate(target: Node): AbortSignal {
  const controller = new AbortController();
  function onAbort() {
    target.removeEventListener("update", onAbort);
    target.removeEventListener("disconnect", onAbort);
  }
  controller.signal.addEventListener("abort", onAbort, { once: true });
  target.addEventListener("update", () => controller.abort(), { once: true });
  target.addEventListener("disconnect", () => controller.abort(), {
    once: true,
  });
  return controller.signal;
}

/* -------------------------------------------------------------------------- */
/* End                                                                         */
/* -------------------------------------------------------------------------- */
