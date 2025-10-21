/**
 * A reactive function that produces new child(ren) when invoked with the parent element.
 * Returned value may be a single child or an array of children which will be normalized.
 */
export type ReactiveGenerator = (parent: Element) => Child | Child[];

/**
 * Subscribable source of reactive values.
 * Implementations call the provided listener whenever the value changes.
 * The return value of subscribe may be:
 *  - void (no cleanup needed)
 *  - a function () => void to cleanup
 *  - an object with an unsubscribe(): void method
 */
export interface Subscribable<T> {
  subscribe(
    fn: (value: T) => void,
  ): void | (() => void) | { unsubscribe(): void };
}

/**
 * Primitive or structured child value accepted by the framework's element builders.
 * Includes reactive generators and subscribable stores.
 */
export type Child =
  | string
  | number
  | boolean
  | null
  | undefined
  | Node
  | Child[]
  | ReactiveGenerator
  | Subscribable<unknown>;

/**
 * Type guard to determine whether an arbitrary value is a Subscribable.
 * Checks for a non-null object with a function subscribe property.
 */
export function isSubscribable(value: unknown): value is Subscribable<unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { subscribe?: unknown }).subscribe === "function"
  );
}

/**
 * Type guard to determine if a value is a ReactiveGenerator.
 * Uses typeof function check; additional heuristics can be added later.
 */
export function isReactiveGenerator(
  value: unknown,
): value is ReactiveGenerator {
  return typeof value === "function";
}

/**
 * Normalize a possible reactive child into an array for uniform processing.
 * Does not perform Node creation; higher-level code handles conversion.
 */
export function toChildArray(child: Child | Child[]): Child[] {
  return Array.isArray(child) ? child : [child];
}
