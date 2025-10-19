import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

/**
 * Module-level immutable state object used by the Counter component.
 * Tests mutate by replacing the object reference to simulate state changes.
 */
let state: { value: number } = { value: 0 };

/**
 * Counter
 * Renders two buttons:
 * - Mutate: increments internal state immutably without triggering re-render.
 * - Update: triggers a re-render reflecting the latest immutable state.
 *
 * Reactive span displays current state value.
 * @param this Host HTMLElement.
 */
function Counter(this: HTMLElement) {
  return (
    <div className="counter">
      <span>{() => String(state.value)}</span>
      <button
        className="btn-mutate"
        onclick={() => {
          // Immutable replacement (no render until update called).
          state = { value: state.value + 1 };
        }}
      >
        Mutate
      </button>
      <button
        className="btn-update"
        onclick={() => {
          update(this);
        }}
      >
        Update
      </button>
    </div>
  );
}

/** Reset state before each test for isolation. */
test.before.each(() => {
  state = { value: 0 };
});

/** render */
test("render", async () => {
  const container = await mount(<Counter />, document.body);

  assert.snapshot.html(
    container,
    `<cmp-counter style="display: contents;">
      <div class="counter">
        <span><!--(-->0<!--)--></span>
        <button class="btn-mutate">Mutate</button>
        <button class="btn-update">Update</button>
      </div>
    </cmp-counter>`,
  );
});

/** mutate-no-update */
test("mutate-no-update", async () => {
  const container = await mount(<Counter />, document.body);
  const span = container.querySelector("span")!;
  const [btnMutate] = container.querySelectorAll("button");

  assert.equal(span.textContent, "0");
  (btnMutate as HTMLButtonElement).click();
  (btnMutate as HTMLButtonElement).click();

  // No update triggered yet → value unchanged.
  assert.equal(span.textContent, "0");
});

/** mutate-then-button-update */
test("mutate-then-button-update", async () => {
  const container = await mount(<Counter />, document.body);
  const span = container.querySelector("span")!;
  const [btnMutate, btnUpdate] = container.querySelectorAll("button");

  assert.equal(span.textContent, "0");
  (btnMutate as HTMLButtonElement).click();
  (btnMutate as HTMLButtonElement).click();
  (btnUpdate as HTMLButtonElement).click();

  assert.equal(span.textContent, "2");
});

/** mutate-then-container-update */
test("mutate-then-container-update", async () => {
  const container = await mount(<Counter />, document.body);
  const span = container.querySelector("span")!;
  const [btnMutate] = container.querySelectorAll("button");

  assert.equal(span.textContent, "0");
  (btnMutate as HTMLButtonElement).click();
  (btnMutate as HTMLButtonElement).click();

  update(container);

  assert.equal(span.textContent, "2");
});

/** manual-mutate-button-update */
test("manual-mutate-button-update", async () => {
  const container = await mount(<Counter />, document.body);
  const span = container.querySelector("span")!;
  const [, btnUpdate] = container.querySelectorAll("button");

  assert.equal(span.textContent, "0");
  state = { value: 2 };
  (btnUpdate as HTMLButtonElement).click();

  assert.equal(span.textContent, "2");
});

/** manual-mutate-container-update */
test("manual-mutate-container-update", async () => {
  const container = await mount(<Counter />, document.body);
  const span = container.querySelector("span")!;

  assert.equal(span.textContent, "0");
  state = { value: 2 };
  update(container);

  assert.equal(span.textContent, "2");
});

/** manual-mutate-span-update */
test("manual-mutate-span-update", async () => {
  const container = await mount(<Counter />, document.body);
  const span = container.querySelector("span")!;

  assert.equal(span.textContent, "0");
  state = { value: 2 };
  update(span);

  assert.equal(span.textContent, "2");
});

await test.run();
