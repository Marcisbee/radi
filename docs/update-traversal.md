# Update Traversal Semantics in Radi

This document explains how the framework traverses the DOM to deliver `"update"`
events. It covers:

- Core concepts (component hosts, reactive roots, eventable elements)
- The traversal algorithm and its invariants
- How duplication is prevented
- Edge cases
- Testing strategy
- Usage recommendations and anti-patterns

---

## Core Concepts

Radi distinguishes three categories of elements for update propagation:

1. Component Host A `<radi-host>` element created for a function component. It
   may or may not be a reactive root depending on the component’s return value
   (plain nodes vs a reactive generator function).

2. Reactive Root An element whose content is produced by a reactive generator
   (e.g. a function child, a component that returns a function, a
   function-valued prop). Marked internally with `__reactiveRoot = true` and
   subscribed to `"update"`.

3. Eventable Element An element with reactive subscriptions (e.g. subscribables
   bound via props) that must receive `"update"` to refresh derived state.
   Marked with `__reactiveEvent = true`.

The traversal selectively includes elements from these categories while
preventing duplicate dispatches to nested component hosts under a reactive
parent.

---

## Goals of the Traversal

1. Deliver exactly one `"update"` event per eligible element per manual update
   cycle (`update(node)`).
2. Avoid cascading duplicate updates to component hosts that are already
   refreshed implicitly during their parent’s reactive reconciliation.
3. Preserve propagation when parents are structural (non-reactive) so nested
   component hosts still receive updates.
4. Maintain correctness for key-based reuse and remount semantics.

---

## High-Level Behavior

Calling `update(rootNode)` performs:

- Increment of a global dispatch id (used elsewhere for potential dedupe).
- A single pre-order DOM walk starting at `rootNode`.
- Inclusion of:
  - The root component host (if it is a component).
  - Any reactive root (unless excluded—see below).
  - Any element marked eventable.
  - Nested component hosts only when NOT under a reactive ancestor.
- Exclusion of nested component hosts that sit beneath any reactive root
  ancestor (including if the root itself is reactive) to prevent
  double-dispatch.
- Independent component host reuse logic (during reconciliation) triggers a
  single `"update"` for reused hosts whose props changed when invoked via a
  render cycle.

---

## Why Duplicates Happen (and the Fix)

Previously, nested component hosts inside an updating reactive parent could
receive:

1. An `"update"` from the manual traversal.
2. A second `"update"` from the reconciliation reuse path
   (`canReuseComponentHost`).

This manifested as counters incrementing twice (e.g. `renders:1 -> renders:3`
instead of `renders:2`) and failing tests like `key-flip-remounts` and nested
reactive cases.

The fix:

- Track reactive ancestor presence via a stack during traversal.
- If an element is a component host and there is any reactive ancestor (root or
  deeper), exclude it from the traversal list.
- Rely on the reuse dispatch or remount behavior to trigger its single reactive
  update.

---

## Inclusion & Exclusion Rules (Formalized)

Let:

- `R` = element is a reactive root (`__reactiveRoot`).
- `C` = element is a component host (`__radiHost` or tag `RADI-HOST`).
- `E` = element is eventable (`__reactiveEvent`).
- `A` = we are inside any reactive ancestor (stack non-empty), excluding or
  including root depending on its reactive state (current implementation counts
  root if reactive).

For `update(root)`:

Include element `el` if:

- `(C && el === root)` OR
- `(C && !A)` OR
- `R` (and not excluded by nested component rule) OR
- `E`

Exclude if:

- `C && A && el !== root` (nested component under a reactive ancestor)

Skip descending into children of any reactive root during update (to reduce
unnecessary traversal depth and avoid entering subtrees that would only produce
excluded nested component hosts).

---

## Effects on Typical Structures

1. Reactive Parent Hosting Plain Children All direct reactive elements and
   eventable descendants receive updates; no exclusions.

2. Reactive Parent Hosting Nested Components Parent receives update; nested
   component hosts are excluded from traversal and updated via reuse dispatch
   (if props change) or remain stable otherwise.

