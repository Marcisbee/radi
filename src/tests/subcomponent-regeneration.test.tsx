import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { update } from "../client.ts";

/**
 * SubValue
 * Displays a numeric value passed via props and exposes it reactively.
 *
 * Props:
 * - value: number
 *
 * The value is wrapped in a reactive accessor so that regenerating the parent
 * component with a new random value updates the displayed text.
 *
 * @param props Reactive props accessor containing a numeric value.
 * @returns JSX heading element showing the value.
 */
function SubValue(props: JSX.Props<{ value: number }>) {
  return <h3 className="sub2-value">Value: {() => props().value}</h3>;
}

/**
 * Regenerator
 * Parent component that returns a reactive function producing a new
 * `SubValue` instance with a freshly generated random number each time
 * `update(parent)` is invoked.
 *
 * @returns Reactive function returning a SubValue child with random value.
 */
function Regenerator(this: HTMLElement) {
  return () => <SubValue value={Math.random()} />;
}

/**
 * prop-regenerates
 * Confirms that successive parent updates produce different random values.
 * Retries a limited number of times in the extremely unlikely event of
 * identical random outputs.
 */
test("prop-regenerates", async () => {
  const root = await mount(<Regenerator />, document.body);
  const heading = root.querySelector(".sub2-value") as HTMLElement;
  assert.exists(heading);

  const first = heading.textContent!;
  assert.true(/Value:\s*\d\.\d+/.test(first));

  const maxAttempts = 5;
  let attempt = 0;
  let changed = false;
  while (attempt < maxAttempts && !changed) {
    update(root);
    await Promise.resolve();
    const current = heading.textContent!;
    if (current !== first) {
      changed = true;
    } else {
      attempt++;
    }
  }

  assert.true(changed, "Random value should change within attempts");
  assert.match(heading.textContent, /Value:\s*\d\.\d+/);
});

/**
 * stable-before-update
 * Ensures that without invoking `update`, the rendered random value
 * remains stable (no spontaneous change).
 */
test("stable-before-update", async () => {
  const root = await mount(<Regenerator />, document.body);
  const heading = root.querySelector(".sub2-value") as HTMLElement;
  const initial = heading.textContent!;
  await Promise.resolve(); // allow any microtasks
  const again = heading.textContent!;
  assert.equal(initial, again);
});

await test.run();
