import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

/**
 * Subcomponent generation + reactive/fragment behavior tests.
 * Consolidated (edge + core) suite to guard buildElement / normalizeToNodes /
 * reactive generator mounting / component identity replacement / fragment churn.
 */

/* =========================================================
   Helper Components
   ========================================================= */

function Item(this: HTMLElement, props: JSX.Props<{ id: number }>) {
  return <span className="item-span">#{() => props().id}</span>;
}

function AChild(this: HTMLElement, props: JSX.Props<{ label: string }>) {
  let renders = 0;
  return () => (
    <div className="a-child">
      A:{props().label} r:{++renders}
    </div>
  );
}

function BChild(this: HTMLElement, props: JSX.Props<{ label: string }>) {
  let renders = 0;
  return () => (
    <div className="b-child">
      B:{props().label} r:{++renders}
    </div>
  );
}

/* =========================================================
   Tests
   ========================================================= */

/* 1. Reactive returns array whose length changes */

function VariableArrayRoot(this: HTMLElement) {
  let count = 1;
  return () => {
    const arr: JSX.Element[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(<Item id={i} />);
    }
    return (
      <div className="var-array">
        <button
          className="inc-btn"
          onclick={() => {
            count++;
            update(this);
          }}
        >
          inc
        </button>
        <button
          className="dec-btn"
          onclick={() => {
            count = Math.max(0, count - 1);
            update(this);
          }}
        >
          dec
        </button>
        <div className="list">{arr}</div>
        <span className="count">{count}</span>
      </div>
    );
  };
}

test("vary array len", async () => {
  const root = await mount(<VariableArrayRoot />, document.body);
  const list = root.querySelector(".list")!;
  const inc = root.querySelector(".inc-btn") as HTMLButtonElement;
  const dec = root.querySelector(".dec-btn") as HTMLButtonElement;

  assert.is(list.querySelectorAll(".item-span").length, 1);

  inc.click();
  await Promise.resolve();
  assert.is(list.querySelectorAll(".item-span").length, 2);

  inc.click();
  inc.click();
  await Promise.resolve();
  assert.is(list.querySelectorAll(".item-span").length, 4);

  dec.click();
  await Promise.resolve();
  assert.is(list.querySelectorAll(".item-span").length, 3);

  dec.click();
  dec.click();
  dec.click();
  await Promise.resolve();
  assert.is(list.querySelectorAll(".item-span").length, 0);
});

/* 2. Reactive returns null then node toggling */

function NullToggleRoot(this: HTMLElement) {
  let show = false;
  return () => (
    <div className="null-toggle">
      <button
        className="toggle-btn"
        onclick={() => {
          show = !show;
          update(this);
        }}
      >
        toggle
      </button>
      <div className="slot">
        {show ? <strong className="strong">Hi</strong> : null}
      </div>
      <span className="flag">{String(show)}</span>
    </div>
  );
}

test("null toggle", async () => {
  const root = await mount(<NullToggleRoot />, document.body);
  const slot = root.querySelector(".slot")!;
  const btn = root.querySelector(".toggle-btn") as HTMLButtonElement;

  assert.is(slot.querySelectorAll(".strong").length, 0);
  btn.click();
  await Promise.resolve();
  assert.is(slot.querySelectorAll(".strong").length, 1);
  btn.click();
  await Promise.resolve();
  assert.is(slot.querySelectorAll(".strong").length, 0);
});

/* 3. Nested reactive generator chain */

function DeepChain(this: HTMLElement) {
  let n = 0;
  return () => (
    <>
      {() => {
        const msg = `val:${n}`;
        return (
          <div className="deep-chain">
            <button
              className="bump"
              onclick={() => {
                n++;
                update(this);
              }}
            >
              bump
            </button>
            <em className="msg">{msg}</em>
          </div>
        );
      }}
    </>
  );
}

