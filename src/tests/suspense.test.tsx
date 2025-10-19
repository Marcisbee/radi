import { assert, clock, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { suspend, Suspense, unsuspend } from "../suspense.ts";
import { update } from "../main.ts";

/**
 * Combined Suspense tests (core + edge cases).
 * Core:
 *  - Single delayed child resolves fallback.
 * Edge:
 *  - Immediate child (no suspension)
 *  - Multiple delayed children (staggered completion)
 *  - Never unsuspends
 *  - Suspension error (unsuspend never called)
 *  - Mixed immediate + delayed
 *  - Re-suspension after initial reveal (ignored)
 */

/* --------------------------------
   Core: single delayed child
   -------------------------------- */
function DelayedChild100(this: HTMLElement) {
  let state = "suspended";
  this.addEventListener(
    "suspension",
    async () => {
      suspend(this);
      await new Promise((r) => setTimeout(r, 100));
      state = "unsuspended";
      update(this);
      unsuspend(this);
    },
    { once: true },
  );
  return (
    <div>
      <h1>I am {() => state}</h1>
    </div>
  );
}

test("fallback resolves", async () => {
  const root = await mount(
    <Suspense fallback={<strong>Loading...</strong>}>
      <DelayedChild100 /> Extra
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Loading..."));
  await clock.fastForward(90);
  assert.not.ok(root.textContent!.includes("I am unsuspended"));
  await clock.fastForward(10);
  assert.ok(root.textContent!.includes("I am unsuspended"));
  assert.ok(root.textContent!.includes("Extra"));
});

/* --------------------------------
   Edge: helpers
   -------------------------------- */
function ImmediateChild(this: HTMLElement) {
  return <span className="immediate">Immediate</span>;
}

function DelayedChild(
  this: HTMLElement,
  props: JSX.Props<{ label: string; delay: number }>,
) {
  let state = "pending";
  this.addEventListener(
    "suspension",
    async () => {
      suspend(this);
      await new Promise((r) => setTimeout(r, props().delay));
      state = "done";
      update(this);
      unsuspend(this);
    },
    { once: true },
  );
  return <span className={"delayed-" + props().label}>{() => state}</span>;
}

function NeverUnsuspendChild(this: HTMLElement) {
  let state = "start";
  this.addEventListener(
    "suspension",
    () => {
      state = "suspended";
      update(this);
      suspend(this);
      // never unsuspend
    },
    { once: true },
  );
  return <span className="never">{() => state}</span>;
}

function ErrorChild(this: HTMLElement) {
  let state = "init";
  this.addEventListener(
    "suspension",
    () => {
      try {
        suspend(this);
        state = "errored";
        update(this);
        throw new Error("Suspension failure");
      } catch {
        // unsuspend not called -> fallback persists
      }
    },
    { once: true },
  );
  return <span className="error-child">{() => state}</span>;
}

function Resuspender(this: HTMLElement) {
  let phase = "boot";
  this.addEventListener(
    "suspension",
    async () => {
      suspend(this);
      phase = "s1";
      update(this);
      await new Promise((r) => setTimeout(r, 30));
      phase = "s1-done";
      update(this);
      unsuspend(this);
      // second cycle (ignored by Suspense)
      await new Promise((r) => setTimeout(r, 30));
      suspend(this);
      phase = "s2";
      update(this);
      await new Promise((r) => setTimeout(r, 30));
      phase = "s2-done";
      update(this);
      unsuspend(this);
    },
    { once: true },
  );
  return <span className="resuspender">{() => phase}</span>;
}

/* --------------------------------
   Edge tests
   -------------------------------- */
test("immediate", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Loading</strong>}>
      <ImmediateChild />
    </Suspense>,
    document.body,
  );
  assert.not.ok(root.textContent!.includes("Loading"));
  assert.ok(root.querySelector(".immediate"));
});

test("multi children", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Wait</strong>}>
      <DelayedChild label="a" delay={50} />
      <DelayedChild label="b" delay={80} />
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Wait"));
  assert.not.ok(root.textContent!.includes("done"));
  await clock.fastForward(55);
  assert.ok(root.textContent!.includes("Wait"));
  await clock.fastForward(30);
  assert.not.ok(root.textContent!.includes("Wait"));
  assert.ok(root.textContent!.includes("done"));
});

test("never unsuspends", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Hold</strong>}>
      <NeverUnsuspendChild />
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Hold"));
  await clock.fastForward(500);
  assert.ok(root.textContent!.includes("Hold"));
  assert.not.ok(root.textContent!.includes("suspended"));
});

test("suspend error", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Err</strong>}>
      <ErrorChild />
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Err"));
  await clock.fastForward(200);
  assert.ok(root.textContent!.includes("Err"));
  assert.not.ok(root.textContent!.includes("errored"));
});

test("mixed children delays", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Mix</strong>}>
      <ImmediateChild />
      <DelayedChild label="slow" delay={70} />
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Mix"));
  await clock.fastForward(40);
  assert.ok(root.textContent!.includes("Mix"));
  assert.not.ok(root.textContent!.includes("Immediate"));
  await clock.fastForward(40);
  assert.not.ok(root.textContent!.includes("Mix"));
  assert.ok(root.querySelector(".immediate"));
  assert.ok(root.querySelector(".delayed-slow"));
});

test("resuspension ignored", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Phase</strong>}>
      <Resuspender />
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Phase"));
  await clock.fastForward(35);
  assert.not.ok(root.textContent!.includes("Phase"));
  assert.ok(root.textContent!.includes("s1-done"));
  await clock.fastForward(35);
  assert.not.ok(root.textContent!.includes("Phase"));
  assert.ok(root.textContent!.includes("s2"));
  await clock.fastForward(40);
  assert.ok(root.textContent!.includes("s2-done"));
  assert.not.ok(root.textContent!.includes("Phase"));
});

await test.run();
