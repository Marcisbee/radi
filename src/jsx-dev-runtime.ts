import { createElement, Fragment as RadiFragment } from "./main.ts";

type AnyProps = Record<string, any> | null;
type Child = any;

interface SourceInfo {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * Internal helper to construct the element with Radi's factory.
 */
function build(type: any, rawProps: AnyProps): any {
  const props = rawProps ? { ...rawProps } : {};
  const children = (props as any).children;
  delete (props as any).children;

  if (children === undefined) {
    return createElement(type, props);
  }
  if (Array.isArray(children)) {
    return createElement(type, props, ...children);
  }
  return createElement(type, props, children);
}

/**
 * Development JSX factory.
 * Mirrors React's jsxDEV signature for compatibility with TS transforms.
 */
export function jsxDEV(
  type: any,
  props: Record<string, any>,
  key: Child | undefined,
  isStaticChildren: boolean,
  source?: SourceInfo,
  self?: any,
): any {
  // Clone props to avoid mutating caller object.
  const p = props ? { ...props } : {};

  // Preserve key as a prop so user code can access it (Radi does not use it internally yet).
  if (key != null) {
    (p as any).key = key;
  }

  // Attach dev-only metadata (non-enumerable -> not emitted as attributes).
  if (source) {
    Object.defineProperty(p, "__source", { value: source, enumerable: false });
  }
  if (self) {
    Object.defineProperty(p, "__self", { value: self, enumerable: false });
  }

  // Potential future optimization using isStaticChildren could go here.

  return build(type, p);
}

/**
 * Fragment export required so <></> maps to this symbol.
 */
export const Fragment = RadiFragment;

/**
 * Optional convenience exports to allow direct importing in dev if desired.
 * (Not strictly required by the react-jsxdev transform, which only uses jsxDEV.)
 */
export { jsxDEV as jsx, jsxDEV as jsxs };

// Default export (optional) - some bundlers / tools may look for it.
export default { jsxDEV, Fragment };
