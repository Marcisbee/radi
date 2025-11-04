import { assert, test } from "@marcisbee/rion/test";
import { createRoot } from "../client.ts";

/**
 * Simple component whose displayed value depends on its props.
 * Uses a reactive render function so update events reconcile content.
 */
function App(
  this: HTMLElement,
  props: JSX.Props<{ counter: number; key?: string }>,
) {
  return () => <div className="value">{() => props().counter}</div>;
}

function AppA(this: HTMLElement) {
  return () => <div className="which">A</div>;
}

function AppB(this: HTMLElement) {
  return () => <div className="which">B</div>;
}

test.before.each(() => {
  document.body.innerHTML = "";
});

/**
 * reuse-component-props
 * Multiple root.render() calls with same component type update props without remount.
 */
test("reuse-component-props", () => {
  const root = createRoot(document.body);
  let connectCount = 0;
  let disconnectCount = 0;

  // Attach listeners directly on first instance (events are non-bubbling).
  const first = <App counter={0} />;
  first.addEventListener("connect", () => connectCount++);
  first.addEventListener("disconnect", () => disconnectCount++);
  root.render(first);

  const valueEl0 = document.querySelector(".value") as HTMLDivElement | null;
  if (!valueEl0) throw new Error("value element missing");
  assert.equal(valueEl0.textContent, "0");

  // Subsequent renders reuse component host (no new connect).
  for (let i = 1; i < 3; i++) {
    root.render(<App counter={i} />);
    const valueEl = document.querySelector(".value") as HTMLDivElement | null;
    if (!valueEl) throw new Error("value element missing");
    assert.equal(valueEl.textContent, String(i));
  }

  assert.equal(connectCount, 1);
  assert.equal(disconnectCount, 0);
});

/**
 * replace-component-type
 * Rendering different component types causes old host to disconnect and new to connect.
 */
test("replace-component-type", () => {
  const root = createRoot(document.body);
  let connectA = 0;
  let disconnectA = 0;
  let connectB = 0;
  let disconnectB = 0;

  const a = <AppA />;
  a.addEventListener("connect", () => connectA++);
  a.addEventListener("disconnect", () => disconnectA++);
  root.render(a);
  assert.equal(
    (document.querySelector(".which") as HTMLElement).textContent,
    "A",
  );

  const b = <AppB />;
  b.addEventListener("connect", () => connectB++);
  b.addEventListener("disconnect", () => disconnectB++);
  root.render(b);
  assert.equal(
    (document.querySelector(".which") as HTMLElement).textContent,
    "B",
  );

  assert.equal(connectA, 1);
  assert.equal(disconnectA, 1);
  assert.equal(connectB, 1);
  assert.equal(disconnectB, 0);
});

/**
 * replace-component-key
 * Changing key forces remount even with same component type.
 */
test("replace-component-key", () => {
  const root = createRoot(document.body);
  let connects = 0;
  let disconnects = 0;

  const one = <App key="one" counter={0} />;
  one.addEventListener("connect", () => connects++);
  one.addEventListener("disconnect", () => disconnects++);
  root.render(one);
  assert.equal(
    (document.querySelector(".value") as HTMLElement).textContent,
    "0",
  );

  const two = <App key="two" counter={1} />;
  two.addEventListener("connect", () => connects++);
  two.addEventListener("disconnect", () => disconnects++);
  root.render(two);
  assert.equal(
    (document.querySelector(".value") as HTMLElement).textContent,
    "1",
  );

  assert.equal(connects, 2);
  assert.equal(disconnects, 1);
});

await test.run();
