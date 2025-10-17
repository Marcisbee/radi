import { Bench } from "npm:tinybench";
import {
  createElement as createElementReact,
  createRef,
  useLayoutEffect,
} from "npm:react";
import { createRoot } from "npm:react-dom/client";

import { createElement } from "../main.ts";

import { waitUntilElementVisible } from "./bench.utils.ts";

const bench = new Bench();

{
  bench.add(
    "innerHTML",
    async () => {
      document.body.innerHTML = "<h1>Hello bench</h1>";

      await waitUntilElementVisible("//h1[contains(., 'Hello')]");
    },
    {
      beforeEach() {
        document.body.innerHTML = "";
      },
    },
  );
}

{
  // deno-lint-ignore no-inner-declarations
  function Simple() {
    return <h1>Hello bench</h1>;
  }

  bench.add(
    "radi",
    async () => {
      const component = <Simple />;
      document.body.appendChild(component);

      await waitUntilElementVisible("//h1[contains(., 'Hello')]");
    },
    {
      beforeEach() {
        document.body.innerHTML = "";
      },
    },
  );
}

{
  // deno-lint-ignore no-inner-declarations
  function Simple() {
    return createElementReact("h1", null, "Hello bench");
  }

  let root: ReturnType<typeof createRoot> | null = null;
  bench.add(
    "react",
    async () => {
      const component = createElementReact(Simple);
      root = createRoot(document.body);
      root.render(component);

      await waitUntilElementVisible("//h1[contains(., 'Hello')]");
    },
    {
      beforeEach() {
        document.body.innerHTML = "";
      },
      afterEach() {
        root.unmount();
      },
    },
  );
}

await bench.run();
console.table(bench.table());
