import { assert, test } from "@marcisbee/rion";
import { memo, update } from "../client.ts";
import { mount } from "../../test/utils.ts";

/* -------------------------------------------------------------------------- */
/* 1. Toggle skip predicate                                                    */
/* -------------------------------------------------------------------------- */

test("memo toggle skip predicate", async () => {
  let toggle = false;
  let i = 0;
  const m = memo((parent) => i++, () => toggle);

  function App() {
    return <div data-val={m} />;
  }

  const root = await mount(<App />, document.body);
  const div = root.querySelector("div")!;

  assert.equal(div.getAttribute("data-val"), "0"); // initial
  update(root);
  assert.equal(div.getAttribute("data-val"), "1"); // recompute
  toggle = true;
  update(root);
  assert.equal(div.getAttribute("data-val"), "1"); // skipped
  toggle = false;
  update(root);
  assert.equal(div.getAttribute("data-val"), "2"); // recompute again
});

/* -------------------------------------------------------------------------- */
/* 2. Insertion / removal shifts memo execution indices                       */
/* -------------------------------------------------------------------------- */

test("memo insertion and removal preserves neighboring memo caches", async () => {
  let a = 0, b = 0, c = 0;
  const ma = memo(() => a++, () => false);
  const mb = memo(() => b++, () => false);
  const mc = memo(() => c++, () => false);

  let showMiddle = false;

  function App() {
    return (
      <div className="wrap">
        <span className="a">{ma}</span>
        {() => (showMiddle ? <span className="c">{mc}</span> : null)}
        <span className="b">{mb}</span>
      </div>
    );
  }

  const root = await mount(<App />, document.body);
  const wrap = root.querySelector(".wrap")!;
  const get = (cls: string) => {
    const sel = cls.startsWith(".") ? cls : `.${cls}`;
    const node = wrap.querySelector(sel);
    if (!node) throw new Error(`missing node for selector ${sel}`);
    return node.textContent;
  };

  assert.equal(get(".a"), "0");
  assert.equal(get(".b"), "0");

  update(root);
  assert.equal(get(".a"), "1");
  assert.equal(get(".b"), "1");

  showMiddle = true;
  update(root);
  // a advanced, c starts, b advanced
  assert.equal(get(".a"), "2");
  assert.equal(get(".c"), "0");
  assert.equal(get(".b"), "2");

  update(root);
  assert.equal(get(".a"), "3");
  assert.equal(get(".c"), "1");
  assert.equal(get(".b"), "3");

  showMiddle = false;
  update(root);
  assert.equal(get(".a"), "4");
  assert.equal(get(".b"), "4");

  update(root);
  assert.equal(get(".a"), "5");
  assert.equal(get(".b"), "5");
});

/* -------------------------------------------------------------------------- */
/* 3. Nested memo inside memo                                                  */
/* -------------------------------------------------------------------------- */

test("nested memo inside memo", async () => {
  let innerI = 0;
  let outerI = 0;
  const inner = memo((p) => `I${innerI++}`, () => false);
  const outer = memo(
    (parent) => `O${outerI++}-${inner(parent)}`,
    () => false,
  );

  function App() {
    return <div data-out={outer} />;
  }

  const root = await mount(<App />, document.body);
  const div = root.querySelector("div")!;
  assert.equal(div.getAttribute("data-out"), "O0-I0");

  update(root);
  assert.equal(div.getAttribute("data-out"), "O1-I1");

  update(root);
  assert.equal(div.getAttribute("data-out"), "O2-I2");
});

/* -------------------------------------------------------------------------- */
/* 4. Keyed list reorder with memo elements                                   */
/* -------------------------------------------------------------------------- */

test("keyed list reorder preserves memo counters", async () => {
  type Item = { id: string; label: string; count: number };
  const items: Item[] = [
    { id: "a", label: "A", count: 0 },
    { id: "b", label: "B", count: 0 },
    { id: "c", label: "C", count: 0 },
  ];

  function makeMemo(item: Item) {
    return memo(() => item.count++, () => false);
  }

  const memos = new Map<string, ReturnType<typeof makeMemo>>();
  for (const it of items) memos.set(it.id, makeMemo(it));

  function App() {
    return (
      <ul>
        {items.map((it) => (
          <li key={it.id} data-id={it.id} data-count={memos.get(it.id)!}>
            {it.label}
          </li>
        ))}
      </ul>
    );
  }

  const root = await mount(<App />, document.body);

  const getCountsRaw = () =>
    Array.from(root.querySelectorAll("li")).map((li) =>
      li.getAttribute("data-id") + ":" + li.getAttribute("data-count")
    );

  const normalize = () => getCountsRaw().sort().join(",");

  // Initial
  assert.equal(normalize(), "a:0,b:0,c:0");

  // Reverse order
  items.reverse(); // c,b,a
  update(root);
  assert.equal(normalize(), "a:1,b:1,c:1");

  // Shuffle a,c,b
  const snapshot = new Map(items.map((i) => [i.id, i.count]));
  items.splice(
    0,
    items.length,
    ...["a", "c", "b"].map((id) => ({
      id,
      label: id.toUpperCase(),
      count: snapshot.get(id)!,
    })),
  );
  update(root);
  assert.equal(normalize(), "a:2,b:2,c:2");
});

