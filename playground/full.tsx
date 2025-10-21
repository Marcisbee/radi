import {
  createAbortSignal,
  createElement,
  createRoot,
  Fragment,
  update,
} from "../src/main.ts";
import { createChannel } from "../src/channel.ts";
import { suspend, Suspense, unsuspend } from "../src/suspense.ts";
import { createSignal } from "../src/signal.ts";

const Theme = createChannel<"light" | "dark">("light");

function ThemeProvider(
  this: DocumentFragment,
  props: JSX.PropsWithChildren,
) {
  // Provide (idempotent across re-renders unless you explicitly change value)
  const theme = Theme.provide(this, "light");
  // Example: toggle every 2s
  setInterval(() => {
    theme.set((prev) => (prev === "light" ? "dark" : "light"));
  }, 2000);
  return () => props().children;
}

function Badge(this: DocumentFragment) {
  const theme = Theme.use(this);
  return (
    <div
      style={() => ({
        background: theme() === "dark" ? "#222" : "#eee",
        color: theme() === "dark" ? "#eee" : "#222",
        padding: "4px 8px",
        borderRadius: "4px",
      })}
    >
      Theme: {theme}
      <button
        type="button"
        onclick={() => {
          theme.set((prev) => (prev === "light" ? "dark" : "light"));
        }}
        style={{ marginLeft: "8px" }}
      >
        toggle
      </button>
      <button
        type="button"
        onclick={() => {
          theme.update(); // force consumers to re-render without changing value
        }}
        style={{ marginLeft: "4px" }}
      >
        force update
      </button>
    </div>
  );
}

function Nested(this: DocumentFragment) {
  // Locally override provider:
  Theme.provide(this, "dark");
  const theme = Theme.use(this);
  return <div>Nested local theme: {theme}</div>;
}

function SuspendedChild(this: DocumentFragment) {
  let state = "suspended";

  (async () => {
    suspend(this);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    state = "unsuspended";
    update(this);
    unsuspend(this);
  })();

  return (
    <div>
      <h1>I am {() => state}</h1>
    </div>
  );
}

function CounterSignal(
  this: DocumentFragment,
  props: JSX.Props<{ count: number }>,
) {
  const countSignal = createSignal(props().count);

  return (
    <button
      type="button"
      onclick={() => {
        countSignal(countSignal() + 1);
      }}
      disabled={countSignal((c) => c >= 10)}
      style={{
        color: "orange",
      }}
    >
      Signal: {countSignal}
    </button>
  );
}

function Drummer(
  this: DocumentFragment,
  props: JSX.Props<{ bpm: () => number }>,
) {
  const { bpm } = props();
  const signal = createAbortSignal(this);

  // let interval: ReturnType<typeof setInterval>;
  // const setup = () => {
  //   clearInterval(interval);
  //   interval = setInterval(() => {
  //     console.log('BPM', bpm());
  //   }, bpm());
  // };
  // this.addEventListener('update', setup, { signal });
  // setup();

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.dispatchEvent(new CustomEvent("bpm:increment", { bubbles: true }));
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.dispatchEvent(new CustomEvent("bpm:decrement", { bubbles: true }));
      }
    },
    { signal },
  );

  const random = Math.random();

  return () => (
    <div
      className="asd"
      style={{
        color: `hsl(${bpm()},95%,55%)`,
      }}
    >
      {bpm() > 120 ? <s>down</s> : <u>up</u>} [{bpm()}]{" "}
      <strong>{random}</strong> asd
    </div>
  );

  // return (
  //   <div
  //     className='asd'
  //     style={() => ({
  //       color: `hsl(${bpm()},95%,55%)`,
  //     })}
  //   >
  //     {() => (bpm() > 120 ? <s>down</s> : <u>up</u>)} [{bpm}]{' '}
  //     {() => <strong>{Math.random()}</strong>} asd
  //   </div>
  // );
}

function CustomInput(
  this: DocumentFragment,
  props: JSX.Props<{ defaultValue?: string }>,
) {
  let value = props().defaultValue || "";

  return (
    <>
      <input
        type="text"
        value={() => value}
        oninput={(e) => {
          const input = e.target as HTMLInputElement;
          value = input.value;
          update(this);
        }}
      />
      <br />
      {() => value}
    </>
  );
}