3. Non-Reactive Parent Hosting Component Children Traversal includes the nested
   component hosts (they are not under a reactive ancestor), so they directly
   receive `"update"`.

4. Deep Reactive Chain (Reactive → Reactive → Component) Only the top reactive
   root is traversed; intermediate reactive roots are skipped for descent;
   nested component hosts are excluded to prevent duplication.

---

## Remount vs Reuse

- Reuse occurs when keys and component identity match. Props are updated in
  place, and a single `"update"` event is dispatched directly to the reused host
  (not from traversal if nested under a reactive ancestor).
- Remount occurs when the key changes or type differs; the old host disconnects,
  new host connects, and the component function rebuilds state from scratch.

Implication:

- Nested components with stable keys under reactive parents behave predictably
  (single update per cycle).
- Key changes still force remount resetting counters.

---

## Testing Strategy

Added (or should add) dedicated tests for:

1. Nested component under reactive ancestor receives exactly one update per
   manual cycle.
2. Nested component under non-reactive ancestor receives update directly via
   traversal.
3. Component remount on key flip resets internal counters.
4. Reactive + nested reactive child (double reactive) does not duplicate
   side-effects (e.g. trace push).
5. Update propagation into eventable non-reactive elements (subscribable
   bindings) remains intact.

These tests isolate failure modes introduced by traversal changes and guard
against regressions.

---

## Recommended Patterns

- Use `update(this)` inside component event handlers to refresh that component
  subtree.
- Prefer function-returning components (reactive roots) when the component
  manages internal dynamic lists or nested reactive content.
- Avoid manually dispatching `"update"` to nested component hosts—let traversal
  and reuse logic handle it.

---

## Anti-Patterns to Avoid

- Calling `update()` on a deeply nested child repeatedly in rapid succession
  when a higher-level update would suffice; this can lead to unnecessary work.
- Depending on multiple side-effectful reactive generators within a single node
  hierarchy for cumulative effects (e.g. pushing into arrays) without guarding
  against double invocation—ensure idempotency or rely on the traversal
  guarantees.

---

## Future Considerations

Potential improvements:

- Configurable traversal mode (e.g. include nested component hosts explicitly
  for debugging).
- Dev-only diagnostics flag to visualize the update inclusion set.
- Performance optimization: caching last traversal shape for unchanged subtree
  roots.
- More explicit `UpdatePhase` markers to separate render-triggered update
  dispatch from manual update cycles instead of using a boolean flag.

---

## FAQ

Q: Why not bubble `"update"` events? A: Bubbling would introduce ordering
ambiguity and potential duplicate evaluations in nested reactive roots. Direct
dispatch preserves deterministic evaluation.

Q: Why exclude nested component hosts only under reactive ancestors? A: Reactive
ancestors rerun a generator that virtually represents or touches the child
component host. Dispatching traversal updates to that child host would double
its reactive evaluation.

Q: Do eventable elements (`__reactiveEvent`) ever get excluded? A: No. They are
lightweight subscribers and exclusion would break expected propagation semantics
for prop-bound subscribables.

---

## Practical Example (Described)

Structure:

- Root component host (reactive root) returns a list of keyed child component
  hosts.
- Manual `update(root)`:
  - Traversal includes only the root host.
  - Reconciliation reuses each keyed child host and dispatches exactly one
    `"update"` to each.
  - No duplicates, stable ordering guarantees preserved.

Contrast:

- Non-reactive parent `<div>` containing two component hosts.
  - Manual `update(div)` includes both nested component hosts directly; no reuse
    dispatch duplication.

---

## Conclusion

The current traversal design balances correctness (single evaluation per update
cycle) with flexibility (propagation through structural parents). Understanding
these semantics helps avoid subtle state inconsistencies and supports writing
predictable reactive components.

If you extend the lifecycle system, ensure new behaviors uphold:

1. Single dispatch per node per cycle.
2. Clear separation of render vs manual update triggers.
3. No reliance on fragile identity checks (`instanceof`) across bundling
   boundaries.

Feel free to amend this document as the system evolves.