/* -------------------------------------------------------------------------- */
/* 5. Component prop vs child memo interaction                                 */
/* -------------------------------------------------------------------------- */

function PropChildComponent(
  this: HTMLElement,
  props: JSX.Props<{ fast: unknown }>,
) {
  // fast passed as memo function (function-valued prop); evaluate by calling with parent element if function.
  const childMemo = memo(
    (parent) => {
      const f = props().fast as any;
      const val = typeof f === "function" ? f(parent) : f;
      return `child-${val}`;
    },
    () => false,
  );
  return () => (
    <section
      data-fast={() => {
        const f = props().fast as any;
        return typeof f === "function" ? f(this) : f;
      }}
    >
      {childMemo}
    </section>
  );
}

test("component memo prop + memo child remain independent", async () => {
  let fast = 0;
  const fastMemo = memo((p) => fast, () => fast % 2 === 1); // skip on odd

  function App() {
    return <PropChildComponent fast={fastMemo} />;
  }

  const root = await mount(<App />, document.body);
  const sec = root.querySelector("section")!;

  assert.equal(sec.getAttribute("data-fast"), "0");
  assert.match(sec.textContent || "", /child-0/);

  fast = 1; // skip
  update(root);
  assert.equal(sec.getAttribute("data-fast"), "0");
  assert.match(sec.textContent || "", /child-0/);

  fast = 2; // recompute
  update(root);
  assert.equal(sec.getAttribute("data-fast"), "2");
  assert.match(sec.textContent || "", /child-2/);
});

/* -------------------------------------------------------------------------- */
/* 6. Memo render error recovery                                               */
/* -------------------------------------------------------------------------- */

test("memo render error then recovery", async () => {
  let safe = false;
  let val = 0;
  let errors = 0;

  const errMemo = memo((parent) => {
    parent.addEventListener("error", (e) => {
      e.preventDefault();
      errors++;
    }, { once: true });
    if (!safe) throw new Error("boom");
    return val++;
  }, () => false);

  function App() {
    return <div data-val={errMemo} />;
  }

  const root = await mount(<App />, document.body);

  // First render errored: attribute likely null
  const firstDiv = root.querySelector("div")!;
  assert.equal(firstDiv.getAttribute("data-val"), null);

  safe = true;
  update(root);
  const div = root.querySelector("div")!;
  assert.equal(div.getAttribute("data-val"), "0");

  update(root);
  assert.equal(div.getAttribute("data-val"), "1");

  assert.equal(errors, 1);
});

test("memo render list", async () => {
  function List(this: HTMLElement) {
    let rows: number[] = [];
    let len: number;

    return (
      <div>
        <button
          type="button"
          onclick={() => {
            rows.push(1, 2, 3, 4, 5, 6);
            update(this);
          }}
        >
          Add
        </button>
        <ul>
          {memo(() => (rows.map((item, index) => (
            <li
              key={String(item)}
              id={String(item)}
            >
              {() => rows[index]} : {() => index}
            </li>
          ))), () => {
            const changed = len !== rows.length;
            len = rows.length;
            return !changed;
          })}
        </ul>
      </div>
    );
  }

  const root = await mount(<List />, document.body);

  const button = root.querySelector("button")!;
  const ul = root.querySelector("ul")!;

  assert.length(ul.querySelectorAll("li"), 0);

  button.click();
  await Promise.resolve();
  assert.length(ul.querySelectorAll("li"), 6);
  assert.equal(ul.querySelectorAll("li")[0].textContent, "1 : 0");
  assert.equal(ul.querySelectorAll("li")[5].textContent, "6 : 5");
});

test("non-memo render list", async () => {
  function List(this: HTMLElement) {
    let rows: number[] = [];
    let len: number;

    return (
      <div>
        <button
          type="button"
          onclick={() => {
            rows.push(1, 2, 3, 4, 5, 6);
            update(this);
          }}
        >
          Add
        </button>
        <ul>
          {() => (rows.map((item, index) => (
            <li
              key={String(item)}
              id={String(item)}
            >
              {() => rows[index]} : {() => index}
            </li>
          )))}
        </ul>
      </div>
    );
  }

  const root = await mount(<List />, document.body);

  const button = root.querySelector("button")!;
  const ul = root.querySelector("ul")!;

  assert.length(ul.querySelectorAll("li"), 0);

  button.click();
  await Promise.resolve();
  assert.length(ul.querySelectorAll("li"), 6);
  assert.equal(ul.querySelectorAll("li")[0].textContent, "1 : 0");
  assert.equal(ul.querySelectorAll("li")[5].textContent, "6 : 5");
});

await test.run();
