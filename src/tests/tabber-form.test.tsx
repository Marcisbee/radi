import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

/**
 * Simple static tab
 */
function Tab1(this: HTMLElement) {
  return <div className="tab1">Tab1</div>;
}

/**
 * Form tab that collects submitted "event" values into an internal array
 * and re-renders the list.
 */
function Tab2(this: HTMLElement) {
  const events: string[] = [];

  return (
    <form
      className="tab2-form"
      onsubmit={(e: Event) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const obj = Object.fromEntries(fd.entries());
        events.push(String(obj.event));
        (e.target as HTMLFormElement).reset();
        update(this);
      }}
    >
      <input type="text" name="event" className="event-input" />
      <button type="submit" className="submit-btn">
        submit
      </button>
      <ul className="events">
        {() => events.map((ev) => <li>{ev}</li>)}
      </ul>
    </form>
  );
}

/**
 * Tabber root: maintains which tab is active and swaps content.
 */
function TabberTest(this: HTMLElement) {
  let tab: "tab1" | "tab2" = "tab1";

  return (
    <div className="tabber">
      <button
        type="button"
        className="btn-tab1"
        onclick={() => {
          tab = "tab1";
          update(this);
        }}
      >
        tab1
      </button>
      <button
        type="button"
        className="btn-tab2"
        onclick={() => {
          tab = "tab2";
          update(this);
        }}
      >
        tab2
      </button>
      <div className="panel">
        {() => (tab === "tab1" ? <Tab1 /> : <Tab2 />)}
      </div>
    </div>
  );
}

test("tab switch & form", async () => {
  const root = await mount(<TabberTest />, document.body);
  const panel = root.querySelector(".panel")!;
  assert.ok(panel.textContent!.includes("Tab1"), "Initial tab should be Tab1");

  (root.querySelector(".btn-tab2") as HTMLButtonElement).click();
  await Promise.resolve();
  assert.ok(panel.querySelector(".tab2-form"), "Tab2 form should appear");

  const input = panel.querySelector(".event-input") as HTMLInputElement;
  const submit = panel.querySelector(".submit-btn") as HTMLButtonElement;

  input.value = "alpha";
  submit.click();
  input.value = "beta";
  submit.click();

  const lis = panel.querySelectorAll("li");
  assert.is(lis.length, 2);
  assert.is(lis[0].textContent, "alpha");
  assert.is(lis[1].textContent, "beta");
});

test("tab2 reset on remount", async () => {
  const root = await mount(<TabberTest />, document.body);
  const btnTab1 = root.querySelector(".btn-tab1") as HTMLButtonElement;
  const btnTab2 = root.querySelector(".btn-tab2") as HTMLButtonElement;

  // Go to Tab2
  btnTab2.click();
  await Promise.resolve();

  const panel1 = root.querySelector(".panel")!;
  const input1 = panel1.querySelector(".event-input") as HTMLInputElement;
  const submit1 = panel1.querySelector(".submit-btn") as HTMLButtonElement;

  input1.value = "first";
  submit1.click();
  input1.value = "second";
  submit1.click();

  assert.is(panel1.querySelectorAll("li").length, 2);

  // Switch back to Tab1 (unmount Tab2)
  btnTab1.click();
  await Promise.resolve();
  assert.ok(panel1.textContent!.includes("Tab1"), "Should show Tab1 now");

  // Switch again to Tab2 (fresh instance with empty events)
  btnTab2.click();
  await Promise.resolve();

  const panel2 = root.querySelector(".panel")!;
  const lis2 = panel2.querySelectorAll("li");
  assert.is(lis2.length, 0, "Events should reset on fresh Tab2 mount");
});

test("empty submit stored", async () => {
  const root = await mount(<TabberTest />, document.body);
  (root.querySelector(".btn-tab2") as HTMLButtonElement).click();
  await Promise.resolve();

  const panel = root.querySelector(".panel")!;
  const input = panel.querySelector(".event-input") as HTMLInputElement;
  const submit = panel.querySelector(".submit-btn") as HTMLButtonElement;

  // Leave input blank
  input.value = "";
  submit.click();
  await Promise.resolve();

  const lis = panel.querySelectorAll("li");
  assert.is(lis.length, 1);
  assert.is(
    lis[0].textContent,
    "",
    "Empty submission should produce empty list item",
  );
});

await test.run();
