import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

/**
 * Tab1
 * Static tab content component.
 * @param this HTMLElement host.
 * @returns JSX element with Tab1 label.
 */
function Tab1(this: HTMLElement) {
  return <div className="tab1">Tab1</div>;
}

/**
 * Tab2
 * Form tab that collects submitted "event" values and re-renders a list.
 * Maintains an internal immutable event list.
 * @param this HTMLElement host.
 * @returns JSX form element with input + submitted events list.
 */
function Tab2(this: HTMLElement) {
  let eventList: string[] = [];

  return (
    <form
      className="tab2-form"
      onsubmit={(e: Event) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const obj = Object.fromEntries(fd.entries());
        eventList = [...eventList, String(obj.event)];
        (e.target as HTMLFormElement).reset();
        update(this);
      }}
    >
      <input type="text" name="event" className="event-input" />
      <button type="submit" className="submit-btn">
        submit
      </button>
      <ul className="events">
        {() => eventList.map((ev) => <li>{ev}</li>)}
      </ul>
    </form>
  );
}

/**
 * TabberTest
 * Root container that controls which tab is active.
 * @param this HTMLElement host.
 * @returns JSX tab switcher + panel.
 */
function TabberTest(this: HTMLElement) {
  let activeTab: "tab1" | "tab2" = "tab1";

  return (
    <div className="tabber">
      <button
        type="button"
        className="btn-tab1"
        onclick={() => {
          activeTab = "tab1";
          update(this);
        }}
      >
        tab1
      </button>
      <button
        type="button"
        className="btn-tab2"
        onclick={() => {
          activeTab = "tab2";
          update(this);
        }}
      >
        tab2
      </button>
      <div className="panel">
        {() => (activeTab === "tab1" ? <Tab1 /> : <Tab2 />)}
      </div>
    </div>
  );
}

/** switch tabs and submit events */
test("switch tabs", async () => {
  const rootEl = await mount(<TabberTest />, document.body);
  const panelEl = rootEl.querySelector(".panel")!;
  assert.true(panelEl.textContent!.includes("Tab1"));

  (rootEl.querySelector(".btn-tab2") as HTMLButtonElement).click();
  await Promise.resolve();
  assert.elementExists(".tab2-form");

  const eventInput = panelEl.querySelector(".event-input") as HTMLInputElement;
  const submitBtn = panelEl.querySelector(".submit-btn") as HTMLButtonElement;

  eventInput.value = "alpha";
  submitBtn.click();
  eventInput.value = "beta";
  submitBtn.click();

  const listItems = panelEl.querySelectorAll("li");
  assert.equal(listItems.length, 2);
  assert.equal(listItems[0].textContent, "alpha");
  assert.equal(listItems[1].textContent, "beta");
});

/** tab2 resets events after unmount/remount */
test("tab2 resets", async () => {
  const rootEl = await mount(<TabberTest />, document.body);
  const btnTab1 = rootEl.querySelector(".btn-tab1") as HTMLButtonElement;
  const btnTab2 = rootEl.querySelector(".btn-tab2") as HTMLButtonElement;

  btnTab2.click();
  await Promise.resolve();

  const panelEl1 = rootEl.querySelector(".panel")!;
  const eventInput1 = panelEl1.querySelector(
    ".event-input",
  ) as HTMLInputElement;
  const submitBtn1 = panelEl1.querySelector(".submit-btn") as HTMLButtonElement;

  eventInput1.value = "first";
  submitBtn1.click();
  eventInput1.value = "second";
  submitBtn1.click();
  assert.length(panelEl1.querySelectorAll("li"), 2);

  btnTab1.click();
  await Promise.resolve();
  assert.true(panelEl1.textContent!.includes("Tab1"));

  btnTab2.click();
  await Promise.resolve();
  const panelEl2 = rootEl.querySelector(".panel")!;
  assert.length(panelEl2.querySelectorAll("li"), 0);
});

/** empty submission preserved as empty list item */
test("empty submit preserved", async () => {
  const rootEl = await mount(<TabberTest />, document.body);
  (rootEl.querySelector(".btn-tab2") as HTMLButtonElement).click();
  await Promise.resolve();

  const panelEl = rootEl.querySelector(".panel")!;
  const eventInput = panelEl.querySelector(".event-input") as HTMLInputElement;
  const submitBtn = panelEl.querySelector(".submit-btn") as HTMLButtonElement;

  eventInput.value = "";
  submitBtn.click();
  await Promise.resolve();

  const listItems = panelEl.querySelectorAll("li");
  assert.length(listItems, 1);
  assert.equal(listItems[0].textContent, "");
});

await test.run();
