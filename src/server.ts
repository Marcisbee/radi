/**
 * Server entrypoint for Radi (SSR / HTML string rendering).
 *
 * This module exposes a universal, string-based renderer built from the
 * lightweight abstraction in `renderer.ts`. It is intentionally minimal:
 * - One-shot expansion of component + reactive function outputs.
 * - Subscribables are sampled once (initial value only if synchronous).
 * - No lifecycle events (connect / disconnect / update) are dispatched.
 *
 * Typical usage:
 *
 *   import {
 *     renderToString,
 *     ssrCreateElement as createElement,
 *     ssrFragment as Fragment
 *   } from 'radi/server';
 *
 *   const html = renderToString(
 *     ssrCreateElement('div', { class: 'app' },
 *       ssrCreateElement(App, null)
 *     )
 *   );
 *
 * Or with JSX (configure your JSX transform to point at radi/server for SSR):
 *
 *   const html = renderToString(<App />);
 *
 * For custom adapters (streaming, terminal, etc.), build your own:
 *
 *   import { createRenderer, createServerStringAdapter } from 'radi/server';
 *   const adapter = createServerStringAdapter();
 *   const { renderToString: customRenderToString } = createRenderer(adapter);
 *
 * NOTE: The high-level DOM-centric APIs from `main.ts` are not imported here
 * because they depend on real browser `document` operations.
 */

import type { Child } from "./types.ts";
import {
  createDomAdapter, // exported for symmetry (may be useful in isomorphic setups)
  createRenderer,
  createServerStringAdapter,
  SERVER_RENDERER,
} from "./renderer.ts";

/* -------------------------------------------------------------------------- */
/* Destructure preconfigured server renderer                                   */
/* -------------------------------------------------------------------------- */

const {
  renderToString,
  createElement: ssrCreateElement,
  fragment: ssrFragment,
  createTextNode: ssrCreateTextNode,
  createComment: ssrCreateComment,
} = SERVER_RENDERER;

/* -------------------------------------------------------------------------- */
/* Convenience helpers                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Render a single Child (component, element, fragment, primitives) to an HTML string.
 * This is an alias of the underlying renderer's renderToString for semantic clarity.
 */
export function renderToStringRoot(child: Child): string {
  if (!renderToString) {
    throw new Error("Server renderer missing renderToString implementation.");
  }
  return renderToString(child);
}

/**
 * Shorthand helper for SSR when using a root component reference.
 *
 *   const html = ssr(() => <App />);
 */
export function ssr(entry: () => Child): string {
  return renderToStringRoot(entry());
}

/* -------------------------------------------------------------------------- */
/* Re-exports                                                                  */
/* -------------------------------------------------------------------------- */

/** Preconfigured HTML string renderer (UniversalNode based). */
export { SERVER_RENDERER };

/** Factory helpers for building custom server adapters/renderers. */
export {
  createDomAdapter, // intentionally exposed: allows hybrid/isomorphic patterns
  createRenderer,
  createServerStringAdapter,
};

/** Low-level universal creation helpers (NOT the same as DOM Radi createElement). */
export {
  renderToString,
  ssrCreateComment as createComment,
  ssrCreateElement as createElement,
  ssrCreateTextNode as createTextNode,
  ssrFragment as Fragment,
};

/* -------------------------------------------------------------------------- */
/* Guidance                                                                    */
/* -------------------------------------------------------------------------- */
/*
  Distinguishing APIs:

  - createElement (from this module):
      Universal renderer element/component creation for SSR string output.
      Does not install reactive subscriptions beyond initial synchronous pass.

  - renderToString / renderToStringRoot:
      Produce an HTML string snapshot of the current tree.

  - ssr():
      Convenience wrapper to invoke an entry component factory.

  If you need client-side interactivity or lifecycle events, import from 'radi/client'
  and hydrate manually (hydration not yet implemented in this abstraction).
*/
