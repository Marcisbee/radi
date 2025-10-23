import {
  produceExpandedNodes,
  reconcileRange,
  safeAppend,
} from "./reconciler.ts";
import { createFragmentBoundary } from "./fragment.ts";
import { markReactiveRoot } from "../lifecycle.ts";
import { dispatchRenderError } from "../error.ts";
import type { ReactiveGenerator } from "../types.ts";

/**
 * Setup a reactive rendering region inside a container.
 * A fragment boundary (start/end comments) is appended, and on each update emission
 * the generator is invoked, expanded into concrete Nodes, and reconciled within the range.
 *
 * The first render executes immediately so initial state is visible synchronously.
 */
export function setupReactiveRender(
  container: Element,
  fn: ReactiveGenerator,
): void {
  const { start, end } = createFragmentBoundary();
  container.append(start, end);

  const renderFn = () => {
    try {
      const produced = fn(container);
      const expanded = produceExpandedNodes(container, produced, true);
      reconcileRange(start, end, expanded);
    } catch (err) {
      dispatchRenderError(container, err);
    }
  };

  markReactiveRoot(container);
  container.addEventListener("update", renderFn);
  renderFn();
}

/**
 * Mount a child which may be either:
 * - A concrete DOM Node (appended directly)
 * - A ReactiveGenerator function (wrapped in a reactive render region)
 */
export function mountChild(
  parent: Element,
  nodeOrFn: Node | ReactiveGenerator,
): void {
  if (typeof nodeOrFn === "function") {
    setupReactiveRender(parent, nodeOrFn as ReactiveGenerator);
  } else {
    safeAppend(parent, nodeOrFn);
  }
}
