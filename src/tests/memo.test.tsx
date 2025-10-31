import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { memo, update } from "../client.ts";

function Memo6() {
  let i = 0;
  return () => <span>Memo6:{memo(() => i++, () => false)}</span>;
}

function Memo5() {
  let i = 0;
  return memo(() => <span>Memo5:{i++}</span>, () => false);
}

function Memo4() {
  let i = 0;
  return () => <span>Memo4:{memo(() => i++, () => true)}</span>;
}

function Memo3() {
  let i = 0;
  return memo(() => <span>Memo3:{i++}</span>, () => true);
}

function Memo2() {
  let i = 0;
  return <span>Memo2:{() => i++}</span>;
}

function Memo1() {
  let i = 0;
  return () => <span>Memo1:{i++}</span>;
}

function MemoGroup1() {
  return (
    <div>
      <Memo1 />
      <Memo2 />
      <Memo3 />
      <Memo4 />
      <Memo5 />
      <Memo6 />
    </div>
  );
}

function MemoGroup2() {
  return (
    <div>
      {() => "Hello"}
      <Memo1 />
      <Memo2 />
      <Memo3 />
      <Memo4 />
      <Memo5 />
      <Memo6 />
    </div>
  );
}

function MemoGroup3() {
  return () => (
    <div>
      <Memo1 />
      <Memo2 />
      <Memo3 />
      <Memo4 />
      <Memo5 />
      <Memo6 />
    </div>
  );
}

function MemoGroup4() {
  return (
    <div>
      <Memo1 />
      <Memo2 />
      {() => <Memo3 />}
      <Memo4 />
      <Memo5 />
      <Memo6 />
    </div>
  );
}

function MemoLoop(this: HTMLElement) {
  const items = [1, 2, 3];

  let lastItemCountStatic = items.length;
  let lastItemCountEventable = items.length;

  return (
    <>
      <button
        type="button"
        onclick={() => {
          items.push(items.length + 1);
          update(this);
        }}
      >
        Add
      </button>
      <button
        type="button"
        onclick={() => {
          items.reverse();
          update(this);
        }}
      >
        Reverse
      </button>
      <div>
        <hr data-static />
        {items.map((i, index) => (
          <div>
            {i} : {index}
          </div>
        ))}
        <hr data-eventable />
        {() =>
          items.map((i, index) => (
            <div>
              {i} : {index}
            </div>
          ))}
        <hr data-memo-static />
        {memo(() =>
          items.map((i, index) => (
            <div>
              {i} : {index}
            </div>
          )), () => {
          const changed = lastItemCountStatic !== items.length;
          lastItemCountStatic = items.length;
          return !changed;
        })}
        <hr data-memo-eventable />
        {memo(() =>
          items.map((i, index) => (
            <div>
              {() => items[index]} : {index}
            </div>
          )), () => {
          const changed = lastItemCountEventable !== items.length;
          lastItemCountEventable = items.length;
          return !changed;
        })}
      </div>
    </>
  );
}

test("Memo1 re-renders correctly", async () => {
  const container = await mount(<Memo1 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo1:0</span>`,
  );

  update(container);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo1:1</span>`,
  );
});

test("Memo2 re-renders correctly", async () => {
  const container = await mount(<Memo2 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<span>Memo2:<!--$-->0</span>`,
  );

  update(container);

  assert.snapshot.html(
    container.innerHTML,
    `<span>Memo2:<!--$-->1</span>`,
  );
});

test("Memo3 re-renders correctly", async () => {
  const container = await mount(<Memo3 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo3:0</span>`,
  );

  update(container);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo3:0</span>`,
  );
});

test("Memo4 re-renders correctly", async () => {
  const container = await mount(<Memo4 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo4:<!--$-->0</span>`,
  );

  update(container);
  await Promise.resolve();

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo4:<!--$-->0</span>`,
  );
});

test("Memo5 re-renders correctly", async () => {
  const container = await mount(<Memo5 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo5:0</span>`,
  );

  update(container);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo5:1</span>`,
  );
});

test("Memo6 re-renders correctly", async () => {
  const container = await mount(<Memo6 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo6:<!--$-->0</span>`,
  );

  update(container);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$--><span>Memo6:<!--$-->1</span>`,
  );
});

test("MemoGroup1 re-renders correctly", async () => {
  const container = await mount(<MemoGroup1 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<div>
      <host><!--$--><span>Memo1:0</span></host>
      <host><span>Memo2:<!--$-->0</span></host>
      <host><!--$--><span>Memo3:0</span></host>
      <host><!--$--><span>Memo4:<!--$-->0</span></host>
      <host><!--$--><span>Memo5:0</span></host>
      <host><!--$--><span>Memo6:<!--$-->0</span></host>
    </div>`,
  );

  update(container);

  assert.snapshot.html(
    container.innerHTML,
    `<div>
      <host><!--$--><span>Memo1:1</span></host>
      <host><span>Memo2:<!--$-->1</span></host>
      <host><!--$--><span>Memo3:0</span></host>
      <host><!--$--><span>Memo4:<!--$-->0</span></host>
      <host><!--$--><span>Memo5:1</span></host>
      <host><!--$--><span>Memo6:<!--$-->1</span></host>
    </div>`,
  );
});

