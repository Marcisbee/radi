import { createElement, Fragment, render, update } from "../src/main.ts";
import { assert, test } from "./runner.ts";
import { mount } from "./utils.ts";

/**
 * Utility: flush microtasks + a short frame.
 */
function nextTick(): Promise<void> {
  return new Promise((r) => {
    queueMicrotask(() => {
      // Allow MutationObserver/connect events to propagate
      requestAnimationFrame(() => r());
    });
  });
}

test("reorder retains identity", async () => {
  const state = { items: [1, 2, 3] };

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

  // Capture initial nodes by key
  const initialNodes = new Map<string, Element>();
  Array.from(container.querySelectorAll("section > div")).forEach((el) => {
    initialNodes.set(el.getAttribute("data-key")!, el);
  });

  assert.is(
    Array.from(initialNodes.values()).map((n) => n.textContent).join(","),
    "1,2,3",
    "Initial order mismatch",
  );

  // Reorder
  state.items = [3, 2, 1];
  update(container.querySelector("section")!);
  await nextTick();

  const reordered = Array.from(
    container.querySelectorAll("section > div"),
  );

  const reorderedKeys = reordered.map((n) => n.getAttribute("data-key"));
  assert.equal(reorderedKeys, ["3", "2", "1"]);

  // Identity check: nodes should be the same objects, only moved
  for (const el of reordered) {
    const key = el.getAttribute("data-key")!;
    assert.is(el, initialNodes.get(key), `Node with key ${key} was replaced`);
  }
});

test("insertion removal preserves", async () => {
  const state = { items: [10, 20, 30] };

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

  // Mutate: remove 20, add 15 before 10, add 40 at end
  state.items = [15, 10, 30, 40];
  update(container.querySelector("section")!);
  await nextTick();

  const afterEls = Array.from(container.querySelectorAll("section > div"));
  const keys = afterEls.map((el) => el.getAttribute("data-key"));
  assert.equal(keys, ["15", "10", "30", "40"]);

  // Identity: 10 and 30 preserved
  assert.is(afterEls[1], firstSnapshot.get("10"));
  assert.is(afterEls[2], firstSnapshot.get("30"));

  // New nodes for 15 and 40
  assert.ok(!firstSnapshot.has("15"));
  assert.ok(!firstSnapshot.has("40"));
});

test("stable key no remount", async () => {
  let mountCount = 0;
  const state = { key: "A", value: 1 };

  function Counter(getProps: () => { value: number }) {
    mountCount++;
    const { value } = getProps();
    return createElement("span", null, "V" + value);
  }

  const compGen = () =>
    createElement(Counter, { key: state.key, value: state.value });

  const root = createElement("div", null, compGen);
  const container = await mount(root as any, document.body as any);

  await nextTick();
  assert.is(mountCount, 1, "Component should mount once initially");
  const span = container.querySelector("div > cmp-Counter > span");
  assert.ok(span);
  assert.is(span!.textContent, "V1");

  // Update value only; same key
  state.value = 2;
  update(container.querySelector("div")!);
  await nextTick();

  // Component body should NOT run again (mountCount unchanged)
  assert.is(mountCount, 1, "Component should NOT remount when key is stable");
  // Since component output isn't reactive to value change (no reactive child fn),
  // span text will remain V1 — this validates no re-execution.
  assert.is(span!.textContent, "V1");
});

test("key change remounts", async () => {
  let mountCount = 0;
  const state = { key: "K1", value: 1 };

  function KeyedComp(getProps: () => { value: number }) {
    mountCount++;
    const { value } = getProps();
    // Include mount count so we can observe new instantiation
    return createElement("span", null, `M${mountCount}-V${value}`);
  }

  const compGen = () =>
    createElement(KeyedComp, { key: state.key, value: state.value });

  const root = createElement("div", null, compGen);
  const container = await mount(root as any, document.body as any);
  await nextTick();

  assert.is(mountCount, 1);
  let span = container.querySelector("div > cmp-KeyedComp > span")!;
  assert.ok(span);
  assert.is(span.textContent, "M1-V1");

  // Change key -> expect remount
  state.key = "K2";
  state.value = 2;
  update(container.querySelector("div")!);
  await nextTick();
  // Need one more tick for microtask component mount
  await nextTick();

  span = container.querySelector("div > cmp-KeyedComp[data-key='K2'] > span")!;
  assert.ok(span);
  assert.is(mountCount, 2, "Component should remount on key change");
  assert.is(span.textContent, "M2-V2");
});

test("fragment reorder identity", async () => {
  const state = { items: ["a", "b", "c"] };

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

test("mixed keyed preserves", async () => {
  const state = { items: ["x", "y"], tail: ["un1", "un2"] };

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

  state.items = ["y", "x"]; // reorder keyed
  state.tail = ["un2", "un1", "un3"]; // mutate unkeyed
  update(container.querySelector("div")!);
  await nextTick();

  const afterKeyed = Array.from(container.querySelectorAll("div > i"));
  assert.equal(afterKeyed.map((n) => n.textContent), ["y", "x"]);
  for (const el of afterKeyed) {
    assert.is(el, keyedMap.get(el.textContent!), "Keyed node identity lost");
  }
});

test("key removed remounts", async () => {
  let mountCount = 0;
  const state: { keyed: boolean } = { keyed: true };

  function Flip(getProps: () => { label: string }) {
    mountCount++;
    const { label } = getProps();
    return createElement("strong", null, label);
  }

  const compGen = () =>
    state.keyed
      ? createElement(Flip, { key: "K", label: "KEYED" })
      : createElement(Flip, { label: "UNKEYED" });

  const root = createElement("div", null, compGen);
  const container = await mount(root as any, document.body as any);
  await nextTick();
  assert.is(mountCount, 1);

  state.keyed = false; // drop key
  update(container.querySelector("div")!);
  await nextTick();
  await nextTick(); // allow microtask mount
  assert.is(mountCount, 2, "Component should remount when key removed");
  const txt = container.querySelector("div > cmp-Flip > strong")!.textContent;
  assert.is(txt, "UNKEYED");
});
