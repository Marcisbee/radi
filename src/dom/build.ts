import type { Child, ReactiveGenerator } from '../types.ts';
import { createFragmentBoundary } from './reconciler.ts';
import { normalizeToNodes } from './normalize.ts';
import { setupReactiveRender } from './reactive.ts';
import { maybeBuildSubscribableChild } from './subscribeable.ts';

/**
 * Build a single child value into one of:
 * - DOM Node
 * - ReactiveGenerator wrapper function (for nested reactive generation)
 * - Fragment array [startComment, ...nodes/functions, endComment]
 * - Subscribable fragment (delegated via maybeBuildSubscribableChild)
 * - Comment markers for boolean / null
 *
 * This function performs minimal transformation; deeper expansion happens
 * later (e.g. produceExpandedNodes).
 */
export function buildElement(child: Child): Child {
  // Primitives
  if (typeof child === 'string' || typeof child === 'number') {
    return document.createTextNode(String(child));
  }
  if (typeof child === 'boolean') {
    return document.createComment(child ? 'true' : 'false');
  }
  // Reactive generator (function)
  if (typeof child === 'function') {
    return (parent: Element) => {
      const produced = (child as ReactiveGenerator)(parent);
      const arr = ([] as Child[]).concat(produced as Child);
      return normalizeToNodes(arr.map(buildElement) as Child[]);
    };
  }
  // Subscribable (delegated)
  {
    const maybe = maybeBuildSubscribableChild(child);
    if (maybe !== child) return maybe;
  }
  // Arrays become fragment boundaries
  if (Array.isArray(child)) {
    return buildArrayChild(child);
  }
  // Nullish => comment marker
  if (child == null) {
    return document.createComment('null');
  }
  return child;
}

/**
 * Build an array child into a fragment.
 * If reactivePlaceholder is true, reactive functions are deferred:
 * they are replaced by a temporary comment and mounted asynchronously.
 */
export function buildArrayChild(
  childArray: Child[],
  reactivePlaceholder = false,
): Child {
  const { start, end } = createFragmentBoundary();

  // First pass: recursively build each child
  const built: Child[] = [];
  for (const ch of childArray) {
    const res = buildElement(ch);
    if (Array.isArray(res)) {
      for (const item of res) {
        if (item != null) built.push(item as Child);
      }
    } else if (res != null) {
      built.push(res);
    }
  }

  // Normalize to nodes + reactive generators
  const normalized = normalizeToNodes(built).filter(
    (n): n is Node | ReactiveGenerator => !!n,
  );

  // Direct output path
  if (!reactivePlaceholder) {
    return [start, ...normalized, end];
  }

  // Deferred mounting path for reactive functions
  const out: Node[] = [];
  for (const n of normalized) {
    if (typeof n === 'function') {
      const placeholder = document.createComment('deferred-reactive');
      out.push(placeholder);
      queueMicrotask(() => {
        const parent = placeholder.parentNode as Element | null;
        if (parent) {
          setupReactiveRender(parent, n as ReactiveGenerator);
          parent.removeChild(placeholder);
        }
      });
    } else {
      out.push(n);
    }
  }
  return [start, ...out, end];
}