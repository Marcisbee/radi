import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { memo, update } from "../client.ts";

/**
 * These tests exercise memo() when used as a function-valued prop:
 *   <div data-foo={memo(...)} />
 *
 * Expectations:
 * - Initial render always evaluates the memo render function (skip ignored).
 * - Subsequent manual update(container) calls re-run the render function only
 *   when skipRender() returns false.
 * - When skipRender() returns true, the previously computed primitive value
 *   is retained (attribute / property unchanged).
 *
 * NOTE: Implementation detail: memo currently normalizes its output for children
 * as Node(s). For prop usage we rely on returning primitives directly; if the
 * implementation does not yet differentiate, these tests will surface a failure.
 */

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function counterMemo(skip: () => boolean) {
  let i = 0;
  return memo(() => i++, skip);
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                       */
/* -------------------------------------------------------------------------- */

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
