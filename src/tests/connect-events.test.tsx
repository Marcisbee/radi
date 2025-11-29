import { assert, test } from "@marcisbee/rion/test";
import { createRoot, update } from "../client.ts";

function Probe() {
  return <div>probe</div>;
}

test("connect in component", async () => {
  const probe = <Probe />;

  let called = 0;
  probe.addEventListener("connect", () => {
    called++;
  });

  createRoot(document.body).render(probe);

  // Await microtask flush (Promise.then chain).
  await Promise.resolve();

  assert.equal(called, 1);
});

test("connect inside component", async () => {
  let called = 0;
  function Probe1(this: HTMLSelectElement) {
    this.addEventListener("connect", () => {
      called++;
    });
    return <div>probe</div>;
  }
  const probe = <Probe1 />;

  createRoot(document.body).render(probe);

  // Await microtask flush (Promise.then chain).
  await Promise.resolve();

  assert.equal(called, 1);
});

test("connect in element", async () => {
  const probe = <div />;

  let called = 0;
  probe.addEventListener("connect", () => {
    called++;
  });

  createRoot(document.body).render(probe);

  // Await microtask flush (Promise.then chain).
  await Promise.resolve();

  assert.equal(called, 1);
});

test("connect component switch", () => {
  let countA = 0;
  function ComponentA(this: HTMLElement) {
    this.addEventListener("connect", () => {
      countA++;
    });
    return <div>A</div>;
  }

  let countB = 0;
  function ComponentB(this: HTMLElement) {
    this.addEventListener("connect", () => {
      countB++;
    });
    return <div>B</div>;
  }

  let showA = true;
  function Switcher() {
    return () => (showA ? <ComponentA /> : <ComponentB />);
  }

  const root = createRoot(document.body).render(<Switcher />);

  assert.equal(countA, 1);
  assert.equal(countB, 0);

  showA = false;
  update(root);

  assert.equal(countA, 1);
  assert.equal(countB, 1);

  showA = true;
  update(root);

  assert.equal(countA, 2);
  assert.equal(countB, 1);
});

test("disconnect component switch", () => {
  let countA = 0;
  function ComponentA(this: HTMLElement) {
    this.addEventListener("disconnect", () => {
      countA++;
    });
    return <div>A</div>;
  }

  let countB = 0;
  function ComponentB(this: HTMLElement) {
    this.addEventListener("disconnect", () => {
      countB++;
    });
    return <div>B</div>;
  }

  let showA = true;
  function Switcher() {
    return () => (showA ? <ComponentA /> : <ComponentB />);
  }

  const root = createRoot(document.body).render(<Switcher />);

  assert.equal(countA, 0);
  assert.equal(countB, 0);

  showA = false;
  update(root);

  assert.equal(countA, 1);
  assert.equal(countB, 0);

  showA = true;
  update(root);

  assert.equal(countA, 1);
  assert.equal(countB, 1);
});

await test.run();
