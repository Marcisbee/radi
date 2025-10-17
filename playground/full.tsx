import {
  createAbortSignal,
  createElement,
  Fragment,
  render,
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

  this.addEventListener(
    "suspension",
    async () => {
      suspend(this);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      state = "unsuspended";
      update(this);
      unsuspend(this);
    },
    { once: true },
  );

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
      <div>{() => (tab === "tab1" ? <Tab1 /> : <Tab2 />)}</div>
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
      </div>
      <hr />
      <ThemeProvider>
        <h1>Channel Demo</h1>
        <Badge />
        <Nested />
      </ThemeProvider>
      <hr />
      <Sub1 />
    </div>
  );
}

render(<App name="World" />, document.body);
