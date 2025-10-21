import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { createSignal } from "../signal.ts";
import { update } from "../main.ts";

/**
 * SignalThresholdTest
 *
 * A button component that internally tracks a numeric signal value. Clicking
 * the button increments the signal until a specified threshold is reached,
 * after which the button becomes disabled and further clicks do nothing.
 *
 * Props:
 * - count: number          Initial counter value.
 * - threshold?: number     Maximum allowed value before disabling (default: 3).
 *
 * Rendering:
 * The button text shows current signal value and threshold:
 *   "Signal: {value} / {threshold}"
 *
 * Disabled State:
 * The button is disabled when value >= threshold.
 *
 * @param this Host HTMLElement used for reactive updates.
 * @param props Reactive props accessor.
 */
function SignalThresholdTest(
  this: HTMLElement,
  props: JSX.Props<{ count: number; threshold?: number }>,
) {
  const propsAccessor = props();
  const maxThreshold = propsAccessor.threshold ?? 3;
  const countSignal = createSignal(propsAccessor.count);

  return (
    <button
      type="button"
      className="signal-btn"
      onclick={() => {
        if (countSignal() < maxThreshold) {
          countSignal(countSignal() + 1);
        }
      }}
      disabled={() => countSignal() >= maxThreshold}
    >
      Signal: {countSignal} / {maxThreshold}
    </button>
  );
}

/**
 * increments until disabled
 * Validates that the button increments value up to the threshold and then
 * becomes disabled, preventing further increments.
 */
test("increments until disabled", async () => {
  const rootEl = await mount(<SignalThresholdTest count={0} />, document.body);
  const buttonEl = rootEl.querySelector(".signal-btn") as HTMLButtonElement;

  assert.true(buttonEl.textContent!.includes("0 / 3"));
  assert.false(buttonEl.disabled);

  buttonEl.click();
  assert.true(buttonEl.textContent!.includes("1 / 3"));
  assert.false(buttonEl.disabled);

  buttonEl.click();
  assert.true(buttonEl.textContent!.includes("2 / 3"));
  assert.false(buttonEl.disabled);

  buttonEl.click();
  assert.true(buttonEl.textContent!.includes("3 / 3"));
  assert.true(buttonEl.disabled, "Button disabled at threshold");
});

/**
 * no increment after disabled
 * Starting near threshold, verifies that once disabled it does not change even
 * with additional clicks.
 */
test("no increment after disabled", async () => {
  const rootEl = await mount(<SignalThresholdTest count={2} />, document.body);
  const buttonEl = rootEl.querySelector(".signal-btn") as HTMLButtonElement;

  assert.true(buttonEl.textContent!.includes("2 / 3"));
  assert.false(buttonEl.disabled);

  buttonEl.click(); // reaches threshold
  assert.true(buttonEl.textContent!.includes("3 / 3"));
  assert.true(buttonEl.disabled);

  buttonEl.click();
  buttonEl.click();
  assert.true(
    buttonEl.textContent!.includes("3 / 3"),
    "Value should stay at threshold",
  );
  assert.true(buttonEl.disabled);
});

/**
 * starts disabled at threshold
 * If initial count is already >= threshold the button should render disabled
 * and remain stable across manual updates.
 */
test("starts disabled at threshold", async () => {
  const rootEl = await mount(
    <SignalThresholdTest count={5} threshold={5} />,
    document.body,
  );
  const buttonEl = rootEl.querySelector(".signal-btn") as HTMLButtonElement;

  assert.true(buttonEl.textContent!.includes("5 / 5"));
  assert.true(buttonEl.disabled);

  // Click attempts do nothing.
  buttonEl.click();
  await Promise.resolve();
  assert.true(buttonEl.textContent!.includes("5 / 5"));
  assert.true(buttonEl.disabled);

  // Force update without change; should remain identical.
  update(rootEl);
  await Promise.resolve();
  assert.true(buttonEl.textContent!.includes("5 / 5"));
  assert.true(buttonEl.disabled);
});

await test.run();
