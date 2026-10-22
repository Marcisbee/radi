import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { createList, createRoot, update } from "../client.ts";

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
function KeyedItem(props: JSX.Props<{ id: string }>) {
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
      {() =>
        createList((key) =>
          keys.map((k) => key(() => <KeyedItem id={k} />, k))
        )}
    </div>
  );
}

test("nested component under reactive parent single update per cycle", async () => {
  const root = await mount(<ParentReactive />, document.body);
  const childHost = root.querySelector("host") as HTMLElement;
  assert.true(!!childHost, "child host exists");

  let childUpdates = 0;
  childHost.addEventListener("update", () => childUpdates++);

  const text = () =>
    (childHost.querySelector(".child-count") as HTMLElement).textContent!;

  assert.equal(text(), "1");
  update(root);
  await Promise.resolve();
  assert.equal(childUpdates, 1);
  assert.equal(text(), "2");

  update(root);
  await Promise.resolve();
  assert.equal(childUpdates, 2);
  assert.equal(text(), "3");
});

test("nested component under non-reactive parent receives update via traversal", async () => {
  const root = await mount(<ParentNonReactive />, document.body);
  // ParentNonReactive returns plain div; child component host is first host inside root host.
  const childHost = root.querySelector("host") as HTMLElement;
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

test('descendant updates use a snapshot when listeners remove, move, and insert nodes', () => {
  const events: string[] = [];
  const first = <span title={() => 'first'} />;
  const removed = <span title={() => 'removed'} />;
  const moved = <span title={() => 'moved'} />;
  const inserted = <span title={() => 'inserted'} />;
  const container = <div>{first}{removed}{moved}</div>;
  const root = createRoot(document.body);
  root.render(container);
  for (const [name, node] of [
    ['first', first], ['removed', removed],
    ['moved', moved], ['inserted', inserted],
  ] as const) {
    node.addEventListener('update', () => events.push(name));
  }
  first.addEventListener('update', () => {
    removed.remove();
    container.prepend(moved);
    container.append(inserted);
  }, { once: true });

  update(container);
  assert.equal(events.join(','), 'first,moved');
  events.length = 0;
  update(container);
  assert.equal(events.join(','), 'moved,first,inserted');
  root.unmount();
});

test('unmount cleans subscriptions beneath static wrappers after a DOM move', () => {
  let subscriptions = 0;
  const store = {
    subscribe(listener: (value: string) => void) {
      subscriptions++;
      listener('value');
      return () => subscriptions--;
    },
  };
  const child = <span>{store}</span>;
  const left = <section>{child}</section>;
  const right = <section />;
  const root = createRoot(document.body);
  root.render(<div>{left}{right}</div>);
  right.append(child);
  assert.equal(subscriptions, 1);
  root.unmount();
  assert.equal(subscriptions, 0);
});

await test.run();
