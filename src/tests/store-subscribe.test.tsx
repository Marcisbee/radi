import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { createRoot } from "../main.ts";

/**
 * Utility to create a simple subscribable store compatible with Radi's
 * buildElement store integration: { subscribe(fn), set(value) }.
 */
function createStore(initial: unknown, emitInitial: boolean) {
  let current = initial;
  const subs = new Set<(v: unknown) => void>();
  let unsubscribedCount = 0;
  const store = {
    subscribe(fn: (value: unknown) => void) {
      subs.add(fn);
      if (emitInitial) {
        fn(current);
      }
      return () => {
        if (subs.delete(fn)) {
          unsubscribedCount++;
        }
      };
    },
    set(value: unknown) {
      current = value;
      for (const s of subs) s(current);
    },
    get value() {
      return current;
    },
    get unsubscribedCount() {
      return unsubscribedCount;
    },
  };
  return store;
}

/* ========================= Tests ========================= */

test("initial-sync-value", async () => {
  const store = createStore("A", true);

  function App() {
    return <div className="store-host">{store}</div>;
  }

  const root = await mount(<App />, document.body);

  assert.snapshot.html(
    root,
    `<radi-host style="display: contents;">
      <div class="store-host"><!--(-->A<!--)--></div>
    </radi-host>`,
  );
});

test("subsequent-set-update", async () => {
  const store = createStore("A", true);

  function App() {
    return <div className="store-host">{store}</div>;
  }

  const root = await mount(<App />, document.body);
  const host = root.querySelector(".store-host")!;
  assert.equal(host.textContent, "A");

  store.set("B");
  assert.equal(host.textContent, "B");

  store.set("C");
  assert.equal(host.textContent, "C");
});

test("no-duplicate-nodes", async () => {
  const store = createStore("X", true);

  function App() {
    return <div className="store-host">{store}</div>;
  }

  const root = await mount(<App />, document.body);
  const host = root.querySelector(".store-host")!;
  assert.equal(host.textContent, "X");

  store.set("Y");
  store.set("Z");

  assert.equal(host.textContent, "Z");
  // Only one child text node inside the fragment range.
  const comments = Array.from(host.childNodes).filter(
    (n) => n.nodeType === Node.COMMENT_NODE,
  );
  const texts = Array.from(host.childNodes).filter(
    (n) => n.nodeType === Node.TEXT_NODE,
  );
  // Expect two comments (fragment boundary) and one text node.
  assert.equal(comments.length, 2);
  assert.equal(texts.length, 1);
});

test("unsubscribe-on-disconnect", async () => {
  const store = createStore("Alive", true);

  function App() {
    return <div className="store-host">{store}</div>;
  }

  const root = createRoot(document.body);
  root.render(<App />);
  await Promise.resolve();
  assert.equal(store.unsubscribedCount, 0);

  // Remove root element -> disconnect should propagate and trigger unsubscribe.
  root.unmount();

  // Allow any microtasks (not strictly required since removal synchronous).
  await Promise.resolve();

  assert.equal(store.unsubscribedCount, 1);
});

test("nested-reactive-in-store-value", async () => {
  // Store emits a reactive generator (function) which itself returns a string.
  const store = createStore(
    () => "R1",
    true,
  );

  function App() {
    return <div className="store-host">{store}</div>;
  }

  const root = await mount(<App />, document.body);
  const host = root.querySelector(".store-host")!;
  assert.equal(host.textContent, "R1");

  // Update to a different nested reactive generator.
  store.set(() => "R2");
  assert.equal(host.textContent, "R2");
});

test("late-first-emission", async () => {
  // Do not emit initial value; fragment should be empty between boundary comments.
  const store = createStore("L1", false);

  function App() {
    return <div className="store-host">{store}</div>;
  }

  const root = await mount(<App />, document.body);
  const host = root.querySelector(".store-host")!;

  // Between the two boundary comments there should be no text initially.
  const raw = host.innerHTML;
  assert.equal(raw, "<!--(--><!--)-->");

  // First emission
  store.set("L1");
  assert.equal(host.textContent, "L1");

  // Second emission
  store.set("L2");
  assert.equal(host.textContent, "L2");
});

