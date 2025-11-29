# Flag-Based Update Traversal Semantics in Radi

This document describes how Radi traverses the DOM to deliver `"update"` events,
now using a compact flag bitmask (`__radiFlags`) instead of legacy boolean
marker properties. It covers:

- Flag taxonomy
- Inclusion / exclusion rules
- Duplicate prevention
- Interaction with reconciliation (reuse vs remount)
- Edge cases and examples
- Testing guidance
- Recommended usage patterns & anti‑patterns
- FAQ

---

## 1. Flag Taxonomy

Each relevant element is annotated (via helper functions) with one or more bits
stored in `__radiFlags`:

| Flag          | Bit      | Meaning                                                                 |
| ------------- | -------- | ----------------------------------------------------------------------- |
| COMPONENT     | `1 << 0` | A `<radi-host>` placeholder for a function component.                   |
| REACTIVE_ROOT | `1 << 1` | Element whose DOM subtree is produced by a reactive generator function. |
| EVENTABLE     | `1 << 2` | Element with subscriptions / reactive props needing `"update"`.         |

Flag setters:

- `markComponentHost(el)`
- `markReactiveRoot(el)`
- `markEventable(el)`

Predicates:

- `isComponentHost(el)`
- `isReactiveRoot(el)`
- `isEventable(el)`

Legacy fields removed: `__radiHost`, `__reactiveRoot`, `__reactiveEvent`.

---

## 2. Traversal Overview

Manual update cycles (`update(root)`) call `collectUpdateTargets(root)` which
returns an ordered list of elements to receive a single `"update"` event.

Traversal is a specialized pre-order walk with pruning rules designed to:

1. Avoid duplicate reactive evaluations for nested component hosts.
2. Keep runtime cost minimal by skipping subtrees that can only produce excluded
   nodes.
3. Preserve correctness for structural (non-reactive) parents.

Lifecycle cascades (`connect` / `disconnect`) use
`collectLifecycleTargets(root)`, a full descent walk (no pruning) ensuring every
reactive root and eventable element receives the lifecycle notification
necessary for subscription cleanup or generator initialization.

---

## 3. Inclusion & Exclusion Rules (Formal)

Let for an element `el`:

- `C` = COMPONENT flag set
- `R` = REACTIVE_ROOT flag set
- `E` = EVENTABLE flag set
- `A` = currently under (descendant of) a reactive ancestor
  (`reactiveDepth > 0`) — the root counts if it is reactive.

Include `el` in update traversal if:

- `(C && el === root)` OR
- `(C && !A)` OR
- `R` OR
- `E`

Exclude `el` if:

- `C && A && el !== root`

Additionally:

- Do not descend into children of any reactive root other than the root itself.
  (Prune on `R && el !== root`)

Lifecycle traversal differs:

- Include elements with `R` or `E`.
- Descend fully (no pruning).
- Component hosts are not auto-included unless they also have `R` or `E`.

---

## 4. Why Duplicate Updates Occurred Historically

Before pruning & exclusion logic:

- A nested component host inside a reactive parent would be:
  1. Explicitly included in the manual update traversal.
  2. Also implicitly updated during reconciliation (props reuse dispatch).
     Result: double `"update"` events → inflated render counters, failing tests.

Current fix:

- Exclude component hosts beneath any reactive ancestor.
- Allow a single targeted `"update"` via reuse logic when props change.

---

## 5. Reconciliation Interaction

During reconciliation (key-based diff):

- If a component host is reused (same component type + key), its props ref
  updates and exactly one `"update"` event is dispatched directly on that host
  (independent of traversal if under a reactive ancestor).
- If keys or component types diverge → remount: disconnect old host, connect new
  host, fresh build executed.

Implications:

- Stable keyed children under a reactive parent are only updated when their
  props actually change.
- Manual `update(parentReactiveRoot)` does not redundantly spike counter-based
  side effects in nested components.

---

## 6. Typical Structures & Outcomes

1. Reactive parent with plain children
   - Parent: included (`R`).
   - Plain children: not directly included unless `E`.
   - No pruning issues; minimal list.

2. Reactive parent with nested component hosts
   - Parent: included.
   - Nested hosts: excluded (under reactive ancestor).
   - Reused hosts get localized `"update"` only when props change.

3. Non-reactive parent with component children
   - Component hosts included (no reactive ancestor).
   - Each receives a direct `"update"` per manual cycle.

