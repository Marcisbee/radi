import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { update } from "../client.ts";

/**
 * Renders a span with an id value.
 * @param this Host HTMLElement.
 * @param props Props containing numeric id.
 */
function Item(this: HTMLElement, props: JSX.Props<{ id: number }>) {
  return <span className="item-span">#{() => props().id}</span>;
}

/**
 * Demo child A that shows a label and render count.
 * @param this Host element.
 * @param props Props with a static label string.
 */
function AChild(this: HTMLElement, props: JSX.Props<{ label: string }>) {
  let renderCount = 0;
  return () => (
    <div className="a-child">
      A:{props().label} r:{++renderCount}
    </div>
  );
}

/**
 * Demo child B that shows a label and render count.
 * @param this Host element.
 * @param props Props with a static label string.
 */
function BChild(this: HTMLElement, props: JSX.Props<{ label: string }>) {
  let renderCount = 0;
  return () => (
    <div className="b-child">
      B:{props().label} r:{++renderCount}
    </div>
  );
}

/**
 * Root with variable-length array of Item children.
 * @param this Host element.
 */
function VariableArrayRoot(this: HTMLElement) {
  let itemCount = 1;
  return () => {
    const items = Array.from({ length: itemCount }, (_, i) => <Item id={i} />);
    return (
      <div className="var-array">
        <button
          className="inc-btn"
          onclick={() => {
            itemCount++;
            update(this);
          }}
        >
          inc
        </button>
        <button
          className="dec-btn"
          onclick={() => {
            itemCount = Math.max(0, itemCount - 1);
            update(this);
          }}
        >
          dec
        </button>
        <div className="list">{items}</div>
        <span className="count">{itemCount}</span>
      </div>
    );
  };
}

/**
 * Root that toggles a nullable child node.
 * @param this Host element.
 */
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

/**
 * Deep nested reactive chain returning a dynamic message.
 * @param this Host element.
 */
