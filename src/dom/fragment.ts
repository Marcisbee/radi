/**
 * Fragment helpers extracted from reconciler.
 * Provides reusable comment node templates and a factory for fragment boundaries.
 *
 * A fragment boundary is a pair of adjacent comment nodes:
 *   start: "<!--(-->"
 *   end:   "<!--)-->"
 * Internal reconciliation logic inserts/moves nodes between them.
 */

/** Reusable start comment template for fragment boundaries. */
export const FRAGMENT_START_TEMPLATE: Comment = document.createComment("(");

/** Reusable end comment template for fragment boundaries. */
export const FRAGMENT_END_TEMPLATE: Comment = document.createComment(")");

/**
 * Create a fresh fragment boundary (start/end comment pair).
 * Returned comments are clones of the shared templates to avoid
 * accidental mutation of the originals.
 */
export function createFragmentBoundary(): { start: Comment; end: Comment } {
  return {
    start: FRAGMENT_START_TEMPLATE.cloneNode() as Comment,
    end: FRAGMENT_END_TEMPLATE.cloneNode() as Comment,
  };
}

/**
 * Type helper for a fragment tuple structure used in various build paths.
 * Not all fragments include interior nodes immediately (some are placeholders).
 */
export type FragmentTuple = [
  Comment,
  ...Array<Node | (() => unknown)>,
  Comment,
];
