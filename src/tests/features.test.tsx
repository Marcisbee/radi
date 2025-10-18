import { assert, clock, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { createAbortSignal, update } from "../main.ts";
import { createChannel } from "../channel.ts";
import { suspend, Suspense, unsuspend } from "../suspense.ts";
import { createSignal } from "../signal.ts";

/* =========================================================
   Channel / Provider / Consumer Tests
   ========================================================= */

const Theme = createChannel<"light" | "dark">("light");

function TestThemeProvider(this: HTMLElement, props: JSX.PropsWithChildren) {
  const theme = Theme.provide(this, "light");
  return () => (
    <div>
      <button
        type="button"
        onclick={() => {
          theme.set((prev) => (prev === "light" ? "dark" : "light"));
        }}
      >
        toggle-theme
      </button>
      {props().children}
    </div>
  );
}

function Badge(this: HTMLElement) {
  const theme = Theme.use(this);
  return (
    <div
      className="badge"
      style={() => ({
        background: theme() === "dark" ? "#222" : "#eee",
        color: theme() === "dark" ? "#eee" : "#222",
      })}
    >
      Theme: {theme}
    </div>
  );
}

function NestedOverride(this: HTMLElement) {
  Theme.provide(this, "dark"); // Local override
  const theme = Theme.use(this);
  return <div className="nested">Nested: {theme}</div>;
}

test("channel provides + consumer updates + nested override stability", async () => {
  const root = await mount(
    <TestThemeProvider>
      <Badge />
      <NestedOverride />
    </TestThemeProvider>,
    document.body,
  );

  const badge = root.querySelector(".badge")!;
  const nested = root.querySelector(".nested")!;
  assert.ok(badge);
  assert.ok(nested);
  // Initial values
  assert.ok(badge.textContent!.includes("light"), "Badge should start light");
  assert.ok(nested.textContent!.includes("dark"), "Nested override dark");

  // Toggle provider -> badge should change, nested stays dark
  (root.querySelector("button") as HTMLButtonElement).click();
  // Let microtasks & update propagate
  await Promise.resolve();
  assert.ok(badge.textContent!.includes("dark"), "Badge should become dark");
  assert.ok(nested.textContent!.includes("dark"), "Nested remains dark");
});

/* =========================================================
   Suspense Tests
   ========================================================= */

function DelayedChild(this: HTMLElement) {
  let state = "suspended";
  this.addEventListener(
    "suspension",
    async () => {
      suspend(this);
      await new Promise((r) => setTimeout(r, 100)); // shorter for test
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

test("suspense fallback then resolution", async () => {
  const root = await mount(
    <Suspense fallback={<strong>Loading...</strong>}>
      <DelayedChild /> Extra
    </Suspense>,
    document.body,
  );
  // Initial should show fallback
  assert.ok(
    root.textContent!.includes("Loading..."),
    "Should render fallback first",
  );
  await clock.fastForward(150);
  assert.ok(
    root.textContent!.includes("I am unsuspended"),
    "Should render child after unsuspend",
  );
  assert.ok(root.textContent!.includes("Extra"));
});

/* =========================================================
   Signal Tests
   ========================================================= */

function CounterSignalTest(
  this: HTMLElement,
  props: JSX.Props<{ count: number }>,
) {
  const sig = createSignal(props().count);
  return (
    <button
      type="button"
      className="signal-btn"
      onclick={() => {
        sig(sig() + 1);
      }}
      disabled={() => sig() >= 3}
    >
      Signal: {sig}
    </button>
  );
}

test("signal increments & disables at threshold", async () => {
  const root = await mount(<CounterSignalTest count={0} />, document.body);
  const btn = root.querySelector(".signal-btn") as HTMLButtonElement;
  assert.ok(btn.textContent!.includes("0"));
  assert.not.ok(btn.disabled);

  btn.click();
  assert.ok(btn.textContent!.includes("1"));
  assert.not.ok(btn.disabled);

  btn.click();
  assert.ok(btn.textContent!.includes("2"));
  assert.not.ok(btn.disabled);

  btn.click();
  assert.ok(btn.textContent!.includes("3"));
  assert.ok(btn.disabled, "Button disabled at >=3");
});

/* =========================================================
   Drummer Custom Events + Stable Random Tests
   ========================================================= */

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

test("drummer custom events update BPM, random stable", async () => {
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

test("custom input reactive value mirrors changes", async () => {
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

/* =========================================================
   Tabber & Form Submission Tests
   ========================================================= */

function Tab1(this: HTMLElement) {
  return <div className="tab1">Tab1</div>;
}

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
      <button type="submit" className="submit-btn">submit</button>
      <ul className="events">{() => events.map((ev) => <li>{ev}</li>)}</ul>
    </form>
  );
}

function TabberTest(this: HTMLElement) {
  let tab = "tab1";
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

test("tabber switches and form collects events", async () => {
  const root = await mount(<TabberTest />, document.body);
  const panel = root.querySelector(".panel")!;
  assert.ok(panel.textContent!.includes("Tab1"));

  (root.querySelector(".btn-tab2") as HTMLButtonElement).click();
  await Promise.resolve();
  assert.ok(panel.querySelector(".tab2-form"), "Form should appear");

  const input = panel.querySelector(".event-input") as HTMLInputElement;
  const submit = panel.querySelector(".submit-btn") as HTMLButtonElement;

  input.value = "alpha";
  submit.click();
  await Promise.resolve();
  input.value = "beta";
  submit.click();
  await Promise.resolve();

  const lis = panel.querySelectorAll("li");
  assert.is(lis.length, 2);
  assert.is(lis[0].textContent, "alpha");
  assert.is(lis[1].textContent, "beta");
});

/* =========================================================
   Sub1/Sub2 Reactive Function Returning New Component
   ========================================================= */

function Sub2Test(props: JSX.Props<{ value: number }>) {
  return <h3 className="sub2-value">Value: {() => props().value}</h3>;
}

function Sub1Test(this: HTMLElement) {
  return () => <Sub2Test value={Math.random()} />;
}

test("Sub1 reactive function regenerates Sub2 with new random prop on update", async () => {
  const root = await mount(<Sub1Test />, document.body);
  const h3 = root.querySelector(".sub2-value")!;
  const first = h3.textContent!;
  update(root);
  await Promise.resolve();
  const second = h3.textContent!;
  // Retry once if same (extremely unlikely)
  if (first === second) {
    update(root);
    await Promise.resolve();
  }
  const third = h3.textContent!;
  assert.not.is(first, third, "Random value should change after updates");
});

/* =========================================================
   AbortSignal / disconnect tests
   ========================================================= */

test("createAbortSignal triggers abort on component removal", async () => {
  const events: string[] = [];

  function Abortable(this: HTMLElement) {
    const signal = createAbortSignal(this);
    signal.addEventListener("abort", () => {
      events.push("aborted");
    });
    return <div className="abortable">Abortable</div>;
  }

  const root = await mount(<Abortable />, document.body);
  assert.is(events.length, 0);
  // Remove from DOM -> disconnect -> abort
  root.parentNode!.removeChild(root);
  // Allow mutation observer to process
  await new Promise((r) => setTimeout(r, 10));
  assert.is(events.length, 1);
  assert.is(events[0], "aborted");
});

/* =========================================================
   Run all tests
   ========================================================= */

await test.run();
