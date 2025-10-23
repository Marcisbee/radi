import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { update } from "../client.ts";

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
  assert.equal(div.textContent, "hello");
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
  assert.true(div.innerHTML.includes("X"));
  assert.true(div.innerHTML.includes("Y"));
  assert.true(div.innerHTML.includes("Z"));
  assert.true(div.innerHTML.includes("rawA"));
  assert.true(div.innerHTML.includes("rawB"));
});

/**
 * DynamicParent
 * Provides changing children to EchoReactive via a reactive render function.
 */
function DynamicParent(this: HTMLElement) {
  let items = ["a", "b"];
  (this as any).__setItems = (next: string[]) => {
    items = next.slice();
    update(this);
  };
  return () => (
    <EchoReactive>
      {items.map((v) => (
        <span className="dyn" key={v}>
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
  assert.deepEqual(initial, ["a", "b"]);
  (root as any).__setItems(["b", "c", "d"]);
  const after = Array.from(echo.querySelectorAll(".dyn")).map((n) =>
    n.textContent
  );
  assert.deepEqual(after, ["b", "c", "d"]);
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
  assert.match(afterHTML, /only/);
  assert.length(Array.from(echo.querySelectorAll(".dyn")), 1);
});

/**
 * children-reactive-empty
 * Clear children array → no .dyn spans remain.
 */
test("children-reactive-empty", async () => {
  const root = await mount(<DynamicParent />, document.body);
  const echo = root.querySelector(".echo-reactive")!;
  (root as any).__setItems([]);
  assert.length(Array.from(echo.querySelectorAll(".dyn")), 0);
});

/* deeper coverage: children keyed reorder stability */
test("children-reactive-keyed-reorder", async () => {
  const root = await mount(<DynamicParent />, document.body);
  const echo = root.querySelector(".echo-reactive")!;
  (root as any).__setItems(["a", "b", "c"]);
  const before = Array.from(echo.querySelectorAll(".dyn")).map((n) =>
    n.textContent
  );
  assert.deepEqual(before, ["a", "b", "c"]);
  (root as any).__setItems(["c", "a"]);
  const after = Array.from(echo.querySelectorAll(".dyn")).map((n) =>
    n.textContent
  );
  assert.deepEqual(after, ["c", "a"]);
  assert.length(Array.from(echo.querySelectorAll(".dyn")), 2);
});

/* component that evaluates function children each update */
function ExecEchoReactive(this: HTMLElement, props: JSX.PropsWithChildren) {
  return (
    <div className="echo-exec">
      {props().children}
    </div>
  );
}

/* function child passed directly and updated */
function FnChildParent(this: HTMLElement) {
  let value = "fn";
  (this as any).__setValue = (next: string) => {
    value = next;
    update(this);
  };
  return <ExecEchoReactive>{() => value}</ExecEchoReactive>;
}

test("children-function-child-updates", async () => {
  const root = await mount(<FnChildParent />, document.body);
  // Allow initial reactive render microtasks to flush
  await Promise.resolve();
  const echo = root.querySelector(".echo-exec")!;
  assert.match(echo.textContent!, /fn/);
  (root as any).__setValue("fn2");
  // Flush microtasks + a macrotask for updated reactive evaluation
  await Promise.resolve();
  assert.match(echo.textContent!, /fn2/);
});

/* component that evaluates function children each update */
function ExecEchoReactiveReactive(
  this: HTMLElement,
  props: JSX.PropsWithChildren,
) {
  return (
    <div className="echo-exec">
      {() => props().children}
    </div>
  );
}

/* function child passed directly and updated */
function FnChildParentReactive(this: HTMLElement) {
  let value = "fn";
  (this as any).__setValue = (next: string) => {
    value = next;
    update(this);
  };
  return <ExecEchoReactiveReactive>{() => value}</ExecEchoReactiveReactive>;
}

test("children-function-child-updates-reactive", async () => {
  const root = await mount(<FnChildParentReactive />, document.body);
  // Allow initial reactive render microtasks to flush
  await Promise.resolve();
  const echo = root.querySelector(".echo-exec")!;
  assert.match(echo.textContent!, /fn/);
  (root as any).__setValue("fn2");
  // Flush microtasks + a macrotask for updated reactive evaluation
  await Promise.resolve();
  assert.match(echo.textContent!, /fn2/);
});

/* nested fragment with reactive generator inside children */
function NestedReactiveFragments(this: HTMLElement) {
  let toggle = true;
  (this as any).__flip = () => {
    toggle = !toggle;
    update(this);
  };
  return () => (
    <EchoReactive>
      <>
        <span className="nr-a">{toggle ? "A" : "A2"}</span>
        <>
          <span className="nr-b">{() => (toggle ? "B" : "B2")}</span>
          {toggle ? <span className="nr-c">C</span> : null}
        </>
      </>
    </EchoReactive>
  );
}

test("children-nested-reactive-fragment-update", async () => {
  const root = await mount(<NestedReactiveFragments />, document.body);
  const echo = root.querySelector(".echo-reactive")!;
  assert.match(echo.innerHTML, /A/);
  assert.match(echo.innerHTML, /B/);
  assert.match(echo.innerHTML, /C/);
  (root as any).__flip();
  assert.match(echo.innerHTML, /A2/);
  assert.match(echo.innerHTML, /B2/);
  assert.false(/C<\/span>/.test(echo.innerHTML));
});

/* removal to null children boundary check */
function NullifyChildren(this: HTMLElement) {
  let show = true;
  (this as any).__toggle = () => {
    show = !show;
    update(this);
  };
  return () => (
    <EchoReactive>
      {show ? <span className="alive">live</span> : null}
    </EchoReactive>
  );
}

test("children-null-removal", async () => {
  const root = await mount(<NullifyChildren />, document.body);
  const echo = root.querySelector(".echo-reactive")!;
  assert.true(echo.innerHTML.includes("live"));
  (root as any).__toggle();
  assert.excludes(echo.innerHTML, "live");
});

/* nested dynamic lists with key churn */
function KeyChurn(this: HTMLElement) {
  let outer = ["x", "y"];
  let inner = ["i1", "i2", "i3"];
  (this as any).__mutate = (o: string[], i: string[]) => {
    outer = o.slice();
    inner = i.slice();
    update(this);
  };
  return () => (
    <EchoReactive>
      {outer.map((o) => (
        <div className="outer" key={o}>
          {inner.map((i) => (
            <span className="inner" key={i}>
              {o}-{i}
            </span>
          ))}
        </div>
      ))}
    </EchoReactive>
  );
}

test("children-nested-key-churn", async () => {
  const root = await mount(<KeyChurn />, document.body);
  const echo = root.querySelector(".echo-reactive")!;
  assert.length(Array.from(echo.querySelectorAll(".outer")), 2);
  assert.length(Array.from(echo.querySelectorAll(".inner")), 6);
  (root as any).__mutate(["y", "z"], ["i2", "i4"]);
  assert.length(Array.from(echo.querySelectorAll(".outer")), 2);
  assert.length(Array.from(echo.querySelectorAll(".inner")), 4);
  const combos = Array.from(echo.querySelectorAll(".inner")).map((n) =>
    n.textContent
  );
  assert.contains(combos, "y-i2");
  assert.contains(combos, "z-i4");
});

await test.run();
