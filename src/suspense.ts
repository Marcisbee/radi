import { createAbortSignal, createElement, update } from "./client.ts";

/**
 * Dispatch a fresh "suspend" event from a descendant node.
 * Returns true if not prevented.
 */
export function suspend(target: Node): boolean {
  return target.dispatchEvent(
    new Event("suspend", {
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  );
}

/**
 * Dispatch a fresh "unsuspend" event from a descendant node.
 * Returns true if not prevented.
 */
export function unsuspend(target: Node): boolean {
  return target.dispatchEvent(
    new Event("unsuspend", {
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  );
}

/**
 * Suspense component
 * Shows fallback while one or more descendants are suspended.
 * Child components that perform async work should call suspend(node) before starting
 * and unsuspend(node) when resolved. Multiple overlapping suspensions are reference-counted.
 *
 * This implementation relies on the updated component build queue:
 * - Suspense host builds first, installs listeners.
 * - Descendant component builds that trigger suspend will bubble upward correctly.
 */
export function Suspense(
  this: HTMLElement,
  props: JSX.PropsWithChildren<{ fallback: () => JSX.Element }>,
) {
  const signal = createAbortSignal(this);
  // Track number of active suspensions.
  let pending = 0;
  // Start by assuming children should render; suspend events may arrive during child build.
  let showChildren = true;

  const onSuspend = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending === 0 && showChildren) {
      showChildren = false;
        update(this);
    }
    pending++;
  };

  const onUnsuspend = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending > 0) pending--;
    if (pending === 0 && !showChildren) {
      showChildren = true;
        update(this);
    }
  };

  this.addEventListener("suspend", onSuspend, { signal });
  this.addEventListener("unsuspend", onUnsuspend, { signal });

  const template = createElement("suspense", {
    style: () => ({ display: (showChildren ? "contents" : "none") }),
  }, () => props().children);

  return [
    template,
    () => showChildren ? null : props().fallback(),
  ];
}
