/**
 * Centralized subscribable type guard.
 * Determines if a value conforms to a minimal Subscribable interface:
 *   - non-null object
 *   - not an Array
 *   - not a DOM Node
 *   - has a 'subscribe' function
 *
 * This consolidates previous duplicated logic so other modules
 * (e.g. props handling or reactive builders) can import a single source.
 */

import type { Subscribable } from "../types.ts";

export function isSubscribable<T = unknown>(
  value: unknown,
): value is Subscribable<T> {
  return !!(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Node) &&
    typeof (value as { subscribe?: unknown }).subscribe === "function"
  );
}
