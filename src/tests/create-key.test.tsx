import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { createKey, update } from "../client.ts";

test("createKey: renders component with key", async () => {
  function Counter() {
    let count = 0;
    return () => <div className="counter">{count++}</div>;
  }

  function App() {
    return <div>{() => createKey(() => <Counter />, "counter-1")}</div>;
  }

  const root = await mount(<App />, document.body);
  const counter = root.querySelector(".counter");

  assert.equal(counter?.textContent, "0");
});

test("createKey: preserves component instance when key unchanged", async () => {
  function Counter() {
    let count = 0;
    return () => (
      <div className="counter">
        <span className="count">{count++}</span>
      </div>
    );
  }

  let keyValue = "counter-1";

  function App() {
    return <div>{() => createKey(() => <Counter />, keyValue)}</div>;
  }

  const root = await mount(<App />, document.body);
  const firstNode = root.querySelector(".counter");

  assert.equal(root.querySelector(".count")?.textContent, "0");

  update(root);

  // Component instance preserved, so count increments
  const secondNode = root.querySelector(".counter");
  assert.equal(secondNode, firstNode);
  assert.equal(root.querySelector(".count")?.textContent, "1");

  update(root);

  // Still same instance
  const thirdNode = root.querySelector(".counter");
  assert.equal(thirdNode, firstNode);
  assert.equal(root.querySelector(".count")?.textContent, "2");
});

test("createKey: remounts component when key changes", async () => {
  function Counter() {
    let count = 0;
    return () => (
      <div className="counter">
        <span className="count">{count++}</span>
      </div>
    );
  }

  let keyValue = "counter-1";

  function App() {
    return <div>{() => createKey(() => <Counter />, keyValue)}</div>;
  }

  const root = await mount(<App />, document.body);
  const firstNode = root.querySelector(".counter");

  assert.equal(root.querySelector(".count")?.textContent, "0");

  update(root);

  // Same key, same instance, count increments
  const secondNode = root.querySelector(".counter");
  assert.equal(secondNode, firstNode);
  assert.equal(root.querySelector(".count")?.textContent, "1");

  keyValue = "counter-2";
  update(root);

  // Key changed, new instance created, count resets
  const thirdNode = root.querySelector(".counter");
  assert.notEqual(thirdNode, firstNode);
  assert.equal(root.querySelector(".count")?.textContent, "0");

  update(root);

  // Same key again, count increments from reset
  const fourthNode = root.querySelector(".counter");
  assert.equal(fourthNode, thirdNode);
  assert.equal(root.querySelector(".count")?.textContent, "1");
});

test("createKey: works with simple elements", async () => {
  let keyValue = "a";
  let content = "Content A";

  function App() {
    return (
      <div>
        {() =>
          createKey(
            () => <span className="content">{content}</span>,
            keyValue,
          )}
      </div>
    );
  }

  const root = await mount(<App />, document.body);
  const firstNode = root.querySelector(".content");

  assert.equal(firstNode?.textContent, "Content A");

  content = "Content B";
  update(root);

  const secondNode = root.querySelector(".content");
  assert.equal(secondNode, firstNode);
  assert.equal(secondNode?.textContent, "Content A");

  keyValue = "b";
  update(root);

  const thirdNode = root.querySelector(".content");
  assert.notEqual(thirdNode, firstNode);
  assert.equal(thirdNode?.textContent, "Content B");
});

test("createKey: disconnects old node when key changes", async () => {
  let keyValue = "key-1";
  let componentId = "id-1";

  function App() {
    return (
      <div>
        {() =>
          createKey(
            () => <div className="component">{componentId}</div>,
            keyValue,
          )}
      </div>
    );
  }

  const root = await mount(<App />, document.body);
  const firstNode = root.querySelector(".component");

  assert.equal(firstNode?.textContent, "id-1");
  assert.true(document.body.contains(firstNode!));

  keyValue = "key-2";
  componentId = "id-2";
  update(root);

  assert.true(!document.body.contains(firstNode!));

  const secondNode = root.querySelector(".component");
  assert.equal(secondNode?.textContent, "id-2");
  assert.true(document.body.contains(secondNode!));
});

