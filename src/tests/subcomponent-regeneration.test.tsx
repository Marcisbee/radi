import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

/**
 * Subcomponent Regeneration Tests
 *
 * Goal: Ensure that a parent component returning a freshly constructed child component
 * via a reactive function causes that child to re-evaluate its props (including randomized values)
 * on subsequent updates.
 */

function Sub2Test(props: JSX.Props<{ value: number }>) {
  // Value prop should be reactive from parent regeneration
  return <h3 className="sub2-value">Value: {() => props().value}</h3>;
}

function Sub1Test(this: HTMLElement) {
  // Returning a function makes this "reactive" in framework semantics
  // Each update(root) should trigger re-evaluation and new random prop for Sub2Test
  return () => <Sub2Test value={Math.random()} />;
}

test("sub2 prop regenerates", async () => {
  const root = await mount(<Sub1Test />, document.body);
  const h3 = root.querySelector(".sub2-value")!;
  assert.ok(h3, "Sub2 h3 should exist");

  const first = h3.textContent!;
  assert.ok(
    /Value:\s*\d\.\d+/.test(first),
    "First render contains random number",
  );

  // Trigger an update on the root component (parent)
  update(root);
  await Promise.resolve();
  const second = h3.textContent!;
  // If random collided (edge case), retry once
  if (first === second) {
    update(root);
    await Promise.resolve();
  }
  const third = h3.textContent!;
  assert.not.is(
    first,
    third,
    "Random value should change after regeneration updates",
  );
  assert.ok(
    /Value:\s*\d\.\d+/.test(third),
    "Third render contains random number",
  );
});

await test.run();
