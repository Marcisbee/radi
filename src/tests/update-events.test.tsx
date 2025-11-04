import { assert, test } from "@marcisbee/rion/test";
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
  const child = parent.querySelector("host")!;

  let childUpdates = 0;
  child.addEventListener("update", () => {
    childUpdates++;
  });

  // Dispatch update from parent; child listener should receive it once.
  update(parent);
  await Promise.resolve();

  assert.equal(childUpdates, 1);
});

test("update event calls once per update request 1", async () => {
  function Child1(this: HTMLElement) {
    return <div data-count={() => "test"} />;
  }

  function Child2(this: HTMLElement) {
    let count = 0;
    let count2 = 0;
    this.addEventListener("update", () => count++);
    return <div className="count">{() => count} : {() => count2++}</div>;
  }

  function App() {
    return (
      <div>
        <Child1 />
        <Child2 />
      </div>
    );
  }

  const container = await mount(<App />, document.body);

  let updateCalls = 0;
  container.addEventListener("update", () => {
    updateCalls++;
  });

  update(container);
  update(container);
  update(container);
  await Promise.resolve();

  assert.equal(updateCalls, 3);

  const countEl = container.querySelector(".count")!;
  assert.equal(countEl.textContent, "3 : 3");
});

test("update event calls once per update request 2", async () => {
  function Child1(this: HTMLElement) {
    return <div data-count={() => "test"} />;
  }

  function Child2(this: HTMLElement) {
    let count = 0;
    let count2 = 0;
    this.addEventListener("update", () => count++);
    return <div className="count">{() => count} : {() => count2++}</div>;
  }

  function App() {
    return () => (
      <div>
        <Child1 />
        <Child2 />
      </div>
    );
  }

  const container = await mount(<App />, document.body);

  let updateCalls = 0;
  container.addEventListener("update", () => {
    updateCalls++;
  });

  update(container);
  update(container);
  update(container);
  await Promise.resolve();

  assert.equal(updateCalls, 3);

  const countEl = container.querySelector(".count")!;
  assert.equal(countEl.textContent, "3 : 3");
});

test("update event calls once per update request 3", async () => {
  function Child1(this: HTMLElement) {
    return <div data-count="test" />;
  }

  function Child2(this: HTMLElement) {
    let count = 0;
    let count2 = 0;
    this.addEventListener("update", () => count++);
    return <div className="count">{() => count} : {() => count2++}</div>;
  }

  function App() {
    return (
      <div>
        <Child1 />
        <Child2 />
      </div>
    );
  }

  const container = await mount(<App />, document.body);

  let updateCalls = 0;
  container.addEventListener("update", () => {
    updateCalls++;
  });

  update(container);
  update(container);
  update(container);
  await Promise.resolve();

  assert.equal(updateCalls, 3);

  const countEl = container.querySelector(".count")!;
  assert.equal(countEl.textContent, "3 : 3");
});

test("update event calls once per update request 4", async () => {
  function Child1(this: HTMLElement) {
    return () => <div data-count="test" />;
  }

  function Child2(this: HTMLElement) {
    let count = 0;
    let count2 = 0;
    this.addEventListener("update", () => count++);
    return <div className="count">{() => count} : {() => count2++}</div>;
  }

  function App() {
    return (
      <div>
        <Child1 />
        <Child2 />
      </div>
    );
  }

  const container = await mount(<App />, document.body);

  let updateCalls = 0;
  container.addEventListener("update", () => {
    updateCalls++;
  });

  update(container);
  update(container);
  update(container);
  await Promise.resolve();

  assert.equal(updateCalls, 3);

  const countEl = container.querySelector(".count")!;
  assert.equal(countEl.textContent, "3 : 3");
});

test("update event calls once per update request 5", async () => {
  function Child1(this: HTMLElement) {
    return () => <div data-count="test" />;
  }

  function Child2(this: HTMLElement) {
    let count = 0;
    let count2 = 0;
    this.addEventListener("update", () => count++);
    return () => <div className="count">{() => count} : {() => count2++}</div>;
  }

  function App() {
    return (
      <div>
        <Child1 />
        <Child2 />
      </div>
    );
  }

  const container = await mount(<App />, document.body);
  await Promise.resolve(); // ensure component tree built
  await Promise.resolve(); // ensure component tree built

  let updateCalls = 0;
  container.addEventListener("update", () => {
    updateCalls++;
  });

  update(container);
  update(container);
  update(container);
  await Promise.resolve();

  assert.equal(updateCalls, 3);

  const countEl = container.querySelector(".count")!;
  assert.equal(countEl.textContent, "3 : 3");
});

test("update event calls once per update request 5", async () => {
  function Child1(this: HTMLElement) {
    return () => <div data-count="test" />;
  }

  function Child2(this: HTMLElement) {
    let count = 0;
    let count2 = 0;
    this.addEventListener("update", () => count++);
    return () => <div className="count">{() => count} : {() => count2++}</div>;
  }

  function App() {
    return (
      <div>
        {() => <Child1 />}
        <Child2 />
      </div>
    );
  }

  const container = await mount(<App />, document.body);

  let updateCalls = 0;
  container.addEventListener("update", () => {
    updateCalls++;
  });

  update(container);
  update(container);
  update(container);
  await Promise.resolve();

  assert.equal(updateCalls, 3);

  const countEl = container.querySelector(".count")!;
  assert.equal(countEl.textContent, "3 : 3");
});

await test.run();
