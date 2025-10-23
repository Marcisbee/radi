// deno-lint-ignore-file no-inner-declarations
import { Bench } from "npm:tinybench";
import { waitForXPath } from "../bench.utils.ts";
import { createRoot, update } from "../../client.ts";
import * as Radi from "./frameworks/radi.tsx";
import * as Vanilla from "./frameworks/vanilla.tsx";
import * as React from "./frameworks/react.tsx";

const bench = new Bench({
  warmupIterations: 5,
  time: 1,
  iterations: 20,
});

{
  let root: ReturnType<typeof createRoot> | null = null;
  bench.add(
    "radi",
    async () => {
      (document.getElementById("run") as HTMLButtonElement).click();
      await waitForXPath("//tbody/tr[1000]");
    },
    {
      beforeEach() {
        (document.getElementById("clear") as HTMLButtonElement).click();
      },
      async beforeAll() {
        document.body.innerHTML = "";
        const cmp = <Radi.App />;
        root = createRoot(document.body);
        root.render(cmp);
        await waitForXPath("//h1[text()='Radi']");
      },
      afterAll() {
        root?.unmount();
        root = null;
      },
    },
  );
}

{
  bench.add(
    "vanilla",
    async () => {
      (document.getElementById("run") as HTMLButtonElement).click();
      await waitForXPath("//tbody/tr[1000]");
    },
    {
      beforeEach() {
        (document.getElementById("clear") as HTMLButtonElement).click();
        // replaced direct render/reset with clear button click
      },
      async beforeAll() {
        document.body.innerHTML = "";
        Vanilla.setupVanilla(document.body);
        await waitForXPath("//h1[text()='Vanilla']");
      },
    },
  );
}

{
  bench.add(
    "react",
    async () => {
      (document.getElementById("run") as HTMLButtonElement).click();
      await waitForXPath("//tbody/tr[1000]");
    },
    {
      beforeEach() {
        (document.getElementById("clear") as HTMLButtonElement).click();
      },
      async beforeAll() {
        document.body.innerHTML = "";
        React.setupReact(document.body);
        await waitForXPath("//h1[text()='React']");
      },
      afterAll() {
        React.cleanupReact();
      },
    },
  );
}

await bench.run();
console.table(bench.table());
