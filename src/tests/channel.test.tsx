import { assert, clock, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { createChannel } from "../channel.ts";
import { update } from "../main.ts";

/* =========================================================
   Channel Provider / Consumer Tests
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

test("channel nested override", async () => {
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
   Edge Case Tests
   ========================================================= */

/**
 * Channel edge case tests target subtleties in resolution, disposal and
 * dynamic (re)providing behavior. These help guard against future refactors.
 */

/* 1. Consumer created before provider: unresolved -> resolves after late provide */
function LateProviderRoot(this: HTMLElement) {
  const consumer = Theme.use(this);
  let phase: "pre" | "post" = "pre";

  queueMicrotask(() => {
    Theme.provide(this, "dark");
    phase = "post";
    setTimeout(() => update(this), 5);
  });

  return () => (
    <div className="late-provider">
      Phase: {() => phase} Value: {consumer} Resolved:{" "}
      {() => String(consumer.resolved)}
    </div>
  );
}

test("late provider resolves consumer", async () => {
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

/* 2. Nested provider override chain */
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
  const usedBefore = Theme.use(this);
  const deep = Theme.provide(this, "deep");
  const usedAfter = Theme.use(this);
  return (
    <div className="chain-deep">
      before:{() => usedBefore()} after:{() => usedAfter()} deep:{() => deep()}
    </div>
  );
}

test("channel nested override chain", async () => {
  const root = await mount(<ChainTest />, document.body);
  await Promise.resolve();
  const deep = root.querySelector(".chain-deep")!;
  const innerAVal = root.querySelector(".innerA-val")!;
  const outerVal = root.querySelector(".outer-val")!;

  assert.ok(deep.textContent!.includes("before:innerA"));
  assert.ok(deep.textContent!.includes("after:deep"));
  assert.ok(deep.textContent!.includes("deep:deep"));
  assert.is(innerAVal.textContent, "innerA");
  assert.is(outerVal.textContent, "outer");

  const outerAccessor = Theme.use(root.querySelector(".chain-outer")!);
  outerAccessor.set("outer2");
  await Promise.resolve();
  assert.is(outerVal.textContent, "outer2");
  assert.is(innerAVal.textContent, "innerA");
  assert.ok(deep.textContent!.includes("before:innerA"));
});

/* 3. Re-providing at same element updates value via functional initial */
function ReprovideTest(this: HTMLElement) {
  const channel = Theme.provide(this, "base");
  return () => (
    <div className="reprovide">
      <span className="val">{channel()}</span>
      <button
        className="reprovide-btn"
        onclick={() => {
          Theme.provide(this, (prev) => (prev === "base" ? "next" : "final"));
        }}
      >
        reprovide
      </button>
    </div>
  );
}

test("channel re-provide functional initial uses previous", async () => {
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

/* 4. Consumer set ignored before resolution */
function UnresolvedSetTest(this: HTMLElement) {
  const orphan = document.createElement("div");
  const consumer = Theme.use(orphan as HTMLElement);
  consumer.set("dark");
  this.appendChild(orphan);
  update(this);

  return () => (
    <div className="unresolved">
      val:{() => consumer()} resolved:{() => String(consumer.resolved)}
    </div>
  );
}

test("consumer set ignored pre-resolve", async () => {
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

/* 5. Provider disposal prevents further set updates */
function DisposalTest(this: HTMLElement) {
  const providerHost = document.createElement("div");
  providerHost.className = "provider-host";
  this.appendChild(providerHost);
  const accessor = Theme.provide(providerHost as HTMLElement, "alive");
  const consumer = Theme.use(providerHost as HTMLElement);

  setTimeout(() => {
    providerHost.remove();
    accessor.set("changed");
    update(this);
  }, 0);

  return () => (
    <div className="disposal">
      value:{() => consumer()} disposed:{() =>
        String(accessor.provider ? (accessor as any).disposed : false)}
    </div>
  );
}

test("provider disposed ignores set", async () => {
  const root = await mount(<DisposalTest />, document.body);
  const div = root.querySelector(".disposal")!;
  assert.ok(div.textContent!.includes("value:alive"));
  await Promise.resolve();
  await Promise.resolve();
  assert.ok(div.textContent!.includes("value:alive"));
});

/* 6. Consumer reflects provider updates only when value changes */
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

test("no redundant update when setting identical value", async () => {
  const root = await mount(<RedundantUpdateTest />, document.body);
  const div = root.querySelector(".redundant")!;
  const same = root.querySelector(".same-btn") as HTMLButtonElement;
  const diff = root.querySelector(".diff-btn") as HTMLButtonElement;

  const initialRenders = /renders:(\d+)/.exec(div.textContent!)!;
  const initialCount = Number(initialRenders[1]);

  same.click();
  await Promise.resolve();
  const afterSame = /renders:(\d+)/.exec(div.textContent!)!;
  const sameCount = Number(afterSame[1]);
  assert.is(sameCount, initialCount);

  diff.click();
  await Promise.resolve();
  const afterDiff = /renders:(\d+)/.exec(div.textContent!)!;
  const diffCount = Number(afterDiff[1]);
  assert.is(diffCount, initialCount + 1);
});

/* 7. Multiple consumers share provider update */
function MultiConsumers(this: HTMLElement) {
  const provider = Theme.provide(this, "base");
  return () => (
    <div className="multi">
      <ChildConsumer className="c1" />
      <ChildConsumer className="c2" />
      <button
        className="bump"
        onclick={() => {
          provider.set("bumped");
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
      {() => theme()} resolved:{() => String(theme.resolved)}
    </div>
  );
}

test("multiple consumers share provider update", async () => {
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

await test.run();
