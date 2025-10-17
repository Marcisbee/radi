import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";

import { createElement, Fragment, update } from "../main.ts";

let count = 0;
function Counter(this: HTMLElement) {
  return (
    <div>
      <span>{() => String(count)}</span>
      <button
        onclick={() => {
          count++;
        }}
      >
        Mutate
      </button>
      <button
        onclick={() => {
          update(this);
        }}
      >
        Update
      </button>
    </div>
  );
}

test.before.each(() => {
  count = 0;
});

test("render component", async () => {
  const container = await mount(<Counter />, document.body);

  assert.snapshot.html(
    container,
    `<cmp-counter style="display: contents;">
      <div>
        <span><!--(-->0<!--)--></span>
        <button>Mutate</button>
        <button>Update</button>
      </div>
    </cmp-counter>`,
  );
});

test("button mutate, no update", async () => {
  const container = await mount(<Counter />, document.body);

  const span1 = container.querySelector("span")!;
  assert.equal(span1.textContent, "0");

  const [buttonMutate, buttonUpdate] = container.querySelectorAll("button")!;
  buttonMutate.click();
  buttonMutate.click();

  const span2 = container.querySelector("span")!;
  assert.equal(span2.textContent, "0");
});

test("button mutate, button update", async () => {
  const container = await mount(<Counter />, document.body);

  const span1 = container.querySelector("span")!;
  assert.equal(span1.textContent, "0");

  const [buttonMutate, buttonUpdate] = container.querySelectorAll("button")!;
  buttonMutate.click();
  buttonMutate.click();

  buttonUpdate.click();

  const span2 = container.querySelector("span")!;
  assert.equal(span2.textContent, "2");
});

test("button mutate, manual update container", async () => {
  const container = await mount(<Counter />, document.body);

  const span1 = container.querySelector("span")!;
  assert.equal(span1.textContent, "0");

  const [buttonMutate] = container.querySelectorAll("button")!;
  buttonMutate.click();
  buttonMutate.click();

  update(container);

  const span2 = container.querySelector("span")!;
  assert.equal(span2.textContent, "2");
});

test("manual mutate, button update", async () => {
  const container = await mount(<Counter />, document.body);

  const span1 = container.querySelector("span")!;
  assert.equal(span1.textContent, "0");

  const [buttonMutate, buttonUpdate] = container.querySelectorAll("button")!;
  count = 2;
  buttonUpdate.click();

  const span2 = container.querySelector("span")!;
  assert.equal(span2.textContent, "2");
});

test("manual mutate, manual update container", async () => {
  const container = await mount(<Counter />, document.body);

  const span1 = container.querySelector("span")!;
  assert.equal(span1.textContent, "0");

  count = 2;
  update(container);

  const span2 = container.querySelector("span")!;
  assert.equal(span2.textContent, "2");
});

test("manual mutate, manual update span", async () => {
  const container = await mount(<Counter />, document.body);

  const span1 = container.querySelector("span")!;
  assert.equal(span1.textContent, "0");

  count = 2;
  update(span1);

  const span2 = container.querySelector("span")!;
  assert.equal(span2.textContent, "2");
});

await test.run();
