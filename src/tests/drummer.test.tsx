import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { createAbortSignal, update } from "../main.ts";

function DrummerTest(this: HTMLElement) {
  let bpm = 100;
  const abortSignal = createAbortSignal(this);

  this.addEventListener(
    "bpm:increment",
    () => {
      bpm++;
      update(this);
    },
    { signal: abortSignal },
  );
  this.addEventListener(
    "bpm:decrement",
    () => {
      bpm--;
      update(this);
    },
    { signal: abortSignal },
  );

  const random = Math.random();

  return () => (
    <div
      className="drummer"
      style={{
        color: `hsl(${bpm},95%,55%)`,
      }}
    >
      BPM: {bpm} Random: <strong>{random}</strong>
    </div>
  );
}

test("drummer events", async () => {
  const root = await mount(<DrummerTest />, document.body);
  const div = root.querySelector(".drummer")!;
  const initial = div.textContent!;
  const matchRandom = /Random:\s*(\d\.\d+)/.exec(initial);
  assert.ok(matchRandom, "Random present");
  const randomValue = matchRandom![1];

  // Increment
  root.dispatchEvent(new CustomEvent("bpm:increment", { bubbles: true }));
  await Promise.resolve();
  assert.ok(div.textContent!.includes("BPM: 101"));
  assert.ok(div.textContent!.includes(randomValue), "Random unchanged");

  // Decrement twice
  root.dispatchEvent(new CustomEvent("bpm:decrement", { bubbles: true }));
  root.dispatchEvent(new CustomEvent("bpm:decrement", { bubbles: true }));
  await Promise.resolve();
  assert.ok(div.textContent!.includes("BPM: 99"));
  assert.ok(div.textContent!.includes(randomValue), "Random still unchanged");
});

await test.run();