test("nested chain", async () => {
  const root = await mount(<DeepChain />, document.body);
  let msg: HTMLElement | null = null;
  for (let i = 0; i < 5 && !msg; i++) {
    await Promise.resolve();
    msg = root.querySelector(".msg");
  }
  assert.ok(msg, "msg element mounted");
  const bump = root.querySelector(".bump") as HTMLButtonElement;

  assert.ok(msg!.textContent!.includes("val:0"));
  bump.click();
  await Promise.resolve();
  assert.ok(root.querySelector(".msg")!.textContent!.includes("val:1"));
  bump.click();
  bump.click();
  await Promise.resolve();
  assert.ok(root.querySelector(".msg")!.textContent!.includes("val:3"));
});

/* 4. Component identity swap triggers replacement */

function IdentitySwap(this: HTMLElement) {
  let mode: "A" | "B" = "A";
  return () => (
    <div className="identity-swap">
      <button
        className="swap"
        onclick={() => {
          mode = mode === "A" ? "B" : "A";
          update(this);
        }}
      >
        swap
      </button>
      {mode === "A" ? <AChild label="aaa" /> : <BChild label="bbb" />}
      <span className="mode">{mode}</span>
    </div>
  );
}

test("identity swap", async () => {
  const root = await mount(<IdentitySwap />, document.body);
  const swap = root.querySelector(".swap") as HTMLButtonElement;

  assert.is(root.querySelectorAll(".a-child").length, 1);
  assert.is(root.querySelectorAll(".b-child").length, 0);

  swap.click();
  await Promise.resolve();
  assert.is(root.querySelectorAll(".a-child").length, 0);
  assert.is(root.querySelectorAll(".b-child").length, 1);

  swap.click();
  await Promise.resolve();
  assert.is(root.querySelectorAll(".a-child").length, 1);
  assert.is(root.querySelectorAll(".b-child").length, 0);
});

/* 5. Multiple updates do not duplicate nodes */

function NoDupRoot(this: HTMLElement) {
  let ticks = 0;
  return () => (
    <div className="no-dup">
      <button
        className="tick"
        onclick={() => {
          ticks++;
          update(this);
        }}
      >
        tick
      </button>
      <p className="ticks">ticks:{ticks}</p>
    </div>
  );
}

test("no dup", async () => {
  const root = await mount(<NoDupRoot />, document.body);
  const tick = root.querySelector(".tick") as HTMLButtonElement;
  for (let i = 0; i < 5; i++) tick.click();
  await Promise.resolve();
  assert.is(root.querySelectorAll(".ticks").length, 1);
  assert.ok(root.querySelector(".ticks")!.textContent!.includes("ticks:5"));
});

/* 6. Fragment churn: booleans / null / array mixing */

function FragmentChurn(this: HTMLElement) {
  let phase = 0;
  return () => {
    phase++;
    const show = phase % 2 === 0;
    return (
      <>
        {show && <span className="even">even</span>}
        {!show && <span className="odd">odd</span>}
        {null}
        {true}
        {false}
        {[<strong className="inner" key={"k" + phase}>#{phase}</strong>]}
        <button
          className="flip"
          onclick={() => {
            update(this);
          }}
        >
          flip
        </button>
      </>
    );
  };
}

test("fragment churn", async () => {
  const root = await mount(<FragmentChurn />, document.body);
  const flip = root.querySelector(".flip") as HTMLButtonElement;

  const cycle = () => {
    const even = root.querySelectorAll(".even").length;
    const odd = root.querySelectorAll(".odd").length;
    const innerCount = root.querySelectorAll(".inner").length;
    assert.is(even + odd, 1);
    assert.is(innerCount, 1);
  };

  cycle();
  flip.click();
  await Promise.resolve();
  cycle();
  flip.click();
  await Promise.resolve();
  cycle();
  flip.click();
  await Promise.resolve();
  cycle();
});

/* =========================================================
   Run
   ========================================================= */

await test.run();
