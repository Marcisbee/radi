/**
 * Server JSX Runtime for Radi.
 *
 * This runtime creates lazy nodes for string or streaming output. Configure:
 *
 *   jsxImportSource: 'radi/server'
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
} from '../server.ts';
import type {
  ServerChild,
  ServerComponent as ComponentType,
  ServerNode,
} from '../server.ts';

/** JSX types are local to the server runtime, independent of DOM JSX globals. */
export namespace JSX {
  export type Element = ServerNode;
  export type ElementType = string | ((props: never) => ServerChild);
  export type LibraryManagedAttributes<_Component, Props> = Props extends
    () => infer Values ? Values : Props;
  export interface ElementChildrenAttribute {
    children: unknown;
  }
  export interface IntrinsicElements {
    [tag: string]: Record<string, unknown>;
  }
}

interface SourceInfo {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

type Props = Record<string, unknown> | null;

function prepare(type: unknown, props: Props, key?: unknown): ServerNode {
  const p: Record<string, unknown> = props ? { ...props } : {};
  if (key != null) {
    p.key = key;
  }
  const children = p.children as ServerChild;
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
): ServerNode {
  return prepare(type, props, key);
}

/**
 * jsxs: Multiple children form (JSX factory).
 */
export function jsxs(
  type: unknown,
  props: Record<string, unknown>,
  key?: ServerChild,
): ServerNode {
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
): ServerNode {
  const p: Record<string, unknown> = props ? { ...props } : {};
  if (key != null) p.key = key;
  if (source) {
    Object.defineProperty(p, '__source', { value: source, enumerable: false });
  }
  if (self) {
    Object.defineProperty(p, '__self', { value: self, enumerable: false });
  }
  return prepare(type, p, key);
}

/**
 * Fragment export required by the JSX transform.
 */
export const Fragment = SSRFragment;

// Optional default export for certain bundlers.
export default { jsx, jsxs, jsxDEV, Fragment };
