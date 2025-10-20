import { assert, test } from "jsr:@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

let trace: string[] = [];

test.before.each(() => {
  trace = [];
});

function ListChild(this: HTMLElement) {
  let items = ["A", "B", "C"];
  return (
    <button
      onclick={() => {
        items = items.slice().reverse();
        update(this);
      }}
    >
      {items.map((item) => <span>#{() => (trace.push(item), item)}</span>)}
    </button>
  );
}

function ListParent(this: HTMLElement) {
  let items = ["A", "B", "C"];
  return (
    <button
      onclick={() => {
        items = items.slice().reverse();
        update(this);
      }}
    >
      {() => items.map((item) => <span>#{(trace.push(item), item)}</span>)}
    </button>
  );
}

function ListBoth(this: HTMLElement) {
  let items = ["A", "B", "C"];
  return (
    <button
      onclick={() => {
        items = items.slice().reverse();
        update(this);
      }}
    >
      {() =>
        items.map((item) => <span>#{() => (trace.push(item), item)}</span>)}
    </button>
  );
}

test("render parent", async () => {
  const container = await mount(<ListParent />, document.body);

  assert.snapshot.html(
    container,
    `<cmp-listparent style="display: contents;">
      <button>
        <!--(-->
          <span>#A</span>
          <span>#B</span>
          <span>#C</span>
        <!--)-->
      </button>
    </cmp-listparent>`,
  );
});

test("render child", async () => {
  const container = await mount(<ListChild />, document.body);

  assert.snapshot.html(
    container,
    `<cmp-listchild style="display: contents;">
      <button>
        <span>#<!--(-->A<!--)--></span>
        <span>#<!--(-->B<!--)--></span>
        <span>#<!--(-->C<!--)--></span>
      </button>
    </cmp-listchild>`,
  );
});

test("render both", async () => {
  const container = await mount(<ListBoth />, document.body);

  assert.snapshot.html(
    container,
    `<cmp-listboth style="display: contents;">
      <button>
        <!--(-->
          <span>#<!--(-->A<!--)--></span>
          <span>#<!--(-->B<!--)--></span>
          <span>#<!--(-->C<!--)--></span>
        <!--)-->
      </button>
    </cmp-listboth>`,
  );
});

test("mutate parent", async () => {
  const container = await mount(<ListParent />, document.body);

  container.querySelector("button")!.click();

  assert.snapshot.html(
    container,
    `<cmp-listparent style="display: contents;">
      <button>
        <!--(-->
          <span>#C</span>
          <span>#B</span>
          <span>#A</span>
        <!--)-->
      </button>
    </cmp-listparent>`,
  );

  await Promise.resolve();
  assert.equal(trace, ["A", "B", "C", "C", "B", "A"]);
});

test("mutate child", async () => {
  const container = await mount(<ListChild />, document.body);

  container.querySelector("button")!.click();

  assert.snapshot.html(
    container,
    `<cmp-listchild style="display: contents;">
      <button>
        <span>#<!--(-->A<!--)--></span>
        <span>#<!--(-->B<!--)--></span>
        <span>#<!--(-->C<!--)--></span>
      </button>
    </cmp-listchild>`,
  );

  await Promise.resolve();
  assert.equal(trace, ["A", "B", "C", "A", "B", "C"]);
});

test("mutate both", async () => {
  const container = await mount(<ListBoth />, document.body);

  container.querySelector("button")!.click();

  assert.snapshot.html(
    container,
    `<cmp-listboth style="display: contents;">
      <button>
        <!--(-->
          <span>#<!--(-->C<!--)--></span>
          <span>#<!--(-->B<!--)--></span>
          <span>#<!--(-->A<!--)--></span>
        <!--)-->
      </button>
    </cmp-listboth>`,
  );

  await Promise.resolve();
  assert.equal(trace, ["A", "B", "C", "C", "B", "A"]);
});

await test.run();
