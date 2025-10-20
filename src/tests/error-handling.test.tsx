import { update } from "../main.ts";
import { assert, test } from "../../test/runner.ts";
import { mount } from "../../test/utils.ts";

/**
 * Utility to create + attach a container root.
 */
function createContainer(): HTMLElement {
  const div = document.createElement("div");
  document.body.appendChild(div);
  return div;
}

test("catches child component render error via parent listener", async () => {
  let caught: unknown = null;
  let callCount = 0;

  function Child(): never {
    throw new Error("child boom");
  }

  function Parent(this: HTMLElement) {
    this.addEventListener(
      "error",
      (e: Event) => {
        e.preventDefault();
        const ce = e as CustomEvent;
        callCount++;
        caught = ce.detail.error;
        e.stopImmediatePropagation();
      },
      { once: true },
    );
    return <Child />;
  }

  const container = createContainer();
  await mount(<Parent /> as unknown as HTMLElement, container);

  assert.is(callCount, 1);
  assert.ok(caught instanceof Error);
  assert.is((caught as Error).message, "child boom");
});

test("uncaught component error bubbles to container listener", async () => {
  let bubbleCaught: unknown = null;

  function Boom(): never {
    throw new Error("boom root");
  }

  const container = createContainer();
  container.addEventListener(
    "error",
    (e: Event) => {
      const ce = e as CustomEvent;
      bubbleCaught = ce.detail.error;
      e.preventDefault();
    },
    { once: true },
  );

  await mount(<Boom /> as unknown as HTMLElement, container);

  assert.ok(bubbleCaught instanceof Error);
  assert.is((bubbleCaught as Error).message, "boom root");
});

test("reactive generator error bubbles", async () => {
  let caught: unknown = null;

  function ReactiveThrower(this: HTMLElement): () => never {
    this.addEventListener(
      "error",
      (e: Event) => {
        e.preventDefault();
        caught = (e as CustomEvent).detail.error;
        e.stopPropagation();
      },
      { once: true },
    );
    return () => {
      throw new Error("reactive boom");
    };
  }

  const container = createContainer();
  await mount(<ReactiveThrower /> as unknown as HTMLElement, container);

  assert.ok(caught instanceof Error);
  assert.is((caught as Error).message, "reactive boom");
});

test("prop function evaluation error emits error event", async () => {
  let caught: unknown = null;

  function Holder(this: HTMLElement): JSX.Element {
    this.addEventListener(
      "error",
      (e: Event) => {
        e.preventDefault();
        caught = (e as CustomEvent).detail.error;
        e.stopImmediatePropagation();
      },
      { once: true },
    );
    return (
      <div
        title={() => {
          throw new Error("prop eval");
        }}
      />
    );
  }

  const container = createContainer();
  await mount(<Holder /> as unknown as HTMLElement, container);

  assert.ok(caught instanceof Error);
  assert.is((caught as Error).message, "prop eval");
});

test("prop function throws on update dispatch", async () => {
  let caught: unknown = null;
  let calls = 0;

  function Updater(this: HTMLElement): JSX.Element {
    this.addEventListener(
      "error",
      (e: Event) => {
        e.preventDefault();
        caught = (e as CustomEvent).detail.error;
        e.stopImmediatePropagation();
      },
      { once: true },
    );
    return (
      <div
        data-x={() => {
          calls++;
          if (calls === 2) {
            throw new Error("update eval");
          }
          return "ok";
        }}
      />
    );
  }

  const container = createContainer();
  const node = <Updater /> as unknown as HTMLElement;
  await mount(node, container);

  assert.is(calls, 1);
  assert.is(caught, null);

  update(container);

  assert.is(calls, 2);
  assert.ok(caught instanceof Error);
  assert.is((caught as Error).message, "update eval");
});

await test.run();
