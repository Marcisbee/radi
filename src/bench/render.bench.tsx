import { bench } from "@marcisbee/rion/bench";
import { locator } from "@marcisbee/rion/locator";
import { createElement as createElementReact } from "npm:react";
import { createRoot as createRootReact } from "npm:react-dom/client";

import { createRoot } from "../client.ts";

bench(
  "innerHTML",
  {
    setup() {
      document.body.innerHTML = "";
      document.body.innerHTML = "<h1>Hello bench</h1>";
    },
  },
  async () => {
    await locator("h1").hasText("Hello bench").getOne();
  },
);

{
  let root: ReturnType<typeof createRoot> | null = null;

  function Simple() {
    return <h1>Hello bench</h1>;
  }

  bench(
    "radi",
    {
      setup() {
        document.body.innerHTML = "";
      },
    },
    async () => {
      root = createRoot(document.body);
      root.render(<Simple />);
      await locator("h1").hasText("Hello bench").getOne();
      root?.unmount();
      root = null;
    },
  );
}

{
  let root: ReturnType<typeof createRootReact> | null = null;

  function SimpleReact() {
    return createElementReact("h1", null, "Hello bench");
  }

  bench(
    "react",
    {
      setup() {
        document.body.innerHTML = "";
      },
    },
    async () => {
      root = createRootReact(document.body);
      root.render(createElementReact(SimpleReact));
      await locator("h1").hasText("Hello bench").getOne();
      root?.unmount();
      root = null;
    },
  );
}

await bench.run();
