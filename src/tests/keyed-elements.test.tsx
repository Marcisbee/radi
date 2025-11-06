import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { createList, update } from "../client.ts";
import { locator } from "@marcisbee/rion/locator";

/** keyed reorder preserves node identity while changing order */
test("keyed-reorder-preserves-instances", async () => {
  let items = [
    { id: "a" },
    { id: "b" },
  ];

  function KeyedReorderRoot() {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) =>
              key(() => <li className="key-item">{item.id}</li>, item.id)
            )
          )}
      </ul>
    );
  }

  const root = await mount(<KeyedReorderRoot />, document.body);

  const firstRenderNodes = Array.from(
    root.querySelectorAll(".key-item"),
  ) as HTMLElement[];
  assert.equal(firstRenderNodes.length, 2);

  items = items.reverse();
  update(root);

  const secondRenderNodes = Array.from(
    root.querySelectorAll(".key-item"),
  ) as HTMLElement[];
  assert.equal(secondRenderNodes.length, 2);

  // Nodes should be reused but in reversed order
  assert.equal(firstRenderNodes[0], secondRenderNodes[1]);
  assert.equal(firstRenderNodes[1], secondRenderNodes[0]);
});

/** keyed removal removes only target key and preserves others */
test("keyed-removal-preserves-others", async () => {
  let items = [
    { id: "a" },
    { id: "b" },
    { id: "c" },
  ];

  function KeyedRemovalRoot() {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) =>
              key(
                () => (
                  <li className={"rem-item rem-" + item.id}>
                    {item.id}
                  </li>
                ),
                item.id,
              )
            )
          )}
      </ul>
    );
  }

  const root = await mount(<KeyedRemovalRoot />, document.body);

  const before = Array.from(root.querySelectorAll("li")) as HTMLElement[];
  assert.equal(before.length, 3);
  const aNode = before.find((n) => n.textContent === "a")!;
  const bNode = before.find((n) => n.textContent === "b")!;
  const cNode = before.find((n) => n.textContent === "c")!;

  items = items.filter((item) => item.id !== "b");
  update(root);

  const after = Array.from(root.querySelectorAll("li")) as HTMLElement[];
  assert.equal(after.length, 2);
  const texts = after.map((n) => n.textContent);
  assert.excludes(texts, "b");
  assert.true(after.includes(aNode));
  assert.true(after.includes(cNode));
  assert.true(!document.body.contains(bNode), "Removed node not in DOM");
});

test("keyed reorder only 2, don't re-render rest", async () => {
  let items = [
    { id: "a" },
    { id: "b" },
    { id: "c" },
    { id: "d" },
  ];

  function Test() {
    let renderCount = 0;
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) =>
              key(
                () => (
                  <li>
                    <span>{renderCount++}</span>
                    <strong>{item.id}</strong>
                  </li>
                ),
                item.id,
              )
            )
          )}
      </ul>
    );
  }

  const root = await mount(<Test />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <ul>
        <!--$-->
        <li>
          <span>0</span>
          <strong>a</strong>
        </li>
        <li>
          <span>1</span>
          <strong>b</strong>
        </li>
        <li>
          <span>2</span>
          <strong>c</strong>
        </li>
        <li>
          <span>3</span>
          <strong>d</strong>
        </li>
      </ul>
    </host>
  `,
  );

  items = items = [
    { id: "c" },
    { id: "b" },
    { id: "a" },
    { id: "d" },
  ];
  update(root);

  assert.snapshot.html(
    root,
    `
    <host>
      <ul>
        <!--$-->
        <li>
          <span>4</span>
          <strong>c</strong>
        </li>
        <li>
          <span>1</span>
          <strong>b</strong>
        </li>
        <li>
          <span>5</span>
          <strong>a</strong>
        </li>
        <li>
          <span>3</span>
          <strong>d</strong>
        </li>
      </ul>
    </host>
  `,
  );
});

test("keyed reorder only 2, preserve instances", async () => {
  let items = [
    { id: "a" },
    { id: "b" },
    { id: "c" },
    { id: "d" },
  ];

  function Test() {
    let renderCount = 0;
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) =>
              key(
                () => (
                  <li>
                    <span>{renderCount++}</span>
                    <strong>{item.id}</strong>
                  </li>
                ),
                item.id,
              )
            )
          )}
      </ul>
    );
  }

  const root = await mount(<Test />, document.body);

  const li1 = await locator("li", root).getAll();

  items = items = [
    { id: "c" },
    { id: "b" },
    { id: "a" },
    { id: "d" },
  ];
  update(root);

  const li2 = await locator("li", root).getAll();

  assert.equal(li1[0], li2[2]);
  assert.equal(li1[1], li2[1]);
  assert.equal(li1[3], li2[3]);
});

await test.run();
