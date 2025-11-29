import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { memo, update } from "../client.ts";

function counterMemo(skip: () => boolean) {
  let i = 0;
  return memo(() => i++, skip);
}

test("memo prop primitive - always re-renders when skip=false", async () => {
  const count = counterMemo(() => false);

  function App() {
    return <div data-count={count} />;
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div")!;

  assert.equal(el.getAttribute("data-count"), "0");

  update(container);
  assert.equal(el.getAttribute("data-count"), "1");

  update(container);
  assert.equal(el.getAttribute("data-count"), "2");
});

test("memo prop primitive - skips when skip=true", async () => {
  const count = counterMemo(() => true);

  function App() {
    return <div data-count={count} />;
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div")!;

  // Initial render always happens
  assert.equal(el.getAttribute("data-count"), "0");

  update(container);
  assert.equal(el.getAttribute("data-count"), "0");

  update(container);
  assert.equal(el.getAttribute("data-count"), "0");
});

test("memo prop primitive - mixed skip behavior", async () => {
  const a = counterMemo(() => false); // updates each cycle
  const b = counterMemo(() => true); // only initial

  function App() {
    return <div data-a={a} data-b={b} />;
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div")!;

  assert.equal(el.getAttribute("data-a"), "0");
  assert.equal(el.getAttribute("data-b"), "0");

  update(container);
  assert.equal(el.getAttribute("data-a"), "1");
  assert.equal(el.getAttribute("data-b"), "0");

  update(container);
  assert.equal(el.getAttribute("data-a"), "2");
  assert.equal(el.getAttribute("data-b"), "0");
});

test("memo prop primitive alongside memo child", async () => {
  let childI = 0;
  const propCount = counterMemo(() => false);
  const childCount = memo(() => childI++, () => false);

  function App() {
    return (
      <div data-prop={propCount}>
        Child:{childCount}
      </div>
    );
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div")!;

  assert.equal(el.getAttribute("data-prop"), "0");
  assert.match(el.textContent || "", /Child:0/);

  update(container);
  assert.equal(el.getAttribute("data-prop"), "1");
  assert.match(el.textContent || "", /Child:1/);

  update(container);
  assert.equal(el.getAttribute("data-prop"), "2");
  assert.match(el.textContent || "", /Child:2/);
});

test("memo prop skip mixed with non-memo reactive prop", async () => {
  let raw = 0;
  const memoCount = counterMemo(() => true); // stays at initial 0

  function App() {
    return <div data-memo={memoCount} data-raw={() => raw++} />;
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div")!;

  assert.equal(el.getAttribute("data-memo"), "0");
  assert.equal(el.getAttribute("data-raw"), "0");

  update(container);
  assert.equal(el.getAttribute("data-memo"), "0");
  assert.equal(el.getAttribute("data-raw"), "1");

  update(container);
  assert.equal(el.getAttribute("data-memo"), "0");
  assert.equal(el.getAttribute("data-raw"), "2");
});

await test.run();
