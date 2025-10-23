import { produceExpandedNodes, reconcileRange } from "./reconciler.ts";
import { createFragmentBoundary } from "./fragment.ts";
import { dispatchRenderError } from "../error.ts";
import { markEventable } from "../lifecycle.ts";
import type { Child, Subscribable } from "../types.ts";
import { isSubscribable } from "./is-subscribable.ts";
import { setPropValue } from "./props.ts";

/**
 * Safely execute an unsubscribe variant (function or object with unsubscribe()).
 */
export function safelyRunUnsubscribe(
  unsub: void | (() => void) | { unsubscribe(): void },
): void {
  try {
    if (typeof unsub === "function") {
      (unsub as () => void)();
    } else if (
      unsub &&
      typeof (unsub as { unsubscribe?: unknown }).unsubscribe === "function"
    ) {
      (unsub as { unsubscribe(): void }).unsubscribe();
    }
  } catch {
    // swallow errors
  }
}

/**
 * Subscribe to a store and reconcile the interior of a comment-delimited fragment
 * whenever the emitted value changes (Object.is comparison).
 */
export function subscribeAndReconcileRange(
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
        const expanded = produceExpandedNodes(parentEl, value, false);
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

/**
 * Build a subscribable child into a fragment whose contents update reactively.
 */
export function buildSubscribableChild(store: Subscribable<unknown>): Child {
  const { start, end } = createFragmentBoundary();
  subscribeAndReconcileRange(store, start, end);
  return [start, end];
}

/**
 * Bind a subscribable to an element property (prop-level subscription path).
 * Each distinct emission updates the property; errors dispatch via error boundary.
 */
export function bindSubscribableProp(
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

/**
 * Utility to detect and build subscribable children inline.
 * Returns original input if not subscribable.
 */
export function maybeBuildSubscribableChild(value: unknown): Child {
  if (isSubscribable(value)) {
    return buildSubscribableChild(value as Subscribable<unknown>);
  }
  return value as Child;
}
