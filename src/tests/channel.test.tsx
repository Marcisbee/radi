import { assert, clock, test } from "jsr:@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { createChannel } from "../channel.ts";
import { update } from "../main.ts";

/**
 * ChannelTest Suite
 *
 * Verifies channel provide/use mechanics including:
 * - Nested overrides.
 * - Late provider resolution.
 * - Override chains.
 * - Functional re-provide.
 * - Ignored consumer set before resolution.
 * - Provider disposal behavior.
 * - Redundant identical values avoided.
 * - Multiple consumers sharing updates.
 *
 * All updates favor immutability (create new values instead of mutating in-place).
 */

const Theme = createChannel<"light" | "dark">("light");

/**
 * Provides base theme and toggles it via button.
 * Children can read or locally override the theme.
 */
function ThemeProvider(this: HTMLElement, props: JSX.PropsWithChildren) {
  const themeAccessor = Theme.provide(this, "light");
  return () => (
    <div className="theme-provider">
      <button
        type="button"
        className="toggle-btn"
        onclick={() => {
          themeAccessor.set((prev) => (prev === "light" ? "dark" : "light"));
        }}
      >
        toggle-theme
      </button>
      {props().children}
    </div>
  );
}

/**
 * Badge consumer shows current theme; uses reactive style mapping.
 */
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

/**
 * NestedOverride locally provides a dark theme overriding upstream value.
 */
function NestedOverride(this: HTMLElement) {
  Theme.provide(this, "dark");
  const theme = Theme.use(this);
  return <div className="nested">Nested: {theme}</div>;
}

/* nested override */
test("nested override", async () => {
  const root = await mount(
    <ThemeProvider>
      <Badge />
      <NestedOverride />
    </ThemeProvider>,
    document.body,
  );

  const badgeEl = root.querySelector(".badge")!;
  const nestedEl = root.querySelector(".nested")!;
  assert.ok(badgeEl.textContent!.includes("light"));
  assert.ok(nestedEl.textContent!.includes("dark"));

  (root.querySelector(".toggle-btn") as HTMLButtonElement).click();
  await Promise.resolve();
  assert.ok(badgeEl.textContent!.includes("dark"));
  assert.ok(nestedEl.textContent!.includes("dark"));
});

/**
 * LateProviderRoot: consumer appears before provider resolved; provider added asynchronously.
 */
function LateProviderRoot(this: HTMLElement) {
  const themeConsumer = Theme.use(this);
  let phase: "pre" | "post" = "pre";

  queueMicrotask(() => {
    Theme.provide(this, "dark");
    phase = "post";
    setTimeout(() => update(this), 5);
  });

  return () => (
    <div className="late-provider">
      Phase: {phase} Value: {themeConsumer} Resolved:{" "}
      {() => String(themeConsumer.resolved)}
    </div>
  );
}

/* late resolve */
test("late resolve", async () => {
  const root = await mount(<LateProviderRoot />, document.body);
  const div = root.querySelector(".late-provider")!;
  assert.ok(div.textContent!.includes("Phase: pre"));
  assert.ok(div.textContent!.includes("Value: light"));
  assert.ok(div.textContent!.includes("Resolved: false"));

  await Promise.resolve();
  await clock.fastForward(5);

  assert.ok(div.textContent!.includes("Phase: post"));
  assert.ok(div.textContent!.includes("Value: dark"));
  assert.ok(div.textContent!.includes("Resolved: true"));
});

/**
 * ChainTest: Demonstrates override layering and resolution order.
 */
function ChainTest(this: HTMLElement) {
  const outer = Theme.provide(this, "outer");
  return () => (
    <div className="chain-outer">
      <InnerChain />
      <span className="outer-val">{outer()}</span>
    </div>
  );
}

function InnerChain(this: HTMLElement) {
  const innerA = Theme.provide(this, "innerA");
  return () => (
    <div className="chain-innerA">
      <Deepest />
      <span className="innerA-val">{innerA()}</span>
    </div>
  );
}

function Deepest(this: HTMLElement) {
  const beforeAccessor = Theme.use(this);
  const deep = Theme.provide(this, "deep");
  const afterAccessor = Theme.use(this);
  return (
    <div className="chain-deep">
      before:{beforeAccessor()} after:{afterAccessor()} deep:{deep()}
    </div>
  );
}

/* override chain */
test("override chain", async () => {
  const root = await mount(<ChainTest />, document.body);
  await Promise.resolve();
  const deepEl = root.querySelector(".chain-deep")!;
  const innerAValEl = root.querySelector(".innerA-val")!;
  const outerValEl = root.querySelector(".outer-val")!;

  assert.ok(deepEl.textContent!.includes("before:innerA"));
  assert.ok(deepEl.textContent!.includes("after:deep"));
  assert.ok(deepEl.textContent!.includes("deep:deep"));
  assert.is(innerAValEl.textContent, "innerA");
  assert.is(outerValEl.textContent, "outer");

  const outerAccessor = Theme.use(root.querySelector(".chain-outer")!);
  outerAccessor.set("outer2");
  await Promise.resolve();
  assert.is(outerValEl.textContent, "outer2");
  assert.is(innerAValEl.textContent, "innerA");
  assert.ok(deepEl.textContent!.includes("before:innerA"));
});

/**
 * ReprovideTest: Demonstrates functional initial value referencing previous provider.
 */
function ReprovideTest(this: HTMLElement) {
  const channelAccessor = Theme.provide(this, "base");
  return () => (
    <div className="reprovide">
      <span className="val">{channelAccessor()}</span>
      <button
        className="reprovide-btn"
        onclick={() => {
          Theme.provide(this, (previous) =>
            previous === "base" ? "next" : "final");
        }}
      >
        reprovide
      </button>
    </div>
  );
}

