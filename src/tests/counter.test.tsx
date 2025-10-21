import { assert, test } from "jsr:@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

/**
 * Counter component and related tests.
 *
 * The component maintains an internal immutable state object:
 *   state = { count: number }
 * Each increment replaces the state object (immutability) and triggers an update.
 *
 * Tests:
 * - render: initial DOM structure snapshot.
 * - increment: clicking the increment button updates visible count.
 * - manual-update-no-change: forcing update without state modification keeps value.
 * - instances-isolated: multiple counters do not share state.
 * - no-duplicate-nodes: re-renders do not duplicate existing DOM nodes.
 */
function Counter(this: HTMLElement) {
  let state = { count: 0 };

  return (
    <div className="counter">
      <span>{() => String(state.count)}</span>
      <button
        className="btn-inc"
        onclick={() => {
          state = { count: state.count + 1 };
          update(this);
        }}
      >
        Increment
      </button>
    </div>
  );
}

test("render", async () => {
  const container = await mount(<Counter />, document.body);

  assert.snapshot.html(
    container,
    `<radi-host style="display: contents;">
      <div class="counter">
        <span><!--(-->0<!--)--></span>
        <button class="btn-inc">Increment</button>
      </div>
    </radi-host>`,
  );
});

test("increment", async () => {
  const container = await mount(<Counter />, document.body);
  const spanBefore = container.querySelector("span")!;
  assert.equal(spanBefore.textContent, "0");

  const button = container.querySelector(".btn-inc") as HTMLButtonElement;
  button.click();
  button.click();
  button.click();

  const spanAfter = container.querySelector("span")!;
  assert.equal(spanAfter.textContent, "3");
});

test("manual-update-no-change", async () => {
  const container = await mount(<Counter />, document.body);
  const span = container.querySelector("span")!;
  assert.is(span.textContent, "0");

  // Update without modifying state object reference.
  update(container);
  assert.is(span.textContent, "0");
});

test("instances-isolated", async () => {
  const container = await mount(
    <div>
      <Counter />
      <Counter />
    </div>,
    document.body,
  );

  const counters = container.querySelectorAll("radi-host");
  assert.is(counters.length, 2);

  const spans = container.querySelectorAll("span");
  assert.is(spans.length, 2);

  const buttons = container.querySelectorAll(".btn-inc");
  assert.is(buttons.length, 2);

  (buttons[0] as HTMLButtonElement).click();
  (buttons[0] as HTMLButtonElement).click();
  (buttons[1] as HTMLButtonElement).click();

  assert.is(spans[0].textContent, "2");
  assert.is(spans[1].textContent, "1");
});

test("no-duplicate-nodes", async () => {
  const container = await mount(<Counter />, document.body);

  assert.snapshot.html(
    container,
    `<radi-host style="display: contents;">
      <div class="counter">
        <span><!--(-->0<!--)--></span>
        <button class="btn-inc">Increment</button>
      </div>
    </radi-host>`,
  );

  const button = container.querySelector(".btn-inc") as HTMLButtonElement;
  const span = container.querySelector("span")!;
  button.click();
  button.click();

  assert.is(span.textContent, "2");
  assert.is(container.querySelectorAll("span").length, 1);
  assert.is(container.querySelectorAll("button").length, 1);

  assert.snapshot.html(
    container,
    `<radi-host style="display: contents;">
      <div class="counter">
        <span><!--(-->2<!--)--></span>
        <button class="btn-inc">Increment</button>
      </div>
    </radi-host>`,
  );
});

await test.run();
