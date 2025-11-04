import { bench } from "@marcisbee/rion/bench";
import { locator } from "@marcisbee/rion/locator";

import { entries } from "./entries.ts";

for (const [name, load] of entries) {
  // deno-lint-ignore no-inner-declarations
  async function setup() {
    await load();
    await locator("h1").getOne();

    const button = await locator("button#run").getOne() as HTMLElement;
    button.click();

    await locator("tbody > tr").nth(1000).getOne();
  }

  bench(name, setup, async () => {
    const button = await locator("button#swaprows")
      .getOne() as HTMLButtonElement;
    button.click();

    // Force layout read to avoid batching and ensure DOM is updated
    document.body.offsetHeight;

    // Wait for both swapped positions to exist (indexes 2 and 999) ensuring full table rendered
    await locator("tbody > tr").nth(2).getOne();
    await locator("tbody > tr").nth(999).getOne();
  });
}

await bench.run();
