import { assert, clock, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { suspend, Suspense, unsuspend } from "../suspense.ts";
import { update } from "../main.ts";

function DelayedChild(this: HTMLElement) {
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
      <DelayedChild /> Extra
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

await test.run();
