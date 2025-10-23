import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { update } from "../client.ts";

/**
 * Item component displaying id and tracking render count to verify identity.
 * @param props Reactive props containing id.
 * @returns Reactive render function with incrementing render count text.
 */
function KeyItem(props: JSX.Props<{ id: string; key?: string }>) {
  let renders = 0;
  return () => (
    <span className="key-item">
      {props().id}:{++renders}
    </span>
  );
}

/**
 * Root that renders a list of items keyed by their id and allows reordering.
 * @returns Reactive render function producing keyed children.
 */
function KeyedReorderRoot(this: HTMLElement) {
  let mode: "asc" | "desc" = "asc";
  const ids = ["a", "b", "c", "d"];
  return () => {
    const ordered = mode === "asc" ? ids : [...ids].reverse();
    return (
      <div className="reorder-root">
        <button
          type="button"
          className="toggle-order"
          onclick={() => {
            mode = mode === "asc" ? "desc" : "asc";
            update(this);
          }}
        >
          toggle
        </button>
        <div className="list">
          {ordered.map((id) => <KeyItem key={id} id={id} />)}
        </div>
        <span className="mode">{mode}</span>
      </div>
    );
  };
}

/**
 * Root that can remove one keyed item from the middle of a list.
 * @returns Reactive render function producing keyed children; one can be removed.
 */
function KeyedRemovalRoot(this: HTMLElement) {
  let removed = false;
  const keys = ["a", "b", "c"];
  return () => {
    const active = removed ? keys.filter((k) => k !== "b") : keys;
    return (
      <div className="removal-root">
        <button
          type="button"
          className="remove-b"
          onclick={() => {
            removed = true;
            update(this);
          }}
        >
          remove-b
        </button>
        <div className="list">
          {active.map((k) => (
            <span key={k} className={"rem-item rem-" + k}>
              {k}
            </span>
          ))}
        </div>
        <span className="removed-flag">{String(removed)}</span>
      </div>
    );
  };
}

/**
 * Component counting renders used to verify key-based remount vs retained instance.
 * @returns Reactive render function incrementing render count.
 */
function RenderCounter() {
  let renders = 0;
  return () => <div className="render-counter">renders:{++renders}</div>;
}

/**
 * Root that hosts a single RenderCounter with a dynamic key and buttons for
 * re-rendering with same key or flipping to a different key.
 * @returns Reactive render function producing controls and keyed child.
 */
function KeySwapRoot(this: HTMLElement) {
  let keyValue = "a";
  return () => (
    <div className="key-swap-root">
      <button
        type="button"
        className="rerender-same"
        onclick={() => {
          update(this);
        }}
      >
        rerender
      </button>
      <button
        type="button"
        className="flip-key"
        onclick={() => {
          keyValue = keyValue === "a" ? "b" : "a";
          update(this);
        }}
      >
        flip-key
      </button>
      <RenderCounter key={keyValue} />
      <span className="current-key">{keyValue}</span>
    </div>
  );
}

/** keyed reorder preserves node identity while changing order */
test("keyed-reorder-preserves-instances", async () => {
  const root = await mount(<KeyedReorderRoot />, document.body);
  const list = root.querySelector(".list")!;
  const toggleBtn = root.querySelector(".toggle-order") as HTMLButtonElement;

  const initialNodes = Array.from(
    list.querySelectorAll(".key-item"),
  ) as HTMLElement[];
  assert.equal(initialNodes.length, 4);
  const initialMap = new Map(
    initialNodes.map((n) => [n.textContent!.split(":")[0], n]),
  );

  toggleBtn.click();
  await Promise.resolve();

  const afterNodes = Array.from(
    list.querySelectorAll(".key-item"),
  ) as HTMLElement[];
  assert.equal(afterNodes.length, 4);
  const afterMap = new Map(
    afterNodes.map((n) => [n.textContent!.split(":")[0], n]),
  );

  // Each key should still map to the same element instance (identity preserved)
  for (const [key, node] of initialMap) {
    assert.equal(afterMap.get(key), node);
  }

  // Order should have reversed (first and last swapped)
  assert.true(
    afterNodes[0] === initialMap.get("d") &&
      afterNodes[afterNodes.length - 1] === initialMap.get("a"),
    "Order reversed but nodes reused",
  );
});

/** keyed removal removes only target key and preserves others */
test("keyed-removal-preserves-others", async () => {
  const root = await mount(<KeyedRemovalRoot />, document.body);
  const list = root.querySelector(".list")!;
  const removeBtn = root.querySelector(".remove-b") as HTMLButtonElement;

  const before = Array.from(list.children) as HTMLElement[];
  assert.equal(before.length, 3);
  const aNode = before.find((n) => n.textContent === "a")!;
  const bNode = before.find((n) => n.textContent === "b")!;
  const cNode = before.find((n) => n.textContent === "c")!;

  removeBtn.click();
  await Promise.resolve();

  const after = Array.from(list.children) as HTMLElement[];
  assert.equal(after.length, 2);
  const texts = after.map((n) => n.textContent);
  assert.excludes(texts, "b");
  assert.true(after.includes(aNode));
  assert.true(after.includes(cNode));
  assert.true(!document.body.contains(bNode), "Removed node not in DOM");
});

/** key flip remounts component (counter resets) while same key rerender increments */
test("key-flip-remounts", async () => {
  const root = await mount(<KeySwapRoot />, document.body);
  const rerenderBtn = root.querySelector(".rerender-same") as HTMLButtonElement;
  const flipBtn = root.querySelector(".flip-key") as HTMLButtonElement;

  const counter = () => root.querySelector(".render-counter") as HTMLElement;

  assert.contains(counter().textContent, "renders:1");

  rerenderBtn.click();
  await Promise.resolve();
  assert.contains(counter().textContent, "renders:2");

  rerenderBtn.click();
  await Promise.resolve();
  assert.contains(counter().textContent, "renders:3");

  flipBtn.click();
  await Promise.resolve();
  // Key changed; instance should remount resetting count to 1
  assert.contains(counter().textContent, "renders:1");

  rerenderBtn.click();
  await Promise.resolve();
  assert.contains(counter().textContent, "renders:2");
});

await test.run();
