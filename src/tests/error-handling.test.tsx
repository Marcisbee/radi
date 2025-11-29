import { update } from "../client.ts";
import { assert, test } from "@marcisbee/rion/test";
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
        const ce = e as ErrorEvent;
        callCount++;
        caught = ce.error;
        e.stopImmediatePropagation();
      },
      { once: true },
    );
    return <Child />;
  }

  const container = createContainer();
  await mount(<Parent /> as unknown as HTMLElement, container);

  assert.equal(callCount, 1);
  assert.instanceOf(caught, Error);
  assert.equal((caught as Error).message, "child boom");
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
      const ce = e as ErrorEvent;
      bubbleCaught = ce.error;
      e.preventDefault();
    },
    { once: true },
  );

  await mount(<Boom /> as unknown as HTMLElement, container);

  assert.instanceOf(bubbleCaught, Error);
  assert.equal((bubbleCaught as Error).message, "boom root");
});

test("reactive generator error bubbles", async () => {
  let caught: unknown = null;

  function ReactiveThrower(this: HTMLElement): () => never {
    this.addEventListener(
      "error",
      (e: Event) => {
        e.preventDefault();
        caught = (e as ErrorEvent).error;
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

  assert.instanceOf(caught, Error);
  assert.equal((caught as Error).message, "reactive boom");
});

test("prop function evaluation error emits error event", async () => {
  let caught: unknown = null;

  function Holder(this: HTMLElement): JSX.Element {
    this.addEventListener(
      "error",
      (e: Event) => {
        e.preventDefault();
        caught = (e as ErrorEvent).error;
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

  assert.instanceOf(caught, Error);
  assert.equal((caught as Error).message, "prop eval");
});

test("prop function throws on update dispatch", async () => {
  let caught: unknown = null;
  let calls = 0;

  function Updater(this: HTMLElement): JSX.Element {
    this.addEventListener(
      "error",
      (e: Event) => {
        e.preventDefault();
        caught = (e as ErrorEvent).error;
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

  assert.equal(calls, 1);
  assert.equal(caught, null);

  update(container);

  assert.equal(calls, 2);
  assert.instanceOf(caught, Error);
  assert.equal((caught as Error).message, "update eval");
});

function ErrorBoundary(
  this: HTMLElement,
  props: JSX.PropsWithChildren<{ fallback: (err: Error) => JSX.Element }>,
) {
  let error: Error | null = null;

  this.addEventListener(
    "error",
    (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const ce = e as ErrorEvent;
      error = ce?.error ?? null;
      update(this);
    },
  );

  return () => {
    if (error) {
      return props().fallback(error);
    }

    return props().children;
  };
}

test("ErrorBoundary renders fallback and prevents error from bubbling", async () => {
  let containerCaught: unknown = null;

  function Bomb(): never {
    throw new Error("bomb!");
  }

  const container = createContainer();
  container.addEventListener(
    "error",
    (e: Event) => {
      const ce = e as ErrorEvent;
      containerCaught = ce.error;
      e.preventDefault();
    },
    { once: true },
  );

  const node = (
    <ErrorBoundary fallback={() => <div id="fb">fallback</div>}>
      <Bomb />
    </ErrorBoundary>
  ) as unknown as HTMLElement;

  await mount(node, container);

  // fallback should be rendered
  const fb = container.querySelector("#fb");
  assert.instanceOf(fb, HTMLElement);
  assert.equal(fb!.textContent, "fallback");

  // error should not bubble to container because it's handled
  assert.equal(containerCaught, null);
});

test("ErrorBoundary passes error into fallback render prop", async () => {
  let receivedText = "";

  function Boom(): never {
    throw new Error("boomprop");
  }

  const container = createContainer();
  const node = (
    <ErrorBoundary
      fallback={(err: Error) => {
        receivedText = err.message;
        return <div id="fb-prop">ok</div>;
      }}
    >
      <Boom />
    </ErrorBoundary>
  ) as unknown as HTMLElement;

  await mount(node, container);

  // fallback component should receive the error message
  assert.equal(receivedText, "boomprop");
  const fb = container.querySelector("#fb-prop");
  assert.instanceOf(fb, HTMLElement);
});

await test.run();
