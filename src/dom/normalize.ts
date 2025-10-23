import type { Child, ReactiveGenerator } from "../types.ts";

/**
 * Normalize arbitrary child input (single value or array) into a flat array
 * containing only DOM Nodes and ReactiveGenerators (functions to be invoked
 * later for dynamic rendering).
 *
 * Rules:
 * - string | number => Text node
 * - boolean => Comment node ("true" / "false")
 * - null | undefined => Comment node ("null")
 * - function => preserved as ReactiveGenerator
 * - Node => preserved
 * - Array => recursively flattened (breadth-first to retain intuitive ordering)
 *
 * Subscribable objects are NOT handled here; detection & transformation of
 * subscribables happens at a higher buildElement layer to keep normalization
 * focused and simple.
 */
export function normalizeToNodes(
  raw: Child | Child[],
): (Node | ReactiveGenerator)[] {
  const out: (Node | ReactiveGenerator)[] = [];
  const queue: (Child | Child[])[] = Array.isArray(raw) ? [...raw] : [raw];

  while (queue.length) {
    const item = queue.shift()!;
    if (item == null) {
      out.push(document.createComment("null"));
      continue;
    }
    if (Array.isArray(item)) {
      // Prepend to process in breadth-first order.
      queue.unshift(...item);
      continue;
    }
    switch (typeof item) {
      case "string":
      case "number":
        out.push(document.createTextNode(String(item)));
        continue;
      case "boolean":
        out.push(document.createComment(item ? "true" : "false"));
        continue;
      case "function":
        out.push(item as ReactiveGenerator);
        continue;
    }
    if (item instanceof Node) {
      out.push(item);
    }
  }

  return out;
}
