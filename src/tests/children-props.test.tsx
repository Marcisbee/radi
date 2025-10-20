import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

/**
 * Simple component that echoes its children directly (static).
 */
function EchoStatic(this: HTMLElement, props: JSX.PropsWithChildren) {
  return <div className="echo-static">{props().children}</div>;
}

/**
 * Component that renders children via a reactive wrapper so updated props.children
 * are reflected when parent re-renders / updates component props.
 */
function EchoReactive(this: HTMLElement, props: JSX.PropsWithChildren) {
  return <div className="echo-reactive">{() => props().children}</div>;
}

/**
 * children-single
 * Verifies a single primitive child is passed and rendered.
 */
test("children-single", async () => {
  const root = await mount(<EchoStatic>hello</EchoStatic>, document.body);
  const div = root.querySelector(".echo-static")!;
  assert.is(div.textContent, "hello");
});

/**
 * children-multiple
 * Multiple heterogeneous children (text + elements) preserve order.
 */
test("children-multiple", async () => {
  const root = await mount(
    <EchoStatic>
      text-
      <span className="c1">A</span>
      <span className="c2">B</span>
      -end
    </EchoStatic>,
    document.body,
  );
  const div = root.querySelector(".echo-static")!;
  assert.snapshot.html(
    div,
    `<div class="echo-static">text-<span class="c1">A</span><span class="c2">B</span>-end</div>`,
  );
});

/**
 * children-fragment-nested
 * Children including nested fragments and arrays flatten correctly.
 */
test("children-fragment-nested", async () => {
  const fragmentChildren = [
    <span className="f1">X</span>,
    <>
      <span className="f2">Y</span>
      <span className="f3">Z</span>
    </>,
    ["rawA", <span className="f4">rawB</span>],
  ];
  const root = await mount(
    <EchoStatic>{fragmentChildren}</EchoStatic>,
    document.body,
  );
  const div = root.querySelector(".echo-static")!;
  assert.ok(div.innerHTML.includes("X"));
  assert.ok(div.innerHTML.includes("Y"));
  assert.ok(div.innerHTML.includes("Z"));
  assert.ok(div.innerHTML.includes("rawA"));
  assert.ok(div.innerHTML.includes("rawB"));
});

/**
 * DynamicParent
 * Provides changing children to EchoReactive via a reactive render function.
 */
function DynamicParent(this: HTMLElement) {
  let items = ["a", "b"];
  // Expose a way for the test to mutate items via element property
  (this as any).__setItems = (next: string[]) => {
    items = next.slice();
    update(this);
  };
  return () => (
    <EchoReactive>
      {items.map((v) => (
        <span className="dyn" data-key={v}>
          {v}
        </span>
      ))}
    </EchoReactive>
  );
}

/**
 * children-dynamic-update
 * Verifies children passed through props update when parent reactive function re-runs.
 */
test("children-dynamic-update", async () => {
  const root = await mount(<DynamicParent />, document.body);
  const echo = root.querySelector(".echo-reactive")!;
  const initial = Array.from(echo.querySelectorAll(".dyn")).map((n) =>
    n.textContent
  );
  assert.equal(initial, ["a", "b"]);

  // Mutate items via exposed setter and trigger update
  (root as any).__setItems(["b", "c", "d"]);

  const after = Array.from(echo.querySelectorAll(".dyn")).map((n) =>
    n.textContent
  );
  assert.equal(after, ["b", "c", "d"]);
});

/**
 * children-reactive-single-replacement
 * Replace all children with a single primitive value.
 */
test("children-reactive-single-replacement", async () => {
  const root = await mount(<DynamicParent />, document.body);
  const echo = root.querySelector(".echo-reactive")!;
  (root as any).__setItems(["only"]);
  const afterHTML = echo.innerHTML;
  assert.ok(/only/.test(afterHTML));
  assert.is(
    Array.from(echo.querySelectorAll(".dyn")).length,
    1,
  );
});

/**
 * children-reactive-empty
 * Clear children array → no .dyn spans remain.
 */
test("children-reactive-empty", async () => {
  const root = await mount(<DynamicParent />, document.body);
  const echo = root.querySelector(".echo-reactive")!;
  (root as any).__setItems([]);
  assert.is(Array.from(echo.querySelectorAll(".dyn")).length, 0);
});

await test.run();
