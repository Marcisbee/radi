import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";

import { update } from "../main.ts";

function Counter(this: HTMLElement) {
  let count = 0;

  return (
    <div>
      <span>{() => String(count)}</span>
      <button
        onclick={() => {
          count++;
          update(this);
        }}
      >
        Increment
      </button>
    </div>
  );
}

test("renders component", async () => {
  const container = await mount(<Counter />, document.body);

  assert.snapshot.html(
    container,
    `<cmp-counter style="display: contents;">
      <div>
        <span><!--(-->0<!--)--></span>
        <button>Increment</button>
      </div>
    </cmp-counter>`,
  );
});

test("increments counter", async () => {
  const container = await mount(<Counter />, document.body);

  const span1 = container.querySelector("span")!;
  assert.equal(span1.textContent, "0");

  const button = container.querySelector("button")!;
  button.click();
  button.click();
  button.click();

  const span2 = container.querySelector("span")!;
  assert.equal(span2.textContent, "3");
});

test("manual update without state change keeps value", async () => {
  const container = await mount(<Counter />, document.body);
  const span = container.querySelector("span")!;
  assert.is(span.textContent, "0");
  // Trigger an update without modifying state
  update(container);
  assert.is(span.textContent, "0");
});

test("multiple counter instances isolated", async () => {
  const container = await mount(
    <div>
      <Counter />
      <Counter />
    </div>,
    document.body,
  );

  const counters = container.querySelectorAll("cmp-counter");
  assert.is(counters.length, 2);

  const spans = container.querySelectorAll("span");
  assert.is(spans.length, 2);

  const buttons = container.querySelectorAll("button");
  assert.is(buttons.length, 2);

  // Interact with each counter independently
  buttons[0].click();
  buttons[0].click();
  buttons[1].click();

  assert.is(spans[0].textContent, "2");
  assert.is(spans[1].textContent, "1");
});

test("counter re-renders without duplicating nodes", async () => {
  const container = await mount(<Counter />, document.body);

  // Initial structure snapshot
  assert.snapshot.html(
    container,
    `<cmp-counter style="display: contents;">
      <div>
        <span><!--(-->0<!--)--></span>
        <button>Increment</button>
      </div>
    </cmp-counter>`,
  );

  const button = container.querySelector("button")!;
  const span = container.querySelector("span")!;
  button.click();
  button.click();

  assert.is(span.textContent, "2");

  // Structure should remain the same except for the updated number
  assert.is(container.querySelectorAll("span").length, 1);
  assert.is(container.querySelectorAll("button").length, 1);

  assert.snapshot.html(
    container,
    `<cmp-counter style="display: contents;">
      <div>
        <span><!--(-->2<!--)--></span>
        <button>Increment</button>
      </div>
    </cmp-counter>`,
  );
});

await test.run();
