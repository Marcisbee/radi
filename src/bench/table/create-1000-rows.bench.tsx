import { bench } from "@marcisbee/rion/bench";
import { interact, locator } from "@marcisbee/rion/locator";

import { entries } from "./entries.ts";

for (const [name, load] of entries) {
  bench(name, {
    async setup() {
      await load();
      await locator("h1").getOne();
    },
    async afterEach() {
      await interact(locator("#clear")).click();
      await locator("tbody").not("tr").getOne();
    },
  }, async () => {
    await interact(locator("#run")).click();
    await locator("tbody > tr").nth(1000).getOne();
  });
}

await bench.run();
