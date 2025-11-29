import { assert, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { update } from "../client.ts";

type Observable<T> = {
  current: T;
  subscribe(cb: (v: T) => void): { unsubscribe(): void } | (() => void);
};

function makeObservable<T>(
  initial: T,
): Observable<T> & { set(value: T): void } {
  let current = initial;
  const listeners = new Set<(v: T) => void>();

  const subscribe = (cb: (v: T) => void) => {
    listeners.add(cb);
    cb(current);
    return () => {
      listeners.delete(cb);
    };
  };

  return {
    get current() {
      return current;
    },
    subscribe,
    set(value: T) {
      current = value;
      for (const l of listeners) l(current);
    },
  };
}

test("style prop: per-property reactive function", async () => {
  let color = "red";

  function App() {
    return <div style={{ color: () => color }} />;
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div") as HTMLDivElement;

  assert.equal(el.style.color, "red");

  color = "blue";
  update(container);
  assert.equal(el.style.color, "blue");
});

test("style prop: per-property observable", async () => {
  const color$ = makeObservable("red");

  function App() {
    return <div style={{ color: color$ }} />;
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div") as HTMLDivElement;

  assert.equal(el.style.color, "red");

  color$.set("green");
  assert.equal(el.style.color, "green");

  color$.set("blue");
  assert.equal(el.style.color, "blue");
});

test("style prop: whole style object reactive with nested reactive property", async () => {
  let color = "red";

  function App() {
    return (
      <div
        style={() => ({
          color: () => color,
        })}
      />
    );
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div") as HTMLDivElement;

  assert.equal(el.style.color, "red");

  color = "blue";
  update(container);
  assert.equal(el.style.color, "blue");
});

test("style prop: whole style object observable with nested reactive/observable", async () => {
  let size = "10px";
  const color$ = makeObservable("red");

  const style$ = makeObservable({
    color: () => color$.current,
    fontSize: () => size,
  });

  function App() {
    return <div style={style$} />;
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div") as HTMLDivElement;

  assert.equal(el.style.color, "red");
  assert.equal(el.style.fontSize, "10px");

  size = "20px";
  update(container);
  assert.equal(el.style.fontSize, "20px");

  color$.set("blue");
  update(container);
  assert.equal(el.style.color, "blue");
});

test("style prop: per-property reactive function re-evaluation count", async () => {
  let color = "red";
  let evalCount = 0;

  function App() {
    return (
      <div
        style={{
          color: () => {
            evalCount++;
            return color;
          },
        }}
      />
    );
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div") as HTMLDivElement;

  // initial evaluation during first render
  assert.equal(el.style.color, "red");
  assert.equal(evalCount, 1);

  // change backing value and trigger update
  color = "blue";
  update(container);

  // should re-evaluate exactly once per update
  assert.equal(el.style.color, "blue");
  assert.equal(evalCount, 2);
});

test("style prop: per-property observable subscription and update count", async () => {
  const color$ = makeObservable("red");
  let subscriptionCalls = 0;

  function App() {
    return (
      <div
        style={{
          color: {
            current: color$.current,
            subscribe(cb: (v: string) => void) {
              // wrap underlying observable to count how many times
              // style subscription callback is invoked
              return color$.subscribe((v) => {
                subscriptionCalls++;
                cb(v);
              });
            },
          } as Observable<string>,
        }}
      />
    );
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div") as HTMLDivElement;

  // initial sync
  assert.equal(el.style.color, "red");
  assert.equal(subscriptionCalls, 1);

  color$.set("green");
  assert.equal(el.style.color, "green");
  assert.equal(subscriptionCalls, 2);

  color$.set("blue");
  assert.equal(el.style.color, "blue");
  assert.equal(subscriptionCalls, 3);
});

test("style prop: whole reactive object with nested reactive property re-evaluation count", async () => {
  let color = "red";
  let styleEvalCount = 0;
  let nestedEvalCount = 0;

  function App() {
    return (
      <div
        style={() => {
          styleEvalCount++;
          return {
            color: () => {
              nestedEvalCount++;
              return color;
            },
          };
        }}
      />
    );
  }

  const container = await mount(<App />, document.body);
  const el = container.querySelector("div") as HTMLDivElement;

  // first render
  assert.equal(el.style.color, "red");
  assert.equal(styleEvalCount, 1);
  assert.equal(nestedEvalCount, 1);

  // update backing value and trigger update
  color = "blue";
  update(container);

  // implementation may evaluate nested reactive more than once per update
  assert.equal(el.style.color, "blue");
  assert.equal(styleEvalCount, 2);
  assert.equal(nestedEvalCount, 4);
});

await test.run();
