import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { createList, update } from "../client.ts";

test("sanity", async () => {
  function App(this: HTMLElement) {
    return <div>Hello</div>;
  }

  const container = await mount(<App />, document.body);
  assert.equal(container.textContent, "Hello");
});

test("createList: renders simple keyed list", async () => {
  const items = [
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
    { id: 3, text: "Item 3" },
  ];

  function App(this: HTMLElement) {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) => key(() => <li>{item.text}</li>, item.id))
          )}
      </ul>
    );
  }

  const container = await mount(<App />, document.body);

  const listItems = container.querySelectorAll("li");
  assert.equal(listItems.length, 3);
  assert.equal(listItems[0].textContent, "Item 1");
  assert.equal(listItems[1].textContent, "Item 2");
  assert.equal(listItems[2].textContent, "Item 3");
});

test("createList: starts with 0", async () => {
  let items: any[] = [];

  function App(this: HTMLElement) {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) => key(() => <li>{item.text}</li>, item.id))
          )}
      </ul>
    );
  }

  const container = await mount(<App />, document.body);

  const firstRenderNodes = Array.from(container.querySelectorAll("li"));

  items = [
    { id: 2, text: "Item 2 Updated" },
    { id: 1, text: "Item 1 Updated" },
  ];

  update(container);

  const secondRenderNodes = Array.from(container.querySelectorAll("li"));

  assert.equal(firstRenderNodes.length, 0);
  assert.equal(secondRenderNodes.length, 2);
});

test("createList: ends with 0", async () => {
  let items = [
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
  ];

  function App(this: HTMLElement) {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) => key(() => <li>{item.text}</li>, item.id))
          )}
      </ul>
    );
  }

  const container = await mount(<App />, document.body);

  const firstRenderNodes = Array.from(container.querySelectorAll("li"));

  items = [];

  update(container);

  const secondRenderNodes = Array.from(container.querySelectorAll("li"));

  assert.equal(firstRenderNodes.length, 2);
  assert.equal(secondRenderNodes.length, 0);
});

test("createList: reuses nodes when keys match", async () => {
  let items = [
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
  ];

  function App(this: HTMLElement) {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) => key(() => <li>{item.text}</li>, item.id))
          )}
      </ul>
    );
  }

  const container = await mount(<App />, document.body);

  const firstRenderNodes = Array.from(container.querySelectorAll("li"));

  items = [
    { id: 2, text: "Item 2 Updated" },
    { id: 1, text: "Item 1 Updated" },
  ];

  update(container);

  const secondRenderNodes = Array.from(container.querySelectorAll("li"));

  assert.equal(secondRenderNodes.length, 2);
  assert.equal(firstRenderNodes[0], secondRenderNodes[1]);
  assert.equal(firstRenderNodes[1], secondRenderNodes[0]);
});

test("createList: adds new items with new keys", async () => {
  let items = [
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
  ];

  function App(this: HTMLElement) {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) => key(() => <li>{item.text}</li>, item.id))
          )}
      </ul>
    );
  }

  const container = await mount(<App />, document.body);

  assert.equal(container.querySelectorAll("li").length, 2);

  items = [
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
    { id: 3, text: "Item 3" },
  ];

  update(container);

  const listItems = container.querySelectorAll("li");
  assert.equal(listItems.length, 3);
  assert.equal(listItems[2].textContent, "Item 3");
});

test("createList: removes items when keys are missing", async () => {
  let items = [
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
    { id: 3, text: "Item 3" },
  ];

  function App(this: HTMLElement) {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) => key(() => <li>{item.text}</li>, item.id))
          )}
      </ul>
    );
  }

  const container = await mount(<App />, document.body);

  assert.equal(container.querySelectorAll("li").length, 3);

  items = [
    { id: 1, text: "Item 1" },
    { id: 3, text: "Item 3" },
  ];

  update(container);

  const listItems = container.querySelectorAll("li");
  assert.equal(listItems.length, 2);
  assert.equal(listItems[0].textContent, "Item 1");
  assert.equal(listItems[1].textContent, "Item 3");
});

test("createList: handles empty lists", async () => {
  const items: Array<{ id: number; text: string }> = [];

  function App(this: HTMLElement) {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) => key(() => <li>{item.text}</li>, item.id))
          )}
      </ul>
    );
  }

  const container = await mount(<App />, document.body);

  assert.equal(container.querySelectorAll("li").length, 0);
});

test("createList: handles list going from empty to filled", async () => {
  let items: Array<{ id: number; text: string }> = [];

  function App(this: HTMLElement) {
    return (
      <ul>
        {() =>
          createList((key) =>
            items.map((item) => key(() => <li>{item.text}</li>, item.id))
          )}
      </ul>
    );
  }

  const container = await mount(<App />, document.body);

  assert.equal(container.querySelectorAll("li").length, 0);

  items = [
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
  ];

  update(container);

  assert.equal(container.querySelectorAll("li").length, 2);
});

await test.run();
