import { assert, clock, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { suspend, Suspense, unsuspend } from "../suspense.ts";
import { update } from "../main.ts";

/**
 * Suspense edge case tests
 *
 * Guard against future regressions in waitForUnsuspense / event wiring.
 * Scenarios covered:
 *  - Child that does NOT suspend (immediate reveal after microtask)
 *  - Multiple children with staggered unsuspends (reveal only after last)
 *  - Child that suspends and never unsuspends (fallback persists)
 *  - Child throwing during suspension handler (still stays fallback)
 *  - Mixed children (some suspend, some not)
 *  - Re-suspension after initial unsuspend (fallback should NOT reappear)
 */

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

function ImmediateChild(this: HTMLElement) {
  // Does not listen for "suspension" nor call suspend()
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
      // Intentionally NEVER calling unsuspend()
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
        // Deliberately NOT calling unsuspend -> fallback should remain
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
      // First suspend cycle
      suspend(this);
      phase = "s1";
      update(this);
      await new Promise((r) => setTimeout(r, 30));
      phase = "s1-done";
      update(this);
      unsuspend(this);

      // Second suspend cycle (after reveal). Suspense should ignore.
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

/* ------------------------------------------------------------------ */
/* Tests */
/* ------------------------------------------------------------------ */

test("immediate", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Loading</strong>}>
      <ImmediateChild />
    </Suspense>,
    document.body,
  );

  // Initial: fallback
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

  // Fallback initially
  assert.ok(root.textContent!.includes("Wait"));
  assert.not.ok(root.textContent!.includes("done"));

  // Advance past first child completion but not second
  await clock.fastForward(55);
  assert.ok(
    root.textContent!.includes("Wait"),
    "Still fallback until all unsuspend",
  );
  // Advance beyond second
  await clock.fastForward(30);
  assert.not.ok(root.textContent!.includes("Wait"), "Fallback replaced");
  assert.ok(root.textContent!.includes("done"), "Children rendered");
});

test("never unsuspends", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Hold</strong>}>
      <NeverUnsuspendChild />
    </Suspense>,
    document.body,
  );

  assert.ok(root.textContent!.includes("Hold"));

  // Let time pass well beyond normal thresholds
  await clock.fastForward(500);
  assert.ok(
    root.textContent!.includes("Hold"),
    "Fallback persists when no unsuspend",
  );
  assert.not.ok(
    root.textContent!.includes("suspended"),
    "Child state only internal to fallback hidden",
  );
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
  // Still fallback due to lack of unsuspend
  assert.ok(root.textContent!.includes("Err"));
  assert.not.ok(
    root.textContent!.includes("errored"),
    "Errored state not revealed since unsuspend never fired",
  );
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

  // Before unsuspend: fallback
  await clock.fastForward(40);
  assert.ok(root.textContent!.includes("Mix"));
  assert.not.ok(root.textContent!.includes("Immediate"));

  // After unsuspend: content appears
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

  // Initially fallback
  assert.ok(root.textContent!.includes("Phase"));

  // After first cycle unsuspend (approx 30ms)
  await clock.fastForward(35);
  assert.not.ok(root.textContent!.includes("Phase"));
  assert.ok(root.textContent!.includes("s1-done"));

  // Second suspension should NOT re-show fallback
  await clock.fastForward(35); // into second suspend period
  assert.not.ok(
    root.textContent!.includes("Phase"),
    "Fallback not reintroduced on second suspend",
  );
  assert.ok(root.textContent!.includes("s2"));

  // After second unsuspend
  await clock.fastForward(40);
  assert.ok(root.textContent!.includes("s2-done"));
  assert.not.ok(root.textContent!.includes("Phase"));
});

await test.run();
