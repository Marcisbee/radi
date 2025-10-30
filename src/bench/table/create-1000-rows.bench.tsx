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
      const clear = await waitForXPath<HTMLButtonElement>(
        "//button[@id='clear']",
      );
      clear.click();
    },
    async beforeAll() {
      document.body.innerHTML = "";
      await mount();
      await waitForXPath(`//h1[text()=${JSON.stringify(title)}]`);
      await waitForXPath("//button[@id='clear']");
    },
    async afterAll() {
      await unmount();
      document.body.innerHTML = "";
    },
  };

  bench.add(name, async () => {
    (document.getElementById("run") as HTMLButtonElement).click();
    await waitForXPath("//tbody/tr[1000]");
  }, hooks);
}

await bench.run();
console.table(bench.table());
