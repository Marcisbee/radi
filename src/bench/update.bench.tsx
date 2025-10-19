// deno-lint-ignore-file no-inner-declarations
import { Bench } from "npm:tinybench";
import {
  createElement as createElementReact,
  useLayoutEffect,
  useRef,
  useState,
} from "npm:react";
import { createRoot } from "npm:react-dom/client";
import { flushSync } from "npm:react-dom";

import { waitForXPath } from "./bench.utils.ts";
import { update } from "../main.ts";

const bench = new Bench();

{
  let count = 0;
  let button: HTMLButtonElement | null = null;
  bench.add(
    `innerHTML`,
    async () => {
      const countToWaitFor = count + 1;
      button?.click();

      // Wait until final value appears
      await waitForXPath(`//button[text()='${countToWaitFor}']`);
    },
    {
      beforeEach() {
        button = document.querySelector("button")!;
        button.onclick = () => {
          count++;
          document.body.innerHTML = `<button>${count}</button>`;
        };
      },
      async beforeAll() {
        count = 0;
        document.body.innerHTML = `<button>${count}</button>`;
        await waitForXPath(`//button[text()='0']`);
      },
    },
  );
}

{
  let count = 0;
  let button: HTMLButtonElement | null = null;
  bench.add(
    `textContent`,
    async () => {
      const countToWaitFor = count + 1;
      button?.click();

      // Wait until final value appears
      await waitForXPath(`//button[text()='${countToWaitFor}']`);
    },
    {
      beforeEach() {
        button = document.querySelector("button")!;
        const buttonText = button.childNodes[0] as Text;
        button.onclick = () => {
          count++;
          buttonText.textContent = String(count);
        };
      },
      async beforeAll() {
        count = 0;
        document.body.innerHTML = `<button>${count}</button>`;
        await waitForXPath(`//button[text()='0']`);
      },
    },
  );
}

{
  let count = 0;
  let button: HTMLButtonElement | null = null;
  bench.add(
    `nodeValue`,
    async () => {
      const countToWaitFor = count + 1;
      button?.click();

      // Wait until final value appears
      await waitForXPath(`//button[text()='${countToWaitFor}']`);
    },
    {
      beforeEach() {
        button = document.querySelector("button")!;
        const buttonText = button.childNodes[0] as Text;
        button.onclick = () => {
          count++;
          buttonText.nodeValue = String(count);
        };
      },
      async beforeAll() {
        count = 0;
        document.body.innerHTML = `<button>${count}</button>`;
        await waitForXPath(`//button[text()='0']`);
      },
    },
  );
}

{
  function RadiCounter(
    this: HTMLElement,
  ) {
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
  let count = 0;
  let button: HTMLButtonElement | null = null;
  bench.add(
    `radi`,
    async () => {
      const countToWaitFor = count + 1;
      button?.click();

      // Wait until final value appears
      await waitForXPath(`//button[text()='${countToWaitFor}']`);
    },
    {
      beforeEach() {
        button = document.querySelector("button");
      },
      async beforeAll() {
        count = 0;
        document.body.innerHTML = "";
        const cmp = <RadiCounter />;
        document.body.appendChild(cmp);
        await waitForXPath(`//button[text()='0']`);
      },
    },
  );
}

{
  let count = 0;
  let button: HTMLButtonElement | null = null;

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

  let reactRoot: ReturnType<typeof createRoot> | null = null;

  bench.add(
    `react`,
    async () => {
      const countToWaitFor = count + 1;
      button?.click();

      // Wait until final value appears
      await waitForXPath(`//button[text()='${countToWaitFor}']`);
    },
    {
      beforeEach() {
        button = document.querySelector("button");
      },
      async beforeAll() {
        count = 0;
        document.body.innerHTML = "";
        reactRoot = createRoot(document.body);
        reactRoot.render(createElementReact(ReactCounter, null));
        await waitForXPath(`//button[text()='0']`);
      },
      afterAll() {
        reactRoot?.unmount();
        reactRoot = null;
      },
    },
  );
}

await bench.run();
console.table(bench.table());
