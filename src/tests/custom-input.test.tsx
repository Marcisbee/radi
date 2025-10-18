import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

/* =========================================================
   Custom Input Reactive Value Tests
   ========================================================= */

function CustomInputTest(
  this: HTMLElement,
  props: JSX.Props<{ defaultValue?: string }>,
) {
  let value = props().defaultValue || "";
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

test("input mirrors", async () => {
  const root = await mount(
    <CustomInputTest defaultValue="Hey" />,
    document.body,
  );
  const input = root.querySelector("input") as HTMLInputElement;
  const mirror = root.querySelector(".mirror")!;
  assert.is(mirror.textContent, "Hey");

  input.value = "World";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await Promise.resolve();
  assert.is(mirror.textContent, "World");
});

await test.run();