import { createElement, Fragment, render, update } from "../src/main.ts";
import { assert, test } from "./runner.ts";
import { mount } from "./utils.ts";

/**
 * nextTick
 * Flushes queued microtasks and a single animation frame to allow DOM mutations,
 * mutation observers, and component lifecycle microtasks to settle before continuing.
 *
 * @returns Promise that resolves after a microtask and a requestAnimationFrame.
 */
function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/* ---------------------------------------------------------
   Reordering / keyed identity tests
   --------------------------------------------------------- */

/**
 * reorder retains nodes
 * Reordering a keyed list should move existing DOM elements without recreating them.
 */
test("reorder retains nodes", async () => {
  const state: { items: number[] } = { items: [1, 2, 3] };

  const listGen = () =>
    state.items.map((id) =>
      createElement(
        "div",
        { "data-key": String(id) },
        String(id),
      )
    );

  const root = createElement("section", null, listGen);
  const container = await mount(root as any, document.body as any);

  const initialNodes = new Map<string, Element>();
  for (const el of Array.from(container.querySelectorAll("section > div"))) {
    initialNodes.set(el.getAttribute("data-key")!, el);
  }

  assert.is(
    Array.from(initialNodes.values()).map((n) => n.textContent).join(","),
    "1,2,3",
    "Initial order mismatch",
  );

  // Reorder immutably.
  state.items = [3, 2, 1];
  update(container.querySelector("section")!);
  await nextTick();

  const reordered = Array.from(
    container.querySelectorAll("section > div"),
  );

  const reorderedKeys = reordered.map((n) => n.getAttribute("data-key"));
  assert.equal(reorderedKeys, ["3", "2", "1"]);

  // Identity check.
  for (const el of reordered) {
    const key = el.getAttribute("data-key")!;
    assert.is(el, initialNodes.get(key), `Node with key ${key} was replaced`);
  }
});

/**
 * insertion removal preserves
 * Inserting and removing keyed items should preserve identity of existing keys.
 */
test("insertion removal preserves", async () => {
  const state: { items: number[] } = { items: [10, 20, 30] };

  const listGen = () =>
    state.items.map((id) =>
      createElement("div", { "data-key": String(id) }, String(id))
    );

  const root = createElement("section", null, listGen);
  const container = await mount(root as any, document.body as any);

  const firstSnapshot = new Map<string, Element>();
  for (const el of Array.from(container.querySelectorAll("section > div"))) {
    firstSnapshot.set(el.getAttribute("data-key")!, el);
  }
  assert.equal(Array.from(firstSnapshot.keys()), ["10", "20", "30"]);

  state.items = [15, 10, 30, 40];
  update(container.querySelector("section")!);
  await nextTick();

  const afterEls = Array.from(container.querySelectorAll("section > div"));
  const keys = afterEls.map((el) => el.getAttribute("data-key"));
  assert.equal(keys, ["15", "10", "30", "40"]);

  assert.is(afterEls[1], firstSnapshot.get("10"));
  assert.is(afterEls[2], firstSnapshot.get("30"));
  assert.ok(!firstSnapshot.has("15"));
  assert.ok(!firstSnapshot.has("40"));
});

/* ---------------------------------------------------------
   Component remount behavior with stable / changing keys
   --------------------------------------------------------- */

/**
 * Counter
 * Simple component used for mount counting; not reactive to value changes
 * since it returns static content.
 *
 * @param getProps Accessor returning props with a numeric value field.
 */
function Counter(getProps: () => { value: number }) {
  mountCount++;
  const { value } = getProps();
  return createElement("span", null, "V" + value);
}
let mountCount = 0;

/**
 * stable key no remount
 * Changing a non-reactive prop without changing the key should not remount component.
 */
test("stable key no remount", async () => {
  mountCount = 0;
  const state: { key: string; value: number } = { key: "A", value: 1 };

  const compGen = () =>
    createElement(Counter, { key: state.key, value: state.value });

  const root = createElement("div", null, compGen);
  const container = await mount(root as any, document.body as any);

  await nextTick();
  assert.is(mountCount, 1, "Component should mount once initially");
  const span = container.querySelector("div > cmp-Counter > span");
  assert.ok(span);
  assert.is(span!.textContent, "V1");

  state.value = 2; // value changes but component not reactive to it
  update(container.querySelector("div")!);
  await nextTick();

  assert.is(mountCount, 1, "Component should NOT remount when key is stable");
  assert.is(span!.textContent, "V1");
});

/**
 * KeyedComp
 * Component used to verify mount counts on key changes.
 *
 * @param getProps Accessor returning props with a value.
 */
function KeyedComp(getProps: () => { value: number }) {
  keyedMountCount++;
  const { value } = getProps();
  return createElement("span", null, `M${keyedMountCount}-V${value}`);
}
let keyedMountCount = 0;

