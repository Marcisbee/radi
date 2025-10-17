import { Bench } from "npm:tinybench";

import { createElement } from "../main.ts";

function Simple() {
  return <h1>Hello bench</h1>;
}

const bench = new Bench({ iterations: 1 });

bench
  .add("innerHTML", () => {
    document.body.innerHTML = "";
    document.body.innerHTML = "<h1>Hello bench</h1>";
  })
  .add("radi", async () => {
    const component = <Simple />;
    document.body.innerHTML = "";
    document.body.appendChild(component);
    await new Promise((resolve) =>
      component.addEventListener("connect", resolve, { once: true })
    );
  });

await bench.run();

console.table(bench.table());
