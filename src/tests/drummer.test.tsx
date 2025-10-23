import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { createAbortSignal, update } from "../client.ts";

/**
 * Drummer component.
 *
 * Maintains immutable state object holding BPM value.
 * External custom events "bpm:increment" and "bpm:decrement" mutate BPM
 * via immutable replacement and trigger a re-render.
 *
 * An AbortSignal scoped to the component lifecycle automatically
 * unregisters event listeners when the component is removed from the DOM.
 *
 * Rendered text includes a stable random value captured on first mount to
 * verify that updates do not regenerate non-reactive values.
 *
 * @param this Host HTMLElement.
 */
function Drummer(this: HTMLElement) {
  let state = { bpm: 100 };
  const abortSignal = createAbortSignal(this);
  const randomSeed = Math.random();

  const increment = () => {
    state = { bpm: state.bpm + 1 };
    update(this);
  };

  const decrement = () => {
    state = { bpm: state.bpm - 1 };
    update(this);
  };

  this.addEventListener(
    "bpm:increment",
    () => {
      increment();
    },
    { signal: abortSignal },
  );

  this.addEventListener(
    "bpm:decrement",
    () => {
      decrement();
    },
    { signal: abortSignal },
  );

  return () => (
    <div className="drummer">
      BPM: {state.bpm} Random: <strong>{randomSeed}</strong>
    </div>
  );
}

/**
 * events update bpm
 * Verifies increment/decrement custom events update BPM immutably
 * while keeping the random seed stable across renders.
 */
test("events update bpm", async () => {
  const root = await mount(<Drummer />, document.body);
  const div = root.querySelector(".drummer")!;
  const initialText = div.textContent!;
  const match = /Random:\s*(\d\.\d+)/.exec(initialText);
  assert.exists(match);
  const seed = match![1];

  root.dispatchEvent(new CustomEvent("bpm:increment", { bubbles: true }));
  await Promise.resolve();
  assert.true(div.textContent!.includes("BPM: 101"));
  assert.true(div.textContent!.includes(seed));

  root.dispatchEvent(new CustomEvent("bpm:decrement", { bubbles: true }));
  root.dispatchEvent(new CustomEvent("bpm:decrement", { bubbles: true }));
  await Promise.resolve();
  assert.true(div.textContent!.includes("BPM: 99"));
  assert.true(div.textContent!.includes(seed));
});

/**
 * abort stops events
 * After removing the component, listeners bound with the abort signal
 * should be detached; further dispatched events must not change BPM.
 */
test("abort stops events", async () => {
  const root = await mount(<Drummer />, document.body);
  const div = root.querySelector(".drummer")!;
  assert.true(div.textContent!.includes("BPM: 100"));

  // Remove component -> abort listeners.
  root.remove();
  await Promise.resolve();

  // Dispatch events after removal (listeners should be gone).
  root.dispatchEvent(new CustomEvent("bpm:increment"));
  root.dispatchEvent(new CustomEvent("bpm:decrement"));
  await Promise.resolve();

  // BPM should remain unchanged.
  assert.true(div.textContent!.includes("BPM: 100"));
});

await test.run();
