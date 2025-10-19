import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { createSignal } from "../signal.ts";
import { update } from "../main.ts";

function ThresholdSignalTest(
  this: HTMLElement,
  props: JSX.Props<{ count: number; threshold?: number }>,
) {
  const p = props();
  const threshold = p.threshold ?? 3;
  const sig = createSignal(p.count);
  return (
    <button
      type="button"
      className="signal-btn"
      onclick={() => {
        if (sig() < threshold) {
          sig(sig() + 1);
        }
      }}
      disabled={() => sig() >= threshold}
    >
      Signal: {sig} / {threshold}
    </button>
  );
}

test("increments & disables", async () => {
  const root = await mount(<ThresholdSignalTest count={0} />, document.body);
  const btn = root.querySelector(".signal-btn") as HTMLButtonElement;

  assert.ok(btn.textContent!.includes("0 / 3"));
  assert.not.ok(btn.disabled);

  btn.click();
  assert.ok(btn.textContent!.includes("1 / 3"));
  assert.not.ok(btn.disabled);

  btn.click();
  assert.ok(btn.textContent!.includes("2 / 3"));
  assert.not.ok(btn.disabled);

  btn.click();
  assert.ok(btn.textContent!.includes("3 / 3"));
  assert.ok(btn.disabled, "Button disabled at threshold");
});

test("no increment after disable", async () => {
  const root = await mount(<ThresholdSignalTest count={2} />, document.body);
  const btn = root.querySelector(".signal-btn") as HTMLButtonElement;

  assert.ok(btn.textContent!.includes("2 / 3"));
  assert.not.ok(btn.disabled);

  // First click reaches threshold
  btn.click();
  assert.ok(btn.textContent!.includes("3 / 3"));
  assert.ok(btn.disabled);

  // Additional clicks should have no effect
  btn.click();
  btn.click();
  assert.ok(
    btn.textContent!.includes("3 / 3"),
    "Value should stay at threshold",
  );
  assert.ok(btn.disabled);
});

test("starts disabled when >= threshold", async () => {
  const root = await mount(
    <ThresholdSignalTest count={5} threshold={5} />,
    document.body,
  );
  const btn = root.querySelector(".signal-btn") as HTMLButtonElement;

  assert.ok(btn.textContent!.includes("5 / 5"));
  assert.ok(btn.disabled, "Starts disabled at or above threshold");

  // Attempt clicks should not change value
  btn.click();
  await Promise.resolve();
  assert.ok(btn.textContent!.includes("5 / 5"));
  assert.ok(btn.disabled);

  // Force update without change to ensure stability
  update(root);
  await Promise.resolve();
  assert.ok(btn.textContent!.includes("5 / 5"));
  assert.ok(btn.disabled);
});

await test.run();