function DeepChain(this: HTMLElement) {
  let value = 0;
  return () => (
    <>
      {() => {
        const msg = `val:${value}`;
        return (
          <div className="deep-chain">
            <button
              className="bump"
              onclick={() => {
                value++;
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

/**
 * Swaps identity between AChild and BChild components to test full replacement.
 * @param this Host element.
 */
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

/**
 * Root that increments a tick counter ensuring nodes are not duplicated.
 * @param this Host element.
 */
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

/**
 * Fragment churn stress test mixing booleans, nulls and keyed elements.
 * @param this Host element.
 */
function FragmentChurn(this: HTMLElement) {
  let phase = 0;
  return () => {
    phase++;
    const evenMode = phase % 2 === 0;
    return (
      <>
        {evenMode && <span className="even">even</span>}
        {!evenMode && <span className="odd">odd</span>}
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

/** variable array length */
test("vary array len", async () => {
  const root = await mount(<VariableArrayRoot />, document.body);
  const listEl = root.querySelector(".list")!;
  const incBtn = root.querySelector(".inc-btn") as HTMLButtonElement;
  const decBtn = root.querySelector(".dec-btn") as HTMLButtonElement;

  assert.length(listEl.querySelectorAll(".item-span"), 1);

  incBtn.click();
  await Promise.resolve();
  assert.length(listEl.querySelectorAll(".item-span"), 2);

  incBtn.click();
  incBtn.click();
  await Promise.resolve();
  assert.length(listEl.querySelectorAll(".item-span"), 4);

  decBtn.click();
  await Promise.resolve();
  assert.length(listEl.querySelectorAll(".item-span"), 3);

  decBtn.click();
  decBtn.click();
  decBtn.click();
  await Promise.resolve();
  assert.length(listEl.querySelectorAll(".item-span"), 0);
});

/** toggle nullable child */
test("null toggle", async () => {
  const root = await mount(<NullToggleRoot />, document.body);
  const slotEl = root.querySelector(".slot")!;
  const toggleBtn = root.querySelector(".toggle-btn") as HTMLButtonElement;

  assert.length(slotEl.querySelectorAll(".strong"), 0);
  toggleBtn.click();
  await Promise.resolve();
  assert.length(slotEl.querySelectorAll(".strong"), 1);
  toggleBtn.click();
  await Promise.resolve();
  assert.length(slotEl.querySelectorAll(".strong"), 0);
});

/** nested reactive chain updates message */
test("nested chain", async () => {
  const root = await mount(<DeepChain />, document.body);
  let msgEl: HTMLElement | null = null;
  for (const _ of Array.from({ length: 5 })) {
    if (msgEl) break;
    await Promise.resolve();
    msgEl = root.querySelector(".msg");
  }
  assert.exists(msgEl, "msg element mounted");
  const bumpBtn = root.querySelector(".bump") as HTMLButtonElement;

  assert.contains(msgEl!.textContent, "val:0");
  bumpBtn.click();
  await Promise.resolve();
  assert.contains(root.querySelector(".msg")!.textContent, "val:1");
  bumpBtn.click();
  bumpBtn.click();
  await Promise.resolve();
  assert.contains(root.querySelector(".msg")!.textContent, "val:3");
});

/** component identity replacement */
test("identity swap", async () => {
  const root = await mount(<IdentitySwap />, document.body);
  const swapBtn = root.querySelector(".swap") as HTMLButtonElement;

  assert.length(root.querySelectorAll(".a-child"), 1);
  assert.length(root.querySelectorAll(".b-child"), 0);

  swapBtn.click();
  await Promise.resolve();
  assert.length(root.querySelectorAll(".a-child"), 0);
  assert.length(root.querySelectorAll(".b-child"), 1);

  swapBtn.click();
  await Promise.resolve();
  assert.length(root.querySelectorAll(".a-child"), 1);
  assert.length(root.querySelectorAll(".b-child"), 0);
});

/** multiple updates keep single node instance */
test("no dup", async () => {
  const root = await mount(<NoDupRoot />, document.body);
  const tickBtn = root.querySelector(".tick") as HTMLButtonElement;
  for (const _ of Array.from({ length: 5 })) tickBtn.click();
  await Promise.resolve();
  assert.length(root.querySelectorAll(".ticks"), 1);
  assert.contains(root.querySelector(".ticks")!.textContent, "ticks:5");
});

/** fragment churn maintains single even/odd and inner node */
test("fragment churn", async () => {
  const root = await mount(<FragmentChurn />, document.body);
  const flipBtn = root.querySelector(".flip") as HTMLButtonElement;

  const validate = () => {
    const evenCount = root.querySelectorAll(".even").length;
    const oddCount = root.querySelectorAll(".odd").length;
    const innerCount = root.querySelectorAll(".inner").length;
    assert.equal(evenCount + oddCount, 1);
    assert.equal(innerCount, 1);
  };

  validate();
  flipBtn.click();
  await Promise.resolve();
  validate();
  flipBtn.click();
  await Promise.resolve();
  validate();
  flipBtn.click();
  await Promise.resolve();
  validate();
});

test("on update", async () => {
  function Child() {
    return <div id="b">B</div>;
  }

  function Parent(this: HTMLElement) {
    let count = 0;
    return (
      <div>
        <button
          type="button"
          onclick={() => {
            count++;
            update(this);
          }}
        >
          update
        </button>
        {() => (count > 0 && <Child />)}
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <button type="button">update</button>
        <!--$--><!--false-->
      </div>
    </host>
  `,
  );

  const button = root.querySelector("button")!;
  button.click();

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <button type="button">update</button>
        <!--$--><host><div id="b">B</div></host>
      </div>
    </host>
  `,
  );
});

test("on update nested", async () => {
  function Child() {
    return <div id="b">B</div>;
  }

  function Parent(this: HTMLElement) {
    let count = 0;
    return (
      <div>
        <button
          type="button"
          onclick={() => {
            count++;
            update(this);
          }}
        >
          update
        </button>
        {() => (count > 0 && (
          <div>
            <Child />
          </div>
        ))}
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <button type="button">update</button>
        <!--$--><!--false-->
      </div>
    </host>
  `,
  );

  const button = root.querySelector("button")!;
  button.click();

  assert.snapshot.html(
    root,
    `
    <host>
      <div>
        <button type="button">update</button>
        <!--$--><div><host><div id="b">B</div></host></div>
      </div>
    </host>
  `,
  );
});

await test.run();
