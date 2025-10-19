import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { createAbortSignal } from "../main.ts";

/**
 * Abortable component registers an abort event listener bound to its lifecycle.
 * When the hosting element is removed from the DOM, the underlying `AbortSignal`
 * dispatches an "abort" event which we capture and log via the shared `events` array.
 *
 * Props:
 * - label?: string - optional label used to namespace the logged event.
 *
 * The component returns a simple div so that tests can mount / remove it.
 */
function Abortable(this: HTMLElement, props: JSX.Props<{ label?: string }>) {
  const signal = createAbortSignal(this);
  const labelAccessor = () => props().label ?? "abortable";

  signal.addEventListener("abort", () => {
    // Immutable append for clarity.
    events = [...events, `${labelAccessor()}:aborted`];
  });

  return <div className="abortable">{labelAccessor()}</div>;
}

/** Shared events list for assertions; reset before each test. */
let events: string[] = [];

test.before.each(() => {
  events = [];
});

/**
 * abort on removal
 * Mount component, remove from DOM, expect exactly one abort event.
 */
test("abort on removal", async () => {
  const root = await mount(<Abortable />, document.body);
  assert.is(events.length, 0, "No abort before removal");

  // Remove component from DOM -> should trigger abort.
  root.parentNode!.removeChild(root);

  // Allow microtasks to flush (mutation observers, etc.)
  await Promise.resolve();

  assert.is(events.length, 1, "Abort fired exactly once");
  assert.is(events[0], "abortable:aborted");
});

/**
 * single abort event
 * Removing an already removed element should not produce a second abort.
 */
test("single abort event", async () => {
  const root = await mount(<Abortable label="multi" />, document.body);
  assert.is(events.length, 0);

  // First removal.
  root.remove();
  await Promise.resolve();
  assert.is(events.length, 1);
  assert.is(events[0], "multi:aborted");

  // Second removal (noop).
  root.remove();
  await Promise.resolve();
  assert.is(events.length, 1, "No duplicate abort events");
});

await test.run();
