// Prop handling utilities extracted from main.ts.
// Simplified: removed all injection setters; uses built-in fallback logic only.

import { markReactiveRoot } from "../lifecycle.ts";
import { dispatchRenderError } from "../error.ts";
import { currentBuildingComponent } from "../main.ts";
import { isSubscribable } from "./is-subscribable.ts";
import { bindSubscribableProp } from "./subscribeable.ts";

/* -------------------------------------------------------------------------- */
/* Style & Primitive Prop Setting                                             */
/* -------------------------------------------------------------------------- */

/** Apply a plain style object to an element (mutating element.style). */
export function applyStyleObject(
  el: HTMLElement,
  styleObj: Record<string, string | number>,
): void {
  for (const k in styleObj) {
    el.style.setProperty(k, String(styleObj[k]));
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
    (el as HTMLElement & Record<string, unknown>)[key] = value;
  } else {
    el.setAttribute(key, String(value));
  }
}

/* -------------------------------------------------------------------------- */
/* Prop Application                                                           */
/* -------------------------------------------------------------------------- */

/** Apply props to a plain DOM element (events, functions, subscribables, primitives). */
export function applyPropsToPlainElement(
  element: HTMLElement,
  props: Record<string, unknown>,
): void {
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
      bindSubscribableProp(element, key, value);
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
/* Error Reporting                                                            */
/* -------------------------------------------------------------------------- */

/** Report an error for a function prop evaluation (prefers current building component boundary). */
export function reportPropError(element: HTMLElement, err: unknown): void {
  const boundary = !element.isConnected ? currentBuildingComponent : null;
  dispatchRenderError(boundary || element, err);
}