function Counter(this: DocumentFragment, props: JSX.Props<{ count: number }>) {
  let count = props().count;
  return (
    <button
      type="button"
      onclick={() => {
        count++;
        update(this);
      }}
      disabled={() => count >= 10}
    >
      {() => count}
    </button>
  );
}

function Tab1(this: DocumentFragment) {
  const signal = createAbortSignal(this);

  signal.addEventListener("abort", () => console.log("aborted"));

  return <div>Tab1</div>;
}

function Tab2(this: DocumentFragment) {
  const events: string[] = [];
  this.addEventListener("connect", () => {
    console.log("Connected 2", this.isConnected);
  });
  this.addEventListener("disconnect", () => {
    console.log("Disconnected 2", this.isConnected);
  });
  return (
    <form
      onsubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formObject = Object.fromEntries(formData.entries());

        events.push(formObject.event);
        e.target.reset();
        update(this);
      }}
    >
      <input type="text" name="event" />
      <button type="submit">submit</button>
      <ul>{() => events.map((event) => <li>{event}</li>)}</ul>
    </form>
  );
}

function Tab3(this: DocumentFragment) {
  return <strong>{Math.random()}</strong>;
}

function Tabber(this: DocumentFragment) {
  let tab = "tab1";

  return (
    <div>
      <button
        type="button"
        onclick={() => {
          tab = "tab1";
          update(this);
        }}
      >
        tab1
      </button>
      <button
        type="button"
        onclick={() => {
          tab = "tab2";
          update(this);
        }}
      >
        tab2
      </button>
      <button
        type="button"
        onclick={() => {
          tab = "tab3";
          update(this);
        }}
      >
        tab3 (random key)
      </button>
      <button
        type="button"
        onclick={() => {
          tab = "tab4";
          update(this);
        }}
      >
        tab4 (scoped style)
      </button>
      <div>
        {() => (tab === "tab1"
          ? <Tab1 />
          : tab === "tab2"
          ? <Tab2 />
          : tab === "tab3"
          ? <Tab3 key={Math.random()} />
          : <Styling />)}
      </div>
    </div>
  );
}

function Sub1(this: DocumentFragment) {
  setInterval(() => {
    update(this);
  }, 1000);

  return () => <Sub2 value={Math.random()} />;
}

function Sub2(props: JSX.Props<{ value: number }>) {
  console.log("render");
  return <h3>Value: {() => props().value}</h3>;
}

function StyledCounterChild(
  this: DocumentFragment,
  props: JSX.Props<{ count: number }>,
) {
  let prevCount = props().count;

  this.addEventListener("update", () => {
    console.log("Update");
    // do something fancy
  });

  return (
    <span
      style={() => ({
        display: "inline-block",
        fontSize: "24px",
        color: props().count < 0 ? "red" : "green",
      })}
      onclick={(event) => event.target}
      onupdate={(event) => {
        if (props().count === prevCount) {
          return;
        }

        const frames = props().count >= prevCount
          ? [
            { transform: "translateY(-10px) scale(1.5)" },
            { transform: "translateY(0) scale(1)" },
            { transform: "translateY(0) scale(1)" },
            { transform: "translateY(0) scale(1)" },
          ]
          : [
            { transform: "translateY(10px) scale(0.5)" },
            { transform: "translateY(0) scale(1)" },
            { transform: "translateY(0) scale(1)" },
            { transform: "translateY(0) scale(1)" },
          ];
        prevCount = props().count;

        event.target.animate(frames, {
          duration: 400,
          easing: "ease-out",
          fill: "none",
        });
      }}
    >
      {() => props().count}
    </span>
  );
}

function StyledCounter(this: DocumentFragment) {
  let count = 0;

  return () => (
    <div style={{ overflow: "hidden" }}>
      <button
        onclick={() => {
          count++;
          update(this);
        }}
      >
        +
      </button>
      <button
        onclick={() => {
          count--;
          update(this);
        }}
      >
        -
      </button>
      <StyledCounterChild count={count} />
    </div>
  );
}

