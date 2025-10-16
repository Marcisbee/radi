import { assert, test } from "../test/runner.ts";
import { mount } from "../test/utils.ts";

import { Radi, update } from "./main.ts";

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

test("render counter component", async () => {
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

test("increment counter", async () => {
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

await test.run();