test("createKey: handles null and undefined keys", async () => {
  function Counter() {
    let count = 0;
    return () => <div className="counter">{count++}</div>;
  }

  let keyValue: any = null;

  function App() {
    return <div>{() => createKey(() => <Counter />, keyValue)}</div>;
  }

  const root = await mount(<App />, document.body);
  const firstNode = root.querySelector(".counter");

  assert.equal(firstNode?.textContent, "0");

  update(root);
  // null key preserved
  const secondNode = root.querySelector(".counter");
  assert.equal(secondNode, firstNode);
  assert.equal(secondNode?.textContent, "1");

  keyValue = undefined;
  update(root);
  // null to undefined is a key change
  const thirdNode = root.querySelector(".counter");
  assert.notEqual(thirdNode, firstNode);
  assert.equal(thirdNode?.textContent, "0");

  keyValue = "key-1";
  update(root);
  // undefined to "key-1" is a key change
  const fourthNode = root.querySelector(".counter");
  assert.notEqual(fourthNode, thirdNode);
  assert.equal(fourthNode?.textContent, "0");
});

test("createKey: replaces non keyed elements properly", async () => {
  let type = 0;

  function Test() {
    let count = 0;
    return () => {
      if (type === 0) {
        return <div className="1">{count++}</div>;
      }

      return createKey(() => <div className="2">{count++}</div>, "never");
    };
  }

  const root = await mount(<Test />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <!--$--><div class="1">0</div>
    </host>
    `,
  );

  type = 2;
  update(root);

  assert.snapshot.html(
    root,
    `
    <host>
      <!--$--><div class="2">1</div>
    </host>
    `,
  );
});

test("createKey: replaces non keyed elements properly 2", async () => {
  let type = 0;

  function Foo() {
    return <div>Foo</div>;
  }

  function Bar() {
    return <div>Bar</div>;
  }

  function Test() {
    let count = 0;
    return () => {
      if (type === 0) {
        return <Foo>{count++}</Foo>;
      }

      return createKey(() => <Bar>{count++}</Bar>, "never");
    };
  }

  const root = await mount(<Test />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <!--$--><host><div>Foo</div></host>
    </host>
    `,
  );

  type = 2;
  update(root);

  assert.snapshot.html(
    root,
    `
    <host>
      <!--$--><host><div>Bar</div></host>
    </host>
    `,
  );
});

test("createKey: replaces different keyed elements properly 2", async () => {
  let type = 0;

  function Foo(props: JSX.PropsWithChildren) {
    return <div>Foo:{props().children}</div>;
  }

  function Bar(props: JSX.PropsWithChildren) {
    return <div>Bar:{props().children}</div>;
  }

  function Test() {
    let count = 0;
    return () => {
      if (type === 0) {
        return createKey(() => <Foo>{count++}</Foo>, "1");
      }

      return createKey(() => <Bar>{count++}</Bar>, "2");
    };
  }

  const root = await mount(<Test />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <!--$--><host><div>Foo:0</div></host>
    </host>
    `,
  );

  type = 2;
  update(root);

  assert.snapshot.html(
    root,
    `
    <host>
      <!--$--><host><div>Bar:1</div></host>
    </host>
    `,
  );
});

test("createKey: replaces different keyed elements properly 3", async () => {
  let type = 0;

  function PassThru(props: JSX.PropsWithChildren) {
    return <section>{() => props().children} {() => type}</section>;
    // return [() => props().children, () => type];
  }

  function Foo(props: JSX.PropsWithChildren) {
    return <div>Foo:{props().children}</div>;
  }

  function Bar(props: JSX.PropsWithChildren) {
    return <div>Bar:{props().children}</div>;
  }

  function Test() {
    let count = 0;
    return (
      <PassThru>
        <div>
          {() =>
            createKey(
              () => type === 0 ? <Foo>{count++}</Foo> : <Bar>{count++}</Bar>,
              type,
            )}
        </div>
      </PassThru>
    );
  }

  const root = await mount(<Test />, document.body);

  assert.snapshot.html(
    root,
    `
    <host><host><section><!--$--><div><!--$--><host><div>Foo:0</div></host></div><!--$-->0</section></host></host>
    `,
  );

  type = 2;
  update(root);
  await Promise.resolve();

  assert.snapshot.html(
    root,
    `
    <host><host><section><!--$--><div><!--$--><host><div>Bar:1</div></host></div><!--$-->2</section></host></host>
    `,
  );
});

await test.run();
