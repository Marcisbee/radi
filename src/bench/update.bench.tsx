import { bench } from "@marcisbee/rion/bench";
import { locator } from "@marcisbee/rion/locator";
import { createElement as createElementReact, useState } from "npm:react";
import { createRoot as createRootReact } from "npm:react-dom/client";
import { flushSync } from "npm:react-dom";

import { createRoot, update } from "../client.ts";

let count = 0;

bench("innerHTML", {
  setup() {
    count = 0;
    function update() {
      document.body.innerHTML = `<button>${count}</button>`;
      const button = document.body.querySelector("button") as HTMLButtonElement;
      button.onclick = () => {
        count++;
        update();
      };
    }
    update();
  },
}, async () => {
  const countToWaitFor = count + 1;
  const button = await locator("button").getOne() as HTMLButtonElement;

  button.click();

  await locator("button").hasText(String(countToWaitFor)).getOne();
});

bench("textContent", {
  async setup() {
    count = 0;
    document.body.innerHTML = `<button>${count}</button>`;
    const button = await locator("button")
      .getOne() as HTMLButtonElement;
    const buttonText = button.childNodes[0] as Text;
    button.onclick = () => {
      count++;
      buttonText.textContent = String(count);
    };
  },
}, async () => {
  const countToWaitFor = count + 1;
  const button = await locator("button").getOne() as HTMLButtonElement;

  button.click();

  await locator("button").hasText(String(countToWaitFor)).getOne();
});

bench("nodeValue", {
  async setup() {
    count = 0;
    document.body.innerHTML = `<button>${count}</button>`;
    const button = await locator("button").getOne() as HTMLButtonElement;
    const buttonText = button.childNodes[0] as Text;
    button.onclick = () => {
      count++;
      buttonText.nodeValue = String(count);
    };
  },
}, async () => {
  const countToWaitFor = count + 1;
  const button = await locator("button").getOne() as HTMLButtonElement;

  button.click();

  await locator("button").hasText(String(countToWaitFor)).getOne();
});

bench("radi", {
  async setup() {
    function RadiCounter(this: HTMLElement) {
      return (
        <button
          onclick={() => {
            count++;
            update(this);
          }}
        >
          {() => count}
        </button>
      );
    }

    count = 0;
    const cmp = <RadiCounter />;
    createRoot(document.body).render(cmp);

    await locator("button").hasText(String(0)).getOne();
  },
}, async () => {
  const countToWaitFor = count + 1;
  const button = await locator("button").getOne() as HTMLButtonElement;

  button.click();

  await locator("button").hasText(String(countToWaitFor)).getOne();
});

bench("react", {
  async setup() {
    function ReactCounter() {
      const [, setTick] = useState(0);

      return createElementReact(
        "button",
        {
          onClick: () => {
            count++;
            flushSync(() => setTick((t) => t + 1));
          },
        },
        String(count),
      );
    }

    count = 0;
    createRootReact(document.body).render(
      createElementReact(ReactCounter, null),
    );

    await locator("button").hasText(String(0)).getOne();
  },
}, async () => {
  const countToWaitFor = count + 1;
  const button = await locator("button").getOne() as HTMLButtonElement;

  button.click();

  await locator("button").hasText(String(countToWaitFor)).getOne();
});

await bench.run();