/* reprovide functional */
test("reprovide functional", async () => {
  const root = await mount(<ReprovideTest />, document.body);
  const span = root.querySelector(".val")!;
  const btn = root.querySelector(".reprovide-btn") as HTMLButtonElement;
  assert.is(span.textContent, "base");
  btn.click();
  await Promise.resolve();
  assert.is(span.textContent, "next");
  btn.click();
  await Promise.resolve();
  assert.is(span.textContent, "final");
});

/**
 * UnresolvedSetTest: Setting consumer before resolution should not override default until provider exists.
 */
function UnresolvedSetTest(this: HTMLElement) {
  const orphan = document.createElement("div");
  const consumer = Theme.use(orphan as HTMLElement);
  consumer.set("dark"); // ignored pre-resolution
  this.appendChild(orphan);
  update(this);

  return () => (
    <div className="unresolved">
      val:{consumer()} resolved:{String(consumer.resolved)}
    </div>
  );
}

/* pre-resolve set ignored */
test("pre-resolve set ignored", async () => {
  const root = await mount(<UnresolvedSetTest />, document.body);
  const div = root.querySelector(".unresolved")!;
  assert.ok(div.textContent!.includes("val:light"));
  assert.ok(div.textContent!.includes("resolved:false"));

  Theme.provide(root, "dark");
  update(root);
  await Promise.resolve();
  assert.ok(div.textContent!.includes("val:dark"));
  assert.ok(div.textContent!.includes("resolved:true"));
});

/**
 * DisposalTest: After provider host removed, later sets should not propagate.
 */
function DisposalTest(this: HTMLElement) {
  const providerHost = document.createElement("div");
  providerHost.className = "provider-host";
  this.appendChild(providerHost);
  const accessor = Theme.provide(providerHost as HTMLElement, "alive");
  const consumer = Theme.use(providerHost as HTMLElement);

  setTimeout(() => {
    providerHost.remove();
    accessor.set("changed"); // ignored due to disposal
    update(this);
  }, 0);

  return () => (
    <div className="disposal">
      value:{consumer()}{" "}
      disposed:{String(accessor.provider ? (accessor as any).disposed : false)}
    </div>
  );
}

/* provider disposal */
test("provider disposal", async () => {
  const root = await mount(<DisposalTest />, document.body);
  const div = root.querySelector(".disposal")!;
  assert.ok(div.textContent!.includes("value:alive"));
  await Promise.resolve();
  await Promise.resolve();
  assert.ok(div.textContent!.includes("value:alive"));
});

/**
 * RedundantUpdateTest: Setting identical value should not trigger re-render.
 */
function RedundantUpdateTest(this: HTMLElement) {
  const chan = Theme.provide(this, "x");
  let renderCount = 0;
  const consumer = Theme.use(this);
  return () => {
    renderCount++;
    return (
      <div className="redundant">
        read:{consumer()} renders:{renderCount}
        <button
          className="same-btn"
          onclick={() => {
            chan.set("x");
          }}
        >
          same
        </button>
        <button
          className="diff-btn"
          onclick={() => {
            chan.set("y");
          }}
        >
          diff
        </button>
      </div>
    );
  };
}

/* no redundant set */
test("no redundant set", async () => {
  const root = await mount(<RedundantUpdateTest />, document.body);
  const div = root.querySelector(".redundant")!;
  const sameBtn = root.querySelector(".same-btn") as HTMLButtonElement;
  const diffBtn = root.querySelector(".diff-btn") as HTMLButtonElement;

  const initialMatch = /renders:(\d+)/.exec(div.textContent!)!;
  const initialCount = Number(initialMatch[1]);

  sameBtn.click();
  await Promise.resolve();
  const afterSameMatch = /renders:(\d+)/.exec(div.textContent!)!;
  const sameCount = Number(afterSameMatch[1]);
  assert.is(sameCount, initialCount);

  diffBtn.click();
  await Promise.resolve();
  const afterDiffMatch = /renders:(\d+)/.exec(div.textContent!)!;
  const diffCount = Number(afterDiffMatch[1]);
  assert.is(diffCount, initialCount + 1);
});

/**
 * MultiConsumers: Multiple consumers should reflect provider changes simultaneously.
 */
function MultiConsumers(this: HTMLElement) {
  const providerAccessor = Theme.provide(this, "base");
  return () => (
    <div className="multi">
      <ChildConsumer className="c1" />
      <ChildConsumer className="c2" />
      <button
        className="bump"
        onclick={() => {
          providerAccessor.set("bumped");
        }}
      >
        bump
      </button>
    </div>
  );
}

function ChildConsumer(
  this: HTMLElement,
  props: JSX.Props<{ className: string }>,
) {
  const theme = Theme.use(this);
  return (
    <div className={props().className}>
      {theme} resolved:{() => String(theme.resolved)}
    </div>
  );
}

/* shared update */
test("shared update", async () => {
  const root = await mount(<MultiConsumers />, document.body);
  const c1 = root.querySelector(".c1")!;
  const c2 = root.querySelector(".c2")!;
  const bump = root.querySelector(".bump") as HTMLButtonElement;

  assert.ok(c1.textContent!.includes("base"));
  assert.ok(c2.textContent!.includes("base"));

  bump.click();
  await Promise.resolve();

  assert.ok(c1.textContent!.includes("bumped"));
  assert.ok(c2.textContent!.includes("bumped"));
});

/* run */
await test.run();
