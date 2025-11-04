import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { update } from "../client.ts";

/**
 * CustomInputTest component renders a controlled text input whose value is mirrored
 * in a sibling span. The input's displayed value is driven by internal state that
 * updates on every input event, triggering a re-render.
 *
 * Props:
 * - defaultValue?: string - initial string shown in the input and mirror.
 *
 * @param this Host HTMLElement (used for update triggering).
 * @param props Reactive props accessor containing optional defaultValue.
 */
function CustomInputTest(
  this: HTMLElement,
  props: JSX.Props<{ defaultValue?: string }>,
) {
  let value = props().defaultValue ?? "";
  return (
    <div className="custom-input">
      <input
        type="text"
        value={() => value}
        oninput={(e) => {
          value = (e.target as HTMLInputElement).value;
          update(this);
        }}
      />
      <span className="mirror">{() => value}</span>
    </div>
  );
}

/**
 * mirrors typed value
 * Ensures that typing (simulated by dispatching input) updates the mirrored span.
 */
test("mirrors typed value", async () => {
  const root = await mount(
    <CustomInputTest defaultValue="Hey" />,
    document.body,
  );
  const input = root.querySelector("input") as HTMLInputElement;
  const mirror = root.querySelector(".mirror")!;
  assert.equal(mirror.textContent, "Hey");

  input.value = "World";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await Promise.resolve();
  assert.equal(mirror.textContent, "World");
});

await test.run();
