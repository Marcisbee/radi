import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { createElement, update } from "../client.ts";

test("base", async () => {
  function Child(props: JSX.Props<{ value: number }>) {
    let renders = 0;
    return () => (
      <div className="child-count">{++renders} : {props().value}</div>
    );
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
        {() => <Child value={count} />}
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  const button = root.querySelector("button")!;
  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "2 : 1");

  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "3 : 2");
});

test("Child embedded in Parent", async () => {
  function Child(props: JSX.Props<{ value: number }>) {
    let renders = 0;
    return () => (
      <div className="child-count">{++renders} : {props().value}</div>
    );
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
        {() => <Child key={String(count)} value={count} />}
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  const button = root.querySelector("button")!;
  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 1");

  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 2");
});

test("Child passthrough Parent 1", async () => {
  function Child(props: JSX.Props<{ value: number }>) {
    let renders = 0;
    return () => (
      <div className="child-count">{++renders} : {props().value}</div>
    );
  }

  function Passthrough(props: JSX.PropsWithChildren) {
    return () => props().children;
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
        <Passthrough>
          {() => <Child key={String(count)} value={count} />}
        </Passthrough>
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  const button = root.querySelector("button")!;
  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 1");

  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 2");
});

test("Child passthrough Parent 2", async () => {
  function Child(props: JSX.Props<{ value: number }>) {
    let renders = 0;
    return () => (
      <div className="child-count">{++renders} : {props().value}</div>
    );
  }

  function Passthrough(props: JSX.PropsWithChildren) {
    return <div>{() => props().children}</div>;
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
        <Passthrough>
          {() => <Child key={String(count)} value={count} />}
        </Passthrough>
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  const button = root.querySelector("button")!;
  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 1");

  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 2");
});

test("Child passthrough Parent 3", async () => {
  function Child(props: JSX.Props<{ value: number }>) {
    let renders = 0;
    return () => (
      <div className="child-count">{++renders} : {props().value}</div>
    );
  }

  function Passthrough(props: JSX.PropsWithChildren) {
    return <div>{() => props().children}</div>;
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
        <Passthrough>
          <div>
            {() => <Child key={String(count)} value={count} />}
          </div>
        </Passthrough>
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  const button = root.querySelector("button")!;
  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 1");

  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 2");
});

test("Child passthrough Parent 4", async () => {
  function Child(props: JSX.Props<{ value: number }>) {
    let renders = 0;
    return () => (
      <div className="child-count">{++renders} : {props().value}</div>
    );
  }

  function Passthrough(props: JSX.PropsWithChildren) {
    const template = createElement("suspense", {
      style: () => ({ display: "contents" }),
    }, () => props().children);

    return [template];
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
        <Passthrough>
          <div>
            {() => <Child key={String(count)} value={count} />}
          </div>
        </Passthrough>
      </div>
    );
  }

  const root = await mount(<Parent />, document.body);

  const button = root.querySelector("button")!;
  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 1");

  button.click();

  assert.equal(root.querySelector(".child-count")!.textContent, "1 : 2");
});

await test.run();