4. Chain: Reactive → Reactive → Component
   - Only the top reactive root's children are pruned when encountering the next
     reactive root; deeper nested component hosts under any reactive ancestor
     are excluded.
   - Prevents multiplicative evaluation.

5. Eventable elements anywhere
   - Always included (`E` never excluded), irrespective of reactive ancestry.

---

## 7. Edge Cases

| Case                                       | Behavior                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Root itself is a reactive component host   | Included once (root `C` + `R`), descendants pruned per rules.                                                      |
| Component host inside non-reactive `<div>` | Included (no reactive ancestor).                                                                                   |
| Detached subtree passed to `update(node)`  | Traversal runs; events dispatch only to that subtree; no side leaks.                                               |
| Mixed flags (component also eventable)     | Inclusion determined once; eventable status doesn’t override exclusion when nested under reactive ancestor if `C`. |
| Dynamically added flags mid-cycle          | Flags inspected at traversal time; additions after list creation require another cycle to pick up.                 |

---

## 8. Testing Guidance

Recommended unit tests:

1. Single dispatch for nested component under reactive ancestor.
2. Direct dispatch for component under non-reactive parent.
3. Key flip causes remount (state reset, counter returns to initial).
4. Double reactive chain yields no duplicate side effects.
5. Eventable element still receives update under reactive ancestor.
6. Reuse dispatch triggers one update when props change; none when stable.
7. Pruned subtree: verify children of nested reactive root not traversed for
   component hosts.
8. Lifecycle cascade reaches deep eventable nodes (connect/disconnect).

Keep tests deterministic—avoid time-based assertions; rely on counters or trace
arrays.

---

## 9. Recommended Patterns

- Use `update(this)` inside component event handlers to refresh just that
  component subtree.
- Prefer function-returning components (reactive roots) for dynamic list
  rendering and consolidated reactive logic.
- Bind subscribables via props; rely on eventable refresh rather than manual
  subscription micro-management.
- Use keys sparingly and consistently for stable reuse; avoid changing keys
  solely to force updates (consider explicit state changes instead).

---

## 10. Anti-Patterns

- Firing `update()` repeatedly on deeply nested children instead of a higher
  ancestor.
- Introducing side-effectful operations inside reactive generators without
  ensuring idempotence (generators can re-run).
- Using key churn (random keys) to force remount semantics for state
  resets—prefer explicit teardown logic or controlled reinitialization.
- Manually dispatching `"update"` events to nested component hosts under
  reactive parents—traversal exclusion prevents the need.

---

## 11. FAQ

**Q: Why not bubble `"update"` events?**\
Bubbling risks unordered evaluation and duplicate generator runs. Direct
dispatch gives deterministic top-down control.

**Q: Why exclude nested component hosts only under reactive ancestors?**\
Reactive ancestors re-run generators that logically wrap or touch component
hosts. Traversal updates would double their evaluation cost.

**Q: Are EVENTABLE elements ever excluded?**\
No. Lightweight subscription refresh must always occur.

**Q: Can I force inclusion of excluded nested component hosts for debugging?**\
You can temporarily remove the reactive parent flag or call `update(host)`
directly on the child component host for targeted inspection.

**Q: How do reused component hosts get updated if excluded from traversal?**\
Reconciliation directly dispatches a single `"update"` when props change (reuse
path).

---

## 12. Extensibility Guidelines

When adding new behavior or flags:

1. Maintain single-dispatch invariant per cycle.
2. Document any new traversal pruning rationale.
3. Avoid relying on fragile instance identity (`instanceof`)—continue tag/flag
   approach.
4. Provide dev-only diagnostics rather than altering core traversal semantics
   for debugging.

Potential future additions:

- Dev mode visualization overlay for included targets.
- Optional debug traversal that lists excluded component hosts.
- Memoized traversal shape cache for static subtrees (profile before
  implementing).

---

## 13. Summary

The flag-based traversal system delivers predictable, minimal `"update"` events:

- Compact bitmask storage.
- Pruning prevents duplicate component host evaluations.
- Reconciliation integrates cleanly with traversal semantics.
- Eventable propagation remains intact across complex nested reactive
  hierarchies.

Understanding these rules ensures performant, correct reactive component design
without subtle double-render pitfalls. Update this document as invariants
evolve, keeping explicit reasoning tied to flag usage and pruning logic.
