import { Bench, type FnOptions } from "npm:tinybench";
import { waitForXPath } from "../bench.utils.ts";
import { entries } from "./entries.ts";

const bench = new Bench({
  warmupIterations: 5,
  time: 1,
  iterations: 20,
});

for (const [name, { title, mount, unmount }] of entries) {
  const hooks: FnOptions = {
    async beforeEach() {
      (document.getElementById("run") as HTMLButtonElement).click();
      await waitForXPath("//tbody/tr[1000]");
    },
    async beforeAll() {
      document.body.innerHTML = "";
      await mount();
      await waitForXPath(`//h1[text()=${JSON.stringify(title)}]`);
    },
    async afterAll() {
      await unmount();
    },
  };

  bench.add(name, async () => {
    (document.getElementById("add") as HTMLButtonElement).click();
    await waitForXPath("//tbody/tr[2000]");
  }, hooks);
}

await bench.run();
console.table(bench.table());
