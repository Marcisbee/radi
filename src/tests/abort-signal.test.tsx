import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { createAbortSignal } from "../main.ts";

/**
 * Component that registers an abort listener tied to its lifecycle.
 */
function Abortable(this: HTMLElement, props: JSX.Props<{ label?: string }>) {
  const signal = createAbortSignal(this);
  signal.addEventListener("abort", () => {
    events.push(`${props().label || "abortable"}:aborted`);
  });
  return <div className="abortable">{props().label || "Abortable"}</div>;
}

// Shared events list for assertions within each test scope.
let events: string[] = [];

test.before.each(() => {
  events = [];
});

test("aborts on removal", async () => {
  const root = await mount(<Abortable />, document.body);
  assert.is(events.length, 0, "No abort before removal");

  // Remove component from DOM -> should trigger abort
  root.parentNode!.removeChild(root);

  // Allow mutation observer / microtasks to flush
  await Promise.resolve();

  assert.is(events.length, 1, "Abort fired exactly once");
  assert.is(events[0], "abortable:aborted");
});

test("single abort", async () => {
  const root = await mount(<Abortable label="multi" />, document.body);
  assert.is(events.length, 0);

  // First removal
  root.remove();
  await Promise.resolve();
  assert.is(events.length, 1);
  assert.is(events[0], "multi:aborted");

  // Attempt second removal (noop — already detached)
  root.remove();
  await Promise.resolve();
  assert.is(events.length, 1, "No duplicate abort events");
});

await test.run();
