// deno-lint-ignore-file no-inner-declarations
import { Bench } from "npm:tinybench";
import { waitForXPath } from "../bench.utils.ts";
import { createRoot, update } from "../../main.ts";
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
      Radi.actionAdd();
      await waitForXPath("//tbody/tr[2000]");
    },
    {
      beforeEach() {
        Radi.resetState();
        Radi.setRows(Radi.buildData(1000));
        update(Radi.table);
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
      Vanilla.actionAdd();
      await waitForXPath("//tbody/tr[2000]");
    },
    {
      beforeEach() {
        Vanilla.actionRun();
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
      React.actionAdd();
      await waitForXPath("//tbody/tr[2000]");
    },
    {
      beforeEach() {
        React.actionRun();
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
