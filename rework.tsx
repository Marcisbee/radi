/** @jsxRuntime classic */
/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  Fragment,
  renderClient as render,
  update,
} from "./rework-fw.ts";

function Input1(this: DocumentFragment) {
  let i = 0;

  console.log("Input1");
  this.addEventListener("update", (e) => {
    console.log("Input1 UPDATE 1");
  }, { capture: true });
  this.addEventListener("request:update", (e) => {
    console.log("Input1 UPDATE 2");
  }, { capture: true });

  this.addEventListener("connect", () => {
    console.log("Input1 CONNECT");
  });

  this.addEventListener("disconnect", () => {
    console.log("Input1 DISCONNECT");
  });

  return (
    <div>
      <input type="text" value="test 1" />
      {() => i++}
    </div>
  );
}

function Input2(this: DocumentFragment) {
  let i = 0;
  console.log("Input2");
  this.addEventListener("update", (e) => {
    console.log("Input2 UPDATE");
  });

  this.addEventListener("connect", () => {
    console.log("Input2 CONNECT");
  });

  this.addEventListener("disconnect", () => {
    console.log("Input2 DISCONNECT");
  });
  return () => (
    <div>
      <input type="text" value="test 2" />
      {/*{() => i++}*/}
      {() => <div>{() => i++}</div>}
      {/*{(e) => (console.warn("calls", e.isConnected, i+1),i++)}*/}
      <hr />
      {i % 2 ? aa : bb}
    </div>
  );
}

function Counting(this: HTMLElement) {
  let count = 0;
  let count2 = 0;
  this.addEventListener("connect", () => {
    console.log("CONNECT--");
  });
  this.addEventListener("update", () => {
    count++;
    console.log("UPDATE--");
  });
  this.addEventListener("disconnect", () => {
    console.log("DISCONNECT--");
  });
  return (
    <div className="count">
      {() => count} : {() => () => () => count2++} : {() => Math.random()}
    </div>
  );
}

function aa() {
  return <div>aa</div>;
}

function bb() {
  return <div>bb</div>;
}

function App(this: DocumentFragment) {
  let count = 0;
  return (
    <div>
      {() => (count % 2
        ? <div>{() => "foo"}</div>
        : <span>{() => "bar"}</span>)}
      <h1 style="color:silver">
        [{() => [count, ", ", <strong>{() => Math.random()}</strong>]},{" "}
        {Math.random()}]
      </h1>
      <button
        type="button"
        onclick={() => {
          count++;
          update(this);
        }}
      >
        increment
      </button>
      <button
        type="button"
        onclick={() => {
          count++;
          update(this.reactiveChildren[0].querySelector("h1"));
        }}
      >
        increment h1 only
      </button>
      <Input1 />
      {() => <Input2 />}
      <Counting />
    </div>
  );
}

function Counter(this: HTMLElement) {
  console.log("RENDER COMPONENT");
  let count = 0;
  this.addEventListener("update", () => {
    console.log("COUNTER UPDATE (CAPTURE)", count);
  }, { capture: true });
  this.addEventListener("update", () => {
    console.log("COUNTER UPDATE", count);
  });
  return (
    <div>
      <span>{() => (console.log("RENDER REACTIVE", count), count)}</span>
      <button
        type="button"
        onclick={() => {
          console.log("COUNTER CLICK BEFORE", count);
          count++;
          update(this);
          console.log("COUNTER CLICK AFTER", count);
        }}
      >
        increment
      </button>
    </div>
  );
}

let name = "world";

render(<App />, document.body);
render(<App />, document.body);
render(
  <div>
    <Counting />
    <Counter />
  </div>,
  document.body,
);
// render(
//   <div id="asd" style="color: red;">Hello {() => [name, Math.random()]}!</div>,
//   document.body,
// );
// console.log(document.body.innerHTML);

// setTimeout(() => {
//   name = "mars";
//   update(document.getElementById("asd"));
// }, 500);

window.emit = update;