/**
 * key change remounts
 * Changing the key forces a remount and re-execution of component body.
 */
test("key change remounts", async () => {
  keyedMountCount = 0;
  const state: { key: string; value: number } = { key: "K1", value: 1 };

  const compGen = () =>
    createElement(KeyedComp, { key: state.key, value: state.value });

  const root = createElement("div", null, compGen);
  const container = await mount(root as any, document.body as any);
  await nextTick();

  assert.is(keyedMountCount, 1);
  let span = container.querySelector("div > cmp-KeyedComp > span")!;
  assert.ok(span);
  assert.is(span.textContent, "M1-V1");

  state.key = "K2";
  state.value = 2;
  update(container.querySelector("div")!);
  await nextTick();
  await nextTick(); // allow microtask component mount

  span = container.querySelector("div > cmp-KeyedComp[data-key='K2'] > span")!;
  assert.ok(span);
  assert.is(keyedMountCount, 2, "Component should remount on key change");
  assert.is(span.textContent, "M2-V2");
});

/* ---------------------------------------------------------
   Fragment keyed reordering
   --------------------------------------------------------- */

/**
 * fragment reorder identity
 * Reordering keyed children inside a Fragment preserves node identity.
 */
test("fragment reorder identity", async () => {
  const state: { items: string[] } = { items: ["a", "b", "c"] };

  const listGen = () =>
    state.items.map((id) => createElement("p", { key: id }, id.toUpperCase()));

  const root = createElement(
    "div",
    null,
    () => createElement(Fragment, null, listGen()),
  );

  const container = await mount(root as any, document.body as any);
  await nextTick();

  const initial = Array.from(container.querySelectorAll("div > p"));
  assert.equal(initial.map((n) => n.textContent), ["A", "B", "C"]);
  const identity = new Map(
    initial.map((n) => [n.textContent!.toLowerCase(), n]),
  );

  state.items = ["c", "a", "b"];
  update(container.querySelector("div")!);
  await nextTick();

  const after = Array.from(container.querySelectorAll("div > p"));
  assert.equal(after.map((n) => n.textContent), ["C", "A", "B"]);
  for (const n of after) {
    const key = n.textContent!.toLowerCase();
    assert.is(n, identity.get(key), `Fragment keyed node ${key} was replaced`);
  }
});

/**
 * mixed keyed preserves
 * Reordering keyed nodes while mutating an unkeyed tail should preserve
 * identity of keyed nodes only.
 */
test("mixed keyed preserves", async () => {
  const state: { items: string[]; tail: string[] } = {
    items: ["x", "y"],
    tail: ["un1", "un2"],
  };

  const mixedGen = () => [
    ...state.items.map((k) => createElement("i", { key: k }, k)),
    ...state.tail.map((t) => createElement("span", null, t)),
  ];

  const root = createElement("div", null, mixedGen);
  const container = await mount(root as any, document.body as any);
  await nextTick();

  const initialKeyed = Array.from(
    container.querySelectorAll("div > i"),
  );
  const keyedMap = new Map(
    initialKeyed.map((n) => [n.textContent!, n]),
  );

  state.items = ["y", "x"];
  state.tail = ["un2", "un1", "un3"];
  update(container.querySelector("div")!);
  await nextTick();

  const afterKeyed = Array.from(container.querySelectorAll("div > i"));
  assert.equal(afterKeyed.map((n) => n.textContent), ["y", "x"]);
  for (const el of afterKeyed) {
    assert.is(el, keyedMap.get(el.textContent!), "Keyed node identity lost");
  }
});

/**
 * Flip
 * Component used to verify remount when key is removed.
 *
 * @param getProps Accessor for label string.
 */
function Flip(getProps: () => { label: string }) {
  flipMountCount++;
  const { label } = getProps();
  return createElement("strong", null, label);
}
let flipMountCount = 0;

/**
 * key removed remounts
 * Removing a previously existing key causes remount.
 */
test("key removed remounts", async () => {
  flipMountCount = 0;
  const state: { keyed: boolean } = { keyed: true };

  const compGen = () =>
    state.keyed
      ? createElement(Flip, { key: "K", label: "KEYED" })
      : createElement(Flip, { label: "UNKEYED" });

  const root = createElement("div", null, compGen);
  const container = await mount(root as any, document.body as any);
  await nextTick();
  assert.is(flipMountCount, 1);

  state.keyed = false;
  update(container.querySelector("div")!);
  await nextTick();
  await nextTick();
  assert.is(flipMountCount, 2, "Component should remount when key removed");
  const txt = container.querySelector("div > cmp-Flip > strong")!.textContent;
  assert.is(txt, "UNKEYED");
});

/* ---------------------------------------------------------
   Run all tests
   --------------------------------------------------------- */
await test.run();
