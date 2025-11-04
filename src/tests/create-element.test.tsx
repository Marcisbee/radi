import { assert, clock, test } from "@marcisbee/rion/test";
import { createElement, createRoot } from "../client.ts";
import { mount } from "../../test/utils.ts";

/* -----------------------------------------------------------------------------
   Tests for createElement covering:
   - primitive children (string, number, boolean, null, undefined)
   - array/nested children flattening
   - component children (function component)
   - subscribable children (object with subscribe emitting multiple values)
----------------------------------------------------------------------------- */

test("primitives", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const { render } = createRoot(host);

  const node = createElement(
    "div",
    null,
    "hello",
    42,
    false,
    null,
    undefined,
  );

  render(node as any);

  const div = host.querySelector("div")!;
  assert.exists(div);
  assert.contains(div.textContent, "hello42");

  // Count comment nodes (false, null, undefined => 3 comments)
  let commentCount = 0;
  for (const child of Array.from(div.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) commentCount++;
  }
  assert.equal(commentCount, 3);
});

test("array-flatten", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const { render } = createRoot(container);

  const nested = <div>{["a", ["b", ["c"]], null]}</div>;
  render(nested);

  const div = container.querySelector("div")!;
  assert.exists(div);
  assert.contains(div.textContent, "abc");

  // Expect at least one comment for null
  const comments = Array.from(div.childNodes).filter((n) =>
    n.nodeType === Node.COMMENT_NODE &&
    /null/.test((n as Comment).textContent || "")
  );
  assert.exists(comments.length >= 1);
});

function ExampleComponent(
  this: DocumentFragment,
  propsGetter: () => { value: string; children?: any },
) {
  const props = propsGetter();
  return (
    <div className="ex">
      {props.value}
      {props.children}
    </div>
  );
}

test("component", async () => {
  const mounted = await mount(
    <ExampleComponent value="X">child</ExampleComponent>,
    document.body,
  );

  const div = mounted.querySelector(".ex")!;
  assert.exists(div);
  assert.equal(div.textContent, "Xchild");
  assert.equal(mounted.tagName, "HOST");
});

test("subscribable", async () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const { render } = createRoot(host);

  // Simple subscribable that emits twice
  const store = {
    subscribe(fn: (v: string) => void) {
      fn("first");
      setTimeout(() => fn("second"), 10);
    },
  };

  render(<div>{store}</div>);
  await Promise.resolve(); // Wait for initial render

  const div = host.querySelector("div")!;
  assert.exists(div);
  // After initial synchronous emission
  assert.equal(div.textContent, "first");

  // Wait for second emission microtask
  await clock.fastForward(10);
  assert.equal(div.textContent, "second");
});

await test.run();
