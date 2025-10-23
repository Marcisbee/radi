import { Bench } from "npm:tinybench";
import {
  createElement as createElementReact,
  createRef,
  useLayoutEffect,
} from "npm:react";
import { createRoot as createRootReact } from "npm:react-dom/client";

import { waitForXPath } from "./bench.utils.ts";
import { createRoot } from "../client.ts";

const bench = new Bench();

{
  bench.add(
    "innerHTML",
    async () => {
      document.body.innerHTML = "<h1>Hello bench</h1>";

      await waitForXPath("//h1[text()='Hello bench']");
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

  let root: ReturnType<typeof createRoot> | null = null;
  bench.add(
    "radi",
    async () => {
      const component = <Simple />;
      root = createRoot(document.body);
      root!.render(component);

      await waitForXPath("//h1[text()='Hello bench']");
    },
    {
      beforeEach() {
        document.body.innerHTML = "";
      },
      afterEach() {
        root?.unmount();
        root = null;
      },
    },
  );
}

{
  // deno-lint-ignore no-inner-declarations
  function Simple() {
    return createElementReact("h1", null, "Hello bench");
  }

  let root: ReturnType<typeof createRootReact> | null = null;
  bench.add(
    "react",
    async () => {
      const component = createElementReact(Simple);
      root = createRootReact(document.body);
      root.render(component);

      await waitForXPath("//h1[text()='Hello bench']");
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
