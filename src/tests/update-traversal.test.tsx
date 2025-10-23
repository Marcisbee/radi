import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { update } from "../client.ts";

/**
 * Child component with reactive render counter.
 */
function Child() {
  let renders = 0;
  return () => <div className="child-count">{++renders}</div>;
}

/**
 * Reactive parent (returns a function) hosting a child component.
 * Child should receive exactly one update per manual cycle (no duplication).
 */
function ParentReactive(this: HTMLElement) {
  return () => (
    <div className="reactive-parent">
      <Child />
    </div>
  );
}

/**
 * Non-reactive parent (returns plain DOM) hosting a child component.
 * Traversal must propagate update events to nested component host directly.
 */
function ParentNonReactive(this: HTMLElement) {
  return (
    <div className="non-reactive-parent">
      <Child />
    </div>
  );
}

/**
 * Keyed item component used to verify no double updates under a reactive parent list.
 */
function KeyedItem(props: JSX.Props<{ id: string; key?: string }>) {
  let renders = 0;
  return () => <span className="keyed-item">{props().id}:{++renders}</span>;
}

/**
 * Reactive list parent producing keyed child component hosts.
 * Manual update should increment each child's counter by exactly 1.
 */
function ReactiveList(this: HTMLElement) {
  const keys = ["a", "b", "c"];
  return () => (
    <div className="reactive-list">
      {keys.map((k) => <KeyedItem key={k} id={k} />)}
    </div>
  );
}

test("nested component under reactive parent single update per cycle", async () => {
  const root = await mount(<ParentReactive />, document.body);
  const childHost = root.querySelector("radi-host radi-host") as HTMLElement;
  assert.true(!!childHost, "child host exists");

  let childUpdates = 0;
  childHost.addEventListener("update", () => childUpdates++);

  const text = () =>
    (childHost.querySelector(".child-count") as HTMLElement).textContent!;

  assert.equal(text(), "1", "initial render count 1");
  update(root);
  await Promise.resolve();
  assert.equal(childUpdates, 1, "one update event dispatched");
  assert.equal(text(), "2", "render count incremented once");

  update(root);
  await Promise.resolve();
  assert.equal(childUpdates, 2, "second update event dispatched");
  assert.equal(text(), "3", "render count incremented once again (no double)");
});

test("nested component under non-reactive parent receives update via traversal", async () => {
  const root = await mount(<ParentNonReactive />, document.body);
  // ParentNonReactive returns plain div; child component host is first radi-host inside root host.
  const childHost = root.querySelector("radi-host radi-host") as HTMLElement;
  assert.true(!!childHost, "child host exists");

  let received = 0;
  childHost.addEventListener("update", () => received++);

  const text = () =>
    (childHost.querySelector(".child-count") as HTMLElement).textContent!;

  assert.equal(text(), "1", "initial child render");
  update(root);
  await Promise.resolve();
  assert.equal(
    received,
    1,
    "child got update from non-reactive parent traversal",
  );
  assert.equal(text(), "2", "child re-rendered exactly once");

  update(root);
  await Promise.resolve();
  assert.equal(received, 2, "child got second update");
  assert.equal(text(), "3", "child re-rendered exactly once again");
});

test("reactive parent with keyed children increments each exactly once per manual update", async () => {
  const root = await mount(<ReactiveList />, document.body);

  const items = () =>
    Array.from(root.querySelectorAll(".keyed-item")) as HTMLElement[];

  // Initial renders should all be 1
  for (const el of items()) {
    const [id, count] = el.textContent!.split(":");
    assert.equal(count, "1", "initial render count = 1 for " + id);
  }

  update(root);
  await Promise.resolve();
  for (const el of items()) {
    const [id, count] = el.textContent!.split(":");
    assert.equal(count, "2", "after first update count = 2 for " + id);
  }

  update(root);
  await Promise.resolve();
  for (const el of items()) {
    const [id, count] = el.textContent!.split(":");
    assert.equal(count, "3", "after second update count = 3 for " + id);
  }
});

await test.run();
