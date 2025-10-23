/**
 * Client entrypoint for Radi (DOM environment).
 *
 * This module consolidates:
 *  - Core DOM-focused APIs from main.ts (component system + reactive rendering).
 *  - Universal renderer utilities (createRenderer/createDomAdapter) for custom embedding.
 *  - A preconfigured DOM renderer instance (DOM_RENDERER) extracted from renderer.ts.
 *
 * Typical usage (browser):
 *
 *   import {
 *     createElement,
 *     Fragment,
 *     createRoot,
 *     update,
 *     createAbortSignal,
 *     connect,
 *     disconnect,
 *     domRender,
 *     domCreateElement,
 *   } from 'radi/client';
 *
 * Server-side usage should import from 'radi/server' (to be implemented) which
 * will expose a string/streaming renderer instead of mutating the real DOM.
 *
 * NOTE: `domCreateElement` and friends come from the universal abstraction and are
 * separate from the higher-level `createElement` exported from main.ts.
 * The former bypasses component placeholder semantics and prop binding logic.
 */

/* -------------------------------------------------------------------------- */
/* Re-exports from core DOM implementation                                    */
/* -------------------------------------------------------------------------- */

export {
  connect, // Direct lifecycle event dispatch
  createAbortSignal, // AbortSignal tied to disconnect lifecycle
  createElement, // JSX element/component factory (Radi semantics)
  createRoot, // Root manager with reconcile-based rendering
  disconnect,
  dispatchConnect,
  dispatchDisconnect,
  Fragment, // Fragment token
  update, // Manual update traversal dispatch
} from "./main.ts";

/* -------------------------------------------------------------------------- */
/* Universal renderer exports (for advanced/custom use)                       */
/* -------------------------------------------------------------------------- */

export {
  createDomAdapter,
  createRenderer,
  createServerStringAdapter, // Useful for isomorphic setups (optional client-side import)
  DOM_RENDERER,
} from "./renderer.ts";

/* -------------------------------------------------------------------------- */
/* Convenience aliases from the preconfigured DOM universal renderer          */
/* -------------------------------------------------------------------------- */

import { DOM_RENDERER } from "./renderer.ts";

/**
 * Destructure DOM universal renderer for lower-level control.
 * These functions operate on UniversalNodes; they are NOT the same
 * as the higher-level Radi `createElement` (which handles components,
 * reactive props, subscribables, etc).
 */
export const {
  render: domRender,
  createElement: domCreateElement,
  createTextNode: domCreateTextNode,
  createComment: domCreateComment,
  fragment: domFragment,
  renderToString: _unusedDomRenderToString, // Included for parity; DOM adapter does not serialize.
} = DOM_RENDERER;

/* -------------------------------------------------------------------------- */
/* Guidance                                                                    */
/* -------------------------------------------------------------------------- */
/*
  When to use which API?

  - High-level Radi API (createElement/Fragment/createRoot):
      Use for typical application code, JSX, components, reactivity.

  - Universal DOM renderer (domCreateElement/domRender):
      Use for custom embedding scenarios, interop layers, or experimentation
      where you want to bypass Radi's component/subscribable normalization
      and work at a lower abstraction similar to Solid's universal renderer.

  Avoid mixing the two styles on the same subtree unless you understand
  the lifecycle/event differences. Universal nodes do not automatically
  receive Radi's connect/update/disconnect lifecycles.
*/
