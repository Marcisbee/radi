// Prop handling utilities extracted from main.ts.
// Simplified: removed all injection setters; uses built-in fallback logic only.

import { markEventable, markReactiveRoot } from "../lifecycle.ts";
import type { Subscribable } from "../types.ts";
import { dispatchRenderError } from "../error.ts";
import { currentBuildingComponent } from "../main.ts";
import { isSubscribable } from "./is-subscribable.ts";

/* -------------------------------------------------------------------------- */
/* Style & Primitive Prop Setting                                             */
/* -------------------------------------------------------------------------- */

/** Apply a plain style object to an element (mutating element.style). */
export function applyStyleObject(
  el: HTMLElement,
  styleObj: Record<string, string | number>,
): void {
  for (const k in styleObj) {
    (el.style as any)[k] = styleObj[k];
  }
}

/** Set a property or attribute (including special handling for "style"). */
export function setPropValue(
  el: HTMLElement,
  key: string,
  value: unknown,
): void {
  if (key === "style" && value && typeof value === "object") {
    applyStyleObject(el, value as Record<string, string | number>);
  } else if (key in el) {
    (el as any)[key] = value;
  } else {
    el.setAttribute(key, String(value));
  }
}

/* -------------------------------------------------------------------------- */
/* Prop Application                                                           */
/* -------------------------------------------------------------------------- */

/** Internal fallback subscribable detection if no predicate injected. */

/** Apply props to a plain DOM element (events, functions, subscribables, primitives). */
export function applyPropsToPlainElement(
  element: HTMLElement,
  props: Record<string, unknown>,
): void {
  // uses centralized isSubscribable import
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
    if (isSubscribable(value)) {
      markEventable(element);
      bindSubscribableProp(element, key, value as Subscribable<unknown>);
      continue;
    }
    setPropValue(element, key, value);
  }
}

/* -------------------------------------------------------------------------- */
/* Dynamic Function Prop                                                      */
/* -------------------------------------------------------------------------- */

/** Bind a function-valued prop and re-evaluate on "update" events. */
export function bindFunctionProp(
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

/* -------------------------------------------------------------------------- */
/* Subscribable Prop                                                          */
/* -------------------------------------------------------------------------- */

/** Internal helper: safely execute unsubscribe variants. */
function safelyRunUnsubscribe(
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
    // swallow
  }
}

/**
 * Subscribe to a store and push emitted values into an element property.
 * Mirrors original subscribeAndReconcileRange "prop binding" pathway (no range reconciliation).
 */
function subscribeAndReconcileRange(
  store: Subscribable<unknown>,
  _start: Comment | undefined,
  _end: Comment | undefined,
  onValue: (value: unknown) => void,
  disconnectTarget: Element,
): void {
  let previous: unknown = Symbol("radi_initial_prop");
  let unsub: void | (() => void) | { unsubscribe(): void };
  try {
    unsub = store.subscribe((value: unknown) => {
      if (Object.is(value, previous)) return;
      previous = value;
      try {
        onValue(value);
      } catch (err) {
        dispatchRenderError(disconnectTarget, err);
      }
    });
  } catch (err) {
    dispatchRenderError(disconnectTarget, err);
  }
  disconnectTarget.addEventListener("disconnect", () => {
    safelyRunUnsubscribe(unsub as any);
  });
}

/** Subscribe a subscribable prop and reflect changes into an element property. */
export function bindSubscribableProp(
  element: HTMLElement,
  key: string,
  subscribable: Subscribable<unknown>,
): void {
  subscribeAndReconcileRange(
    subscribable,
    undefined,
    undefined,
    (v) => {
      try {
        setPropValue(element, key, v);
      } catch (err) {
        dispatchRenderError(element, err);
      }
    },
    element,
  );
}

/* -------------------------------------------------------------------------- */
/* Error Reporting                                                            */
/* -------------------------------------------------------------------------- */

/** Report an error for a function prop evaluation (prefers current building component boundary). */
export function reportPropError(element: HTMLElement, err: unknown): void {
  const boundary = !element.isConnected ? currentBuildingComponent : null;
  dispatchRenderError(boundary || element, err);
}