test("MemoGroup2 re-renders correctly", async () => {
  const container = await mount(<MemoGroup2 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<div>
      <!--$-->Hello<host><!--$--><span>Memo1:0</span></host>
      <host><span>Memo2:<!--$-->0</span></host>
      <host><!--$--><span>Memo3:0</span></host>
      <host><!--$--><span>Memo4:<!--$-->0</span></host>
      <host><!--$--><span>Memo5:0</span></host>
      <host><!--$--><span>Memo6:<!--$-->0</span></host>
    </div>`,
  );

  update(container);

  assert.snapshot.html(
    container.innerHTML,
    `<div>
      <!--$-->Hello<host><!--$--><span>Memo1:1</span></host>
      <host><span>Memo2:<!--$-->1</span></host>
      <host><!--$--><span>Memo3:0</span></host>
      <host><!--$--><span>Memo4:<!--$-->0</span></host>
      <host><!--$--><span>Memo5:1</span></host>
      <host><!--$--><span>Memo6:<!--$-->1</span></host>
    </div>`,
  );
});

test("MemoGroup3 re-renders correctly", async () => {
  const container = await mount(<MemoGroup3 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$-->
      <div>
        <host><!--$--><span>Memo1:0</span></host>
        <host><span>Memo2:<!--$-->0</span></host>
        <host><!--$--><span>Memo3:0</span></host>
        <host><!--$--><span>Memo4:<!--$-->0</span></host>
        <host><!--$--><span>Memo5:0</span></host>
        <host><!--$--><span>Memo6:<!--$-->0</span></host>
      </div>
    `,
  );

  update(container);

  assert.snapshot.html(
    container.innerHTML,
    `<!--$-->
      <div>
        <host><!--$--><span>Memo1:1</span></host>
        <host><span>Memo2:<!--$-->1</span></host>
        <host><!--$--><span>Memo3:0</span></host>
        <host><!--$--><span>Memo4:<!--$-->0</span></host>
        <host><!--$--><span>Memo5:1</span></host>
        <host><!--$--><span>Memo6:<!--$-->1</span></host>
      </div>
    `,
  );
});

test("MemoGroup4 re-renders correctly", async () => {
  const container = await mount(<MemoGroup4 />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `<div>
      <host><!--$--><span>Memo1:0</span></host>
      <host><span>Memo2:<!--$-->0</span></host>
      <!--$--><host><!--$--><span>Memo3:0</span></host>
      <host><!--$--><span>Memo4:<!--$-->0</span></host>
      <host><!--$--><span>Memo5:0</span></host>
      <host><!--$--><span>Memo6:<!--$-->0</span></host>
    </div>`,
  );

  update(container);

  assert.snapshot.html(
    container.innerHTML,
    `<div>
      <host><!--$--><span>Memo1:1</span></host>
      <host><span>Memo2:<!--$-->1</span></host>
      <!--$--><host><!--$--><span>Memo3:0</span></host>
      <host><!--$--><span>Memo4:<!--$-->0</span></host>
      <host><!--$--><span>Memo5:1</span></host>
      <host><!--$--><span>Memo6:<!--$-->1</span></host>
    </div>`,
  );
});

test("MemoLoop+reverse", async () => {
  const container = await mount(<MemoLoop />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `
    <button type="button">Add</button>
    <button type="button">Reverse</button>
    <div>
      <hr data-static="">
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>

      <hr data-eventable="">
      <!--$-->
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>

      <hr data-memo-static="">
      <!--$-->
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>

      <hr data-memo-eventable="">
      <!--$-->
      <div><!--$-->1 : 0</div>
      <div><!--$-->2 : 1</div>
      <div><!--$-->3 : 2</div>
    </div>
    `,
  );

  const reverseButton = container.querySelectorAll("button")[1];
  reverseButton!.click();
  await Promise.resolve();

  assert.snapshot.html(
    container.innerHTML,
    `
    <button type="button">Add</button>
    <button type="button">Reverse</button>
    <div>
      <hr data-static="">
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>

      <hr data-eventable="">
      <!--$-->
      <div>3 : 0</div>
      <div>2 : 1</div>
      <div>1 : 2</div>

      <hr data-memo-static="">
      <!--$-->
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>

      <hr data-memo-eventable="">
      <!--$-->
      <div><!--$-->3 : 0</div>
      <div><!--$-->2 : 1</div>
      <div><!--$-->1 : 2</div>
    </div>
    `,
  );
});

test("MemoLoop+add", async () => {
  const container = await mount(<MemoLoop />, document.body);

  assert.snapshot.html(
    container.innerHTML,
    `
    <button type="button">Add</button>
    <button type="button">Reverse</button>
    <div>
      <hr data-static="">
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>

      <hr data-eventable="">
      <!--$-->
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>

      <hr data-memo-static="">
      <!--$-->
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>

      <hr data-memo-eventable="">
      <!--$-->
      <div><!--$-->1 : 0</div>
      <div><!--$-->2 : 1</div>
      <div><!--$-->3 : 2</div>
    </div>
    `,
  );

  const addButton = container.querySelectorAll("button")[0];
  addButton!.click();
  await Promise.resolve();

  assert.snapshot.html(
    container.innerHTML,
    `
    <button type="button">Add</button>
    <button type="button">Reverse</button>
    <div>
      <hr data-static="">
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>
      <hr data-eventable="">

      <!--$-->
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>
      <div>4 : 3</div>

      <hr data-memo-static="">
      <!--$-->
      <div>1 : 0</div>
      <div>2 : 1</div>
      <div>3 : 2</div>
      <div>4 : 3</div>

      <hr data-memo-eventable="">
      <!--$-->
      <div><!--$-->1 : 0</div>
      <div><!--$-->2 : 1</div>
      <div><!--$-->3 : 2</div>
      <div><!--$-->4 : 3</div>
    </div>
    `,
  );
});

await test.run();