test("unsubscribe-object", async () => {
  let unsubCalled = 0;
  let current = "O1";
  const subs = new Set<(v: unknown) => void>();
  const store = {
    subscribe(fn: (value: unknown) => void) {
      subs.add(fn);
      fn(current);
      return {
        unsubscribe() {
          if (subs.delete(fn)) {
            unsubCalled++;
          }
        },
      };
    },
    set(value: string) {
      current = value;
      for (const s of subs) s(current);
    },
    get unsubCalled() {
      return unsubCalled;
    },
  };

  function App() {
    return <div className="store-host">{store}</div>;
  }

  const root = createRoot(document.body);
  root.render(<App />);
  await Promise.resolve();

  const host = document.querySelector(".store-host")!;
  assert.equal(host.textContent, "O1");
  assert.equal(store.unsubCalled, 0);

  root.unmount();
  await Promise.resolve();

  assert.equal(store.unsubCalled, 1);
});

test("nested-unsubscribe", async () => {
  let outerUnsub = 0;
  let innerUnsub = 0;
  function createInnerStore(initial: string) {
    let current = initial;
    const subs = new Set<(v: unknown) => void>();
    return {
      subscribe(fn: (value: unknown) => void) {
        subs.add(fn);
        fn(current);
        return {
          unsubscribe() {
            if (subs.delete(fn)) {
              innerUnsub++;
            }
          },
        };
      },
      set(value: string) {
        current = value;
        for (const s of subs) s(current);
      },
    };
  }
  const innerStore = createInnerStore("I1");
  const outerStore = {
    subscribe(fn: (value: unknown) => void) {
      fn(innerStore);
      return {
        unsubscribe() {
          outerUnsub++;
        },
      };
    },
  };
  function App() {
    return <div className="store-host">{outerStore}</div>;
  }
  const root = createRoot(document.body);
  root.render(<App />);
  await Promise.resolve();
  await Promise.resolve(); // extra microtask flush for nested subscription setup
  assert.equal(outerUnsub, 0);
  assert.equal(innerUnsub, 0);
  root.unmount();
  await Promise.resolve();
  await Promise.resolve(); // extra microtask flush for nested unsubscribe cleanup
  assert.equal(outerUnsub, 1);
  assert.equal(innerUnsub, 1);
});
test("nested-unsubscribe-update", async () => {
  let outerUnsub = 0;
  let innerUnsub = 0;
  function createInnerStore(initial: string) {
    let current = initial;
    const subs = new Set<(v: unknown) => void>();
    return {
      subscribe(fn: (value: unknown) => void) {
        subs.add(fn);
        fn(current);
        return {
          unsubscribe() {
            if (subs.delete(fn)) {
              innerUnsub++;
            }
          },
        };
      },
      set(value: string) {
        current = value;
        for (const s of subs) s(current);
      },
      get value() {
        return current;
      },
    };
  }
  const innerStore = createInnerStore("J1");
  const outerStore = {
    subscribe(fn: (value: unknown) => void) {
      fn(innerStore);
      return {
        unsubscribe() {
          outerUnsub++;
        },
      };
    },
  };
  function App() {
    return <div className="store-host">{outerStore}</div>;
  }
  const root = createRoot(document.body);
  root.render(<App />);
  await Promise.resolve();
  await Promise.resolve(); // ensure inner subscription rendering completes
  const host = document.querySelector(".store-host")!;
  assert.equal(host.textContent, "J1");
  innerStore.set("J2");
  assert.equal(host.textContent, "J2");
  assert.equal(outerUnsub, 0);
  assert.equal(innerUnsub, 0);
  root.unmount();
  await Promise.resolve();
  await Promise.resolve(); // flush cleanup microtasks
  assert.equal(outerUnsub, 1);
  assert.equal(innerUnsub, 1);
});
await test.run();
