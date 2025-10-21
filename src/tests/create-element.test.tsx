import { assert, clock, test } from "jsr:@marcisbee/rion";
import { createElement, createRoot } from "../main.ts";
import { mount } from "../../test/utils.ts";

/* -----------------------------------------------------------------------------
   Tests for createElement covering:
   - primitive children (string, number, boolean, null, undefined)
   - array/nested children flattening
   - component children (function component)
   - subscribable children (object with subscribe emitting multiple values)
----------------------------------------------------------------------------- */

test("primitives", async () => {
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
  assert.ok(div, "div should exist");
  assert.ok(
    div.textContent?.includes("hello42"),
    "text content should concatenate primitives",
  );

  // Count comment nodes (false, null, undefined => 3 comments)
  let commentCount = 0;
  for (const child of Array.from(div.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) commentCount++;
  }
  assert.is(commentCount, 3);
});

test("array-flatten", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const { render } = createRoot(container);

  const nested = <div>{["a", ["b", ["c"]], null]}</div>;
  render(nested);

  const div = container.querySelector("div")!;
  assert.ok(div, "div should exist");
  assert.ok(
    div.textContent?.includes("abc"),
    "flattened text should be present",
  );

  // Expect at least one comment for null
  const comments = Array.from(div.childNodes).filter((n) =>
    n.nodeType === Node.COMMENT_NODE &&
    /null/.test((n as Comment).textContent || "")
  );
  assert.ok(comments.length >= 1, "null should produce a comment node");
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
  assert.ok(div, "component inner div should exist");
  assert.is(div.textContent, "Xchild");
  assert.is(
    mounted.tagName.toLowerCase().startsWith("cmp-examplecomponent"),
    true,
  );
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
  assert.ok(div, "div should exist");
  // After initial synchronous emission
  assert.equal(div.textContent, "first");

  // Wait for second emission microtask
  await clock.fastForward(10);
  assert.equal(div.textContent, "second");
});

await test.run();
