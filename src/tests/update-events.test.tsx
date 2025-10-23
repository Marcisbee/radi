import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { update } from "../client.ts";

/**
 * Basic component used for update event tests.
 * Renders a simple element; we do not rely on reactive props here,
 * only on the side-effect of the update event dispatch.
 */
function Probe() {
  return <div className="probe">probe</div>;
}

test("update-event", async () => {
  const root = await mount(<Probe />, document.body);

  let called = 0;
  root.addEventListener("update", () => {
    called++;
  });

  // Trigger an update; scheduler coalesces and flushes in a microtask.
  update(root);

  // Await microtask flush (Promise.then chain).
  await Promise.resolve();

  assert.equal(called, 1);
});

test("increment-single-update-callback", async () => {
  // Stripped-down increment scenario: count variable changes, update called once.
  let count = 0;

  function App() {
    return (
      <div className="app">
        <h1>{() => String(count)}</h1>
      </div>
    );
  }

  const root = await mount(<App />, document.body);

  let called = 0;
  root.addEventListener("update", () => {
    called++;
  });

  // Simulate increment and trigger update.
  count++;
  update(root);

  // Wait for microtask flush of the scheduler.
  await Promise.resolve();

  assert.equal(called, 1);
});

test("parent-dispatch-child-update", async () => {
  function Child() {
    return <span className="child">child</span>;
  }

  function App() {
    return (
      <div className="parent">
        <Child />
      </div>
    );
  }

  const parent = await mount(<App />, document.body);
  const child = parent.querySelector("radi-host radi-host")!;

  let childUpdates = 0;
  child.addEventListener("update", () => {
    childUpdates++;
  });

  // Dispatch update from parent; child listener should receive it once.
  update(parent);
  await Promise.resolve();

  assert.equal(childUpdates, 1);
});

await test.run();
