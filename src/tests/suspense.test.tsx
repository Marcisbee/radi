import { assert, clock, test } from "jsr:@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { suspend, Suspense, unsuspend } from "../suspense.ts";
import { update } from "../main.ts";

/**
 * Suspense behavior tests covering:
 * - Fallback resolution after single delayed child unsuspends.
 * - Immediate child rendering without fallback.
 * - Multiple staggered delayed children.
 * - Perpetual suspension (never unsuspends).
 * - Error during suspension (fallback persists).
 * - Mixed immediate + delayed children.
 * - Ignored re-suspension after initial unsuspend.
 */

/**
 * DelayedChild100
 * Suspends once, waits 100ms, then unsuspends and updates state text.
 */
function DelayedChild100(this: HTMLElement) {
  let state = "suspended";
  (async () => {
    suspend(this);
    await new Promise((resolve) => setTimeout(resolve, 100));
    state = "unsuspended";
    update(this);
    unsuspend(this);
  })();
  return (
    <div>
      <h1>I am {() => state}</h1>
    </div>
  );
}

test("fallback-unsuspends-child", async () => {
  const root = await mount(
    <Suspense fallback={<strong>Loading...</strong>}>
      <DelayedChild100 /> Extra
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent.includes("Loading..."));
  assert.ok(root.textContent.includes("I am suspended"));
  await clock.fastForward(90);
  assert.ok(root.textContent.includes("I am suspended"));
  assert.not.ok(root.textContent.includes("I am unsuspended"));
  await clock.fastForward(10);
  assert.ok(root.textContent.includes("I am unsuspended"));
  assert.not.ok(root.textContent.includes("Loading..."));
  assert.ok(root.textContent.includes("Extra"));
});

/** ImmediateChild renders synchronously without suspension. */
function ImmediateChild(this: HTMLElement) {
  return <span className="immediate">Immediate</span>;
}

/**
 * DelayedChild
 * Suspends once for a configurable delay, then unsuspends and shows "done".
 */
function DelayedChild(
  this: HTMLElement,
  props: JSX.Props<{ label: string; delay: number }>,
) {
  let state = "pending";
  (async () => {
    suspend(this);
    await new Promise((resolve) => setTimeout(resolve, props().delay));
    state = "done";
    update(this);
    unsuspend(this);
  })();
  return <span className={"delayed-" + props().label}>{() => state}</span>;
}

/**
 * NeverUnsuspendChild
 * Suspends and never calls unsuspend, leaving fallback in place permanently.
 */
function NeverUnsuspendChild(this: HTMLElement) {
  let state = "start";

  state = "suspended";
  update(this);
  suspend(this);

  return <span className="never">{() => state}</span>;
}

/**
 * ErrorChild
 * Throws during suspension; unsuspend is never called so fallback persists.
 */
function ErrorChild(this: HTMLElement) {
  let state = "init";

  try {
    suspend(this);
    state = "errored";
    update(this);
    throw new Error("Suspension failure");
  } catch {
    // Fallback remains; unsuspend intentionally omitted.
  }

  return <span className="error-child">{() => state}</span>;
}

/**
 * Resuspender
 * Performs two sequential suspension cycles; Suspense ignores the second after reveal.
 */
function Resuspender(this: HTMLElement) {
  let phase = "boot";
  (async () => {
    suspend(this);
    phase = "s1";
    update(this);
    await new Promise((resolve) => setTimeout(resolve, 30));
    phase = "s1-done";
    update(this);
    unsuspend(this);
    await new Promise((resolve) => setTimeout(resolve, 30));
    suspend(this);
    phase = "s2";
    update(this);
    await new Promise((resolve) => setTimeout(resolve, 30));
    phase = "s2-done";
    update(this);
    unsuspend(this);
  })();
  return <span className="resuspender">{() => phase}</span>;
}

test("renders-immediate", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Loading</strong>}>
      <ImmediateChild />
    </Suspense>,
    document.body,
  );
  assert.not.ok(root.textContent!.includes("Loading"));
  assert.ok(root.querySelector(".immediate"));
});

test("multi-stagger", async () => {
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
  assert.ok(root.textContent!.includes("done"));
  assert.ok(root.textContent!.includes("pending"));
  await clock.fastForward(30);
  assert.not.ok(root.textContent!.includes("Wait"));
  assert.ok(root.textContent!.includes("done"));
});

test("never-unsuspends", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Hold</strong>}>
      <NeverUnsuspendChild />
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Hold"));
  await clock.fastForward(500);
  assert.ok(root.textContent!.includes("Hold"));
  assert.ok(root.textContent!.includes("suspended"));
});

test("error-keeps-fallback", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Err</strong>}>
      <ErrorChild />
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Err"));
  await clock.fastForward(200);
  assert.ok(root.textContent!.includes("Err"));
  assert.ok(root.textContent!.includes("errored"));
});

test("mixed-delays", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Mix</strong>}>
      <ImmediateChild />
      <DelayedChild label="slow" delay={70} />
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Mix"));
  assert.ok(root.textContent!.includes("Immediate"));
  assert.ok(root.textContent!.includes("pending"));
  await clock.fastForward(40);
  assert.ok(root.textContent!.includes("Mix"));
  assert.ok(root.textContent!.includes("Immediate"));
  assert.ok(root.textContent!.includes("pending"));
  assert.ok(root.textContent!.includes("Immediate"));
  await clock.fastForward(40);
  assert.not.ok(root.textContent!.includes("Mix"));
  assert.ok(root.textContent!.includes("Immediate"));
  assert.ok(root.textContent!.includes("done"));
  assert.ok(root.querySelector(".immediate"));
  assert.ok(root.querySelector(".delayed-slow"));
});

test("can-resuspend", async () => {
  const root = await mount(
    <Suspense fallback={<strong className="fallback">Phase</strong>}>
      <Resuspender />
    </Suspense>,
    document.body,
  );
  assert.ok(root.textContent!.includes("Phase"));
  assert.ok(root.textContent!.includes("s1"));
  await clock.fastForward(35);
  assert.not.ok(root.textContent!.includes("Phase"));
  assert.ok(root.textContent!.includes("s1-done"));
  await clock.fastForward(35);
  assert.ok(root.textContent!.includes("Phase"));
  assert.ok(root.textContent!.includes("s2"));
  await clock.fastForward(40);
  assert.ok(root.textContent!.includes("s2-done"));
  assert.not.ok(root.textContent!.includes("Phase"));
});

await test.run();