function css(
  strings: TemplateStringsArray,
  ...values: any[]
): HTMLStyleElement {
  const parts: any[] = [];

  // If invoked as tagged template: css`...`
  if (Array.isArray(strings)) {
    for (let i = 0; i < strings.length; i++) {
      parts.push(strings[i]);
      if (i < values.length) {
        parts.push(values[i]);
      }
    }
  }

  return createElement("style", null, parts) as any;
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function linkStyles(component: Node, styles: HTMLStyleElement[]) {
  for (const style of styles) {
    document.head.appendChild(style);
  }
  component.addEventListener("disconnect", () => {
    for (const style of styles) {
      style.remove();
    }
  });
  component.addEventListener("update", () => {
    for (const style of styles) {
      style.dispatchEvent(new Event("update"));
    }
  });
}

function Styling(this: DocumentFragment) {
  linkStyles(this, [css`
    body {
      color: ${getRandomColor};
    }
  `]);

  return (
    <div>
      <button type="button" onclick={() => update(this)}>Recolor</button>
    </div>
  );
}

function ExecEchoReactive(this: HTMLElement, props: JSX.PropsWithChildren) {
  return (
    <pre>
      <ul>
        <li>Direct children: {props().children}</li>
        <li>Random: {Math.random()}</li>
      </ul>
    </pre>
  );
}

/* function child passed directly and updated */
function FnChildParent(this: HTMLElement) {
  let value = "fn";
  return (
    <ExecEchoReactive>
      <button
        type="button"
        onclick={() => {
          value = Math.random().toString();
          update(this);
        }}
      >
        update
      </button>

      {() => value}
    </ExecEchoReactive>
  );
}

function ChildError() {
  throw new Error("error happened");

  return <h1>This is never reached</h1>;
}

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

      const ce = e as CustomEvent;
      error = ce?.detail?.error ?? null;
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

function AsyncChild(this: HTMLElement) {
  suspend(this);
  setTimeout(() => {
    unsuspend(this);
  }, 1500);
  return () => <span>Child {Math.random()}</span>;
}

function App(this: DocumentFragment, props: JSX.Props<{ name: string }>) {
  let bpm = 120;

  const signal = createAbortSignal(this);
  this.addEventListener(
    "bpm:increment",
    () => {
      bpm++;
      update(this);
    },
    { signal },
  );

  this.addEventListener(
    "bpm:decrement",
    () => {
      bpm--;
      update(this);
    },
    { signal },
  );

  const ref = <strong>this is gray</strong>;
  ref.style.color = "gray";

  const customElement = document.createElement("strong");
  customElement.innerHTML = "Hello from custom createElement";

  return (
    <div>
      {customElement}
      <h1>
        Hey {() => props().name} {() => bpm}
      </h1>
      {ref}
      <br />
      <Counter count={5} />
      <Counter count={2} />
      <CounterSignal count={1} />
      <Drummer bpm={() => bpm} />
      {/*<Drummer bpm={() => 120 - bpm} />*/}
      <CustomInput defaultValue="Hey" />
      <Tabber />
      <hr />
      <div>
        Suspense:
        <div>
          <Suspense fallback={<strong>Loading...</strong>}>
            <SuspendedChild />
            asd
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<em>Global fallback...</em>}>
            <AsyncChild />
          </Suspense>
        </div>
      </div>
      <hr />
      <ThemeProvider>
        <h1>Channel Demo</h1>
        <Badge />
        <Nested />
      </ThemeProvider>
      <hr />
      <Sub1 />
      <hr />
      <StyledCounter />
      <hr />
      <FnChildParent />
      <hr />
      Before
      <ErrorBoundary
        fallback={(error) => (
          <strong style={{ color: "orangered" }}>
            Child error: {String(error)}
          </strong>
        )}
      >
        <ChildError />
      </ErrorBoundary>
      After
    </div>
  );
}

function Boom() {
  throw new Error("boom");
  return <span>OK</span>;
}
function ErrorBoundary2(this: HTMLElement, props: JSX.PropsWithChildren) {
  this.addEventListener("error", (e) => {
    e.preventDefault();
    console.log("Caught:", (e as CustomEvent).detail.error);
  });
  return () => props().children;
}

createRoot(document.body).render(<App name="World" />);
