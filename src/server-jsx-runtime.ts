/**
 * Server JSX Runtime for Radi.
 *
 * This runtime wires the JSX transform to the universal server renderer
 * (string output). Configure your compiler/bundler to use:
 *
 *   jsxImportSource: 'radi'
 *   moduleName: 'radi/server-jsx-runtime'
 *
 * when building for SSR so that <Component /> maps to the server-side
 * createElement exported here instead of the DOM-oriented client version.
 *
 * Differences from the client runtime:
 *  - Reactive/subscribable values are only evaluated/sampled once.
 *  - No DOM mutation or lifecycle events (connect/disconnect/update).
 *  - Output intended for `renderToString()` consumption.
 *
 * You can pair this with `radi/server` exports:
 *   import { renderToString } from 'radi/server';
 *   const html = renderToString(<App />);
 */

import {
  createElement as ssrCreateElement,
  Fragment as SSRFragment,
} from "./server.ts";
import type { ComponentType } from "./renderer.ts";

type ServerChild = unknown;

interface SourceInfo {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

type Props = Record<string, unknown> | null;

function prepare(type: unknown, props: Props, key?: unknown): unknown {
  const p: Record<string, unknown> = props ? { ...props } : {};
  if (key != null) {
    p.key = key;
  }
  const children = (p as any).children; // JSX transform guarantees presence or omission
  delete (p as { children?: unknown }).children;

  if (children === undefined) {
    return ssrCreateElement(type as string | ComponentType, p);
  }
  if (Array.isArray(children)) {
    return ssrCreateElement(type as string | ComponentType, p, ...children);
  }
  return ssrCreateElement(type as string | ComponentType, p, children);
}

/**
 * jsx: Single child form (JSX factory).
 */
export function jsx(
  type: unknown,
  props: Record<string, unknown>,
  key?: ServerChild,
): unknown {
  return prepare(type, props, key);
}

/**
 * jsxs: Multiple children form (JSX factory).
 */
export function jsxs(
  type: unknown,
  props: Record<string, unknown>,
  key?: ServerChild,
): unknown {
  return prepare(type, props, key);
}

/**
 * Development JSX factory variant (mirrors React/Preact signature).
 * Included for completeness; server dev tooling may choose to use a
 * dedicated dev runtime file with richer diagnostics if needed.
 */
export function jsxDEV(
  type: unknown,
  props: Record<string, unknown>,
  key: ServerChild | undefined,
  _isStaticChildren: boolean,
  source?: SourceInfo,
  self?: unknown,
): unknown {
  const p: Record<string, unknown> = props ? { ...props } : {};
  if (key != null) p.key = key;
  if (source) {
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
export const Fragment = SSRFragment;

// Optional default export for certain bundlers.
export default { jsx, jsxs, jsxDEV, Fragment };
