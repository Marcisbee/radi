import { bench } from "@marcisbee/rion/bench";
import { locator } from "@marcisbee/rion/locator";

import { entries } from "./entries.ts";

for (const [name, load] of entries) {
  // deno-lint-ignore no-inner-declarations
  async function setup() {
    await load();
    await locator("h1").getOne();
  }

  bench(name, setup, async () => {
    const button = await locator("button#runlots").getOne() as HTMLElement;
    button.click();

    // Force layout read to avoid batching and ensure DOM is updated
    document.body.offsetHeight;

    await locator("tbody > tr").nth(10000).getOne();
  });
}

await bench.run();
