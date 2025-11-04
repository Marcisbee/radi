import { bench } from "@marcisbee/rion/bench";
import { locator } from "@marcisbee/rion/locator";

import { entries } from "./entries.ts";

for (const [name, load] of entries) {
  // deno-lint-ignore no-inner-declarations
  async function setup() {
    await load();
    await locator("h1").getOne();

    const button = await locator("#run").getOne() as HTMLElement;
    button.click();

    await locator("tbody > tr").nth(1000).getOne();
  }

  bench(name, setup, async () => {
    const button = await locator("#update").getOne() as HTMLButtonElement;
    button.click();

    // Force layout read to avoid batching and ensure DOM is updated
    document.body.offsetHeight;

    await locator("tbody > tr").nth(1).locate("td").nth(2).locate("a").hasText(
      " !!!",
    ).getOne();
  });
}

await bench.run();
