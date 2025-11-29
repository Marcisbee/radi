import { createElement, Fragment as RadiFragment } from "./client.ts";

type RadiChild = any; // Accept the permissive child types used by createElement.

interface SourceInfo {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

type Props = Record<string, any> | null;

/**
 * Convert the props object produced by the TS transform into arguments
 * for Radi's createElement factory.
 */
function prepare(type: any, props: Props, key?: RadiChild): RadiChild {
  const p = props ? { ...props } : {};
  if (key != null) {
    // Store key on props so user code could access it
    (p as any).key = key;
  }
  const children = (p as any).children;
  delete (p as any).children;

  if (children === undefined) {
    return createElement(type, p);
  }
  if (Array.isArray(children)) {
    return createElement(type, p, ...children);
  }
  return createElement(type, p, children);
}

/**
 * Single child form.
 */
export function jsx(
  type: any,
  props: Record<string, any>,
  key?: RadiChild,
): RadiChild {
  return prepare(type, props, key);
}

/**
 * Multiple children form.
 */
export function jsxs(
  type: any,
  props: Record<string, any>,
  key?: RadiChild,
): RadiChild {
  return prepare(type, props, key);
}

/**
 * Development form (mirrors React's signature for compatibility if consumed directly).
 * NOTE: For full automatic dev runtime support use radi/jsx-dev-runtime.ts which exports jsxDEV.
 */
export function jsxDEV(
  type: any,
  props: Record<string, any>,
  key: RadiChild | undefined,
  isStaticChildren: boolean,
  source?: SourceInfo,
  self?: any,
): RadiChild {
  const p = props ? { ...props } : {};
  if (key != null) {
    (p as any).key = key;
  }
  if (source) {
    // Attach debug metadata (non-enumerable to avoid attribute emission if possible)
    Object.defineProperty(p, "__source", { value: source, enumerable: false });
  }
  if (self) {
    Object.defineProperty(p, "__self", { value: self, enumerable: false });
  }
  return prepare(type, p, key);
}

/**
 * Fragment export required by the JSX transform.
 */
export const Fragment = RadiFragment;

// Optional default export for some bundlers / interop use-cases.
export default { jsx, jsxs, jsxDEV, Fragment };
