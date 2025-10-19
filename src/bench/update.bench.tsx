import { Bench } from "npm:tinybench";
import {
  createElement as createElementReact,
  useLayoutEffect,
  useRef,
  useState,
} from "npm:react";
import { createRoot } from "npm:react-dom/client";
import { flushSync } from "npm:react-dom";

import { waitUntilElementVisible } from "./bench.utils.ts";
import { update } from "../main.ts";

const ITERATIONS = 1000;

const bench = new Bench({
  time: 200, // some steady sampling window (ms)
  iterations: 1, // we manually loop count increments inside each task
});

bench.add(
  `innerHTML`,
  async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      document.body.innerHTML = `<span>${i}</span>`;
    }

    // Wait until final value appears
    await waitUntilElementVisible(`//span[contains(., '${ITERATIONS - 1}')]`);
  },
  {
    beforeEach() {
      document.body.innerHTML = "";
    },
  },
);

bench.add(
  `textContent`,
  async () => {
    const span = document.createElement("span");
    document.body.appendChild(span);

    for (let i = 0; i < ITERATIONS; i++) {
      span.textContent = `${i}`;
    }

    await waitUntilElementVisible(`//span[contains(., '${ITERATIONS - 1}')]`);
  },
  {
    beforeEach() {
      document.body.innerHTML = "";
    },
  },
);

function RadiCounter(
  this: HTMLElement,
  props: JSX.Props<{ iterations: number }>,
) {
  let count = 0;

  for (let i = 0; i < props().iterations; i++) {
    count = i;
    update(this);
  }

  return <span>{() => count}</span>;
}

bench.add(
  `radi`,
  async () => {
    const cmp = <RadiCounter iterations={ITERATIONS} />;
    document.body.appendChild(cmp);

    await waitUntilElementVisible(`//span[contains(., '${ITERATIONS - 1}')]`);
  },
  {
    beforeEach() {
      document.body.innerHTML = "";
    },
  },
);

function ReactCounter(props: { iterations: number }) {
  const [count, setCount] = useState(0);
  const ran = useRef(false);

  useLayoutEffect(() => {
    if (ran.current) return;
    ran.current = true;
    for (let i = 0; i < props.iterations; i++) {
      flushSync(() => setCount(i));
    }
  }, [props.iterations]);

  return createElementReact("span", null, count);
}

let reactRoot: ReturnType<typeof createRoot> | null = null;

bench.add(
  `react`,
  async () => {
    reactRoot = createRoot(document.body);
    reactRoot.render(
      createElementReact(ReactCounter, { iterations: ITERATIONS }),
    );

    await waitUntilElementVisible(`//span[contains(., '${ITERATIONS - 1}')]`);
  },
  {
    beforeEach() {
      document.body.innerHTML = "";
    },
    afterEach() {
      reactRoot?.unmount();
      reactRoot = null;
    },
  },
);

await bench.run();
console.table(bench.table());
