import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { createRoot, update } from "../client.ts";

/**
 * Simple store factory returning a subscribable with:
 * - subscribe(fn) => cleanup variants
 * - set(value) to emit
 * Counts unsubscriptions for verification.
 */
function createStore<T>(
  initial: T,
  emitInitial: boolean,
) {
  let current = initial;
  const subs = new Set<(v: T) => void>();
  let unsubscribedCount = 0;
  const subscribe = (fn: (value: T) => void) => {
    subs.add(fn);
    if (emitInitial) fn(current);
    return {
      unsubscribe() {
        if (subs.delete(fn)) unsubscribedCount++;
      },
    };
  };
  return {
    subscribe,
    set(value: T) {
      current = value;
      for (const s of subs) s(current);
    },
    get value() {
      return current;
    },
    get unsubscribedCount() {
      return unsubscribedCount;
    },
  };
}

/* ========================= Tests ========================= */

test("prop-store-initial-sync", async () => {
  const titleStore = createStore("Hello", true);

  function App() {
    return <div id="host" title={titleStore}>x</div>;
  }

  const root = await mount(<App />, document.body);
  const div = root.querySelector("#host") as HTMLDivElement;

  assert.equal(div.title, "Hello");
});

test("prop-store-subsequent-update", async () => {
  const dataStore = createStore("one", true);

  function App() {
    return <span id="host" data-value={dataStore}>y</span>;
  }

  const root = await mount(<App />, document.body);
  const span = root.querySelector("#host") as HTMLSpanElement;
  assert.equal(span.getAttribute("data-value"), "one");

  dataStore.set("two");
  assert.equal(span.getAttribute("data-value"), "two");

  dataStore.set("three");
  assert.equal(span.getAttribute("data-value"), "three");
});

test("prop-store-no-initial-emission", async () => {
  const lateStore = createStore("latent", false);

  function App() {
    return <div id="host" data-mode={lateStore}>z</div>;
  }

  const root = await mount(<App />, document.body);
  const div = root.querySelector("#host") as HTMLDivElement;

  // No initial emission -> attribute absent
  assert.equal(div.getAttribute("data-mode"), null);

  lateStore.set("latent");
  assert.equal(div.getAttribute("data-mode"), "latent");

  lateStore.set("active");
  assert.equal(div.getAttribute("data-mode"), "active");
});

test("prop-store-unsubscribe-function-cleanup", async () => {
  let store = "A";
  const store1 = createStore("A", true);
  const store2 = createStore("B", true);

  function App() {
    return () => (
      <div id="host" data-x={store === "A" ? store1 : store2}>
        c
      </div>
    );
  }

  const root = createRoot(document.body);
  const host = root.render(<App />);
  await Promise.resolve();
  assert.equal(store1.unsubscribedCount, 0);

  store = "B";
  update(host);
  await Promise.resolve();
  assert.equal(store1.unsubscribedCount, 1);
});

test("prop-store-unsubscribe-object-cleanup", async () => {
  const store = createStore("B", true);

  function App() {
    return <div id="host" data-y={store}>d</div>;
  }

  const root = createRoot(document.body);
  root.render(<App />);
  await Promise.resolve();
  assert.equal(store.unsubscribedCount, 0);

  root.unmount();
  await Promise.resolve();
  assert.equal(store.unsubscribedCount, 1);
});

test("prop-store-updates-property-field", async () => {
  // Using 'value' prop on input element which is a direct property assignment path.
  const valueStore = createStore("first", true);

  function App() {
    return <input id="inp" value={valueStore} />;
  }

  const root = await mount(<App />, document.body);
  const input = root.querySelector("#inp") as HTMLInputElement;
  assert.equal(input.value, "first");

  valueStore.set("second");
  assert.equal(input.value, "second");

  valueStore.set("third");
  assert.equal(input.value, "third");
});

test("prop-store-boolean-attribute-presence", async () => {
  // Use a boolean transformation store to toggle 'disabled' (property) and reflect change.
  const disabledStore = createStore(true, true);

  function App() {
    return <button id="btn" disabled={disabledStore}>btn</button>;
  }

  const root = await mount(<App />, document.body);
  const button = root.querySelector("#btn") as HTMLButtonElement;

  assert.equal(button.disabled, true);

  disabledStore.set(false);
  assert.equal(button.disabled, false);

  disabledStore.set(true);
  assert.equal(button.disabled, true);
});

test("prop-store-style-object-updates", async () => {
  const styleStore = createStore<string>("red", true);

  function App() {
    return <div id="styled" style={{ color: styleStore }}>style</div>;
  }

  const root = await mount(<App />, document.body);
  const div = root.querySelector("#styled") as HTMLDivElement;
  assert.equal(div.style.color, "red");

  styleStore.set("blue");
  assert.equal(div.style.color, "blue");

  styleStore.set("green");
  assert.equal(div.style.color, "green");
});

test("prop-store-multiple-props", async () => {
  const titleStore = createStore("T1", true);
  const dataStore = createStore("D1", true);

  function App() {
    return <div id="multi" title={titleStore} data-info={dataStore}>multi</div>;
  }

  const root = await mount(<App />, document.body);
  const div = root.querySelector("#multi") as HTMLDivElement;

  assert.equal(div.title, "T1");
  assert.equal(div.getAttribute("data-info"), "D1");

  titleStore.set("T2");
  dataStore.set("D2");
  assert.equal(div.title, "T2");
  assert.equal(div.getAttribute("data-info"), "D2");
});

await test.run();
