import { assert, test } from "@marcisbee/rion/test";
import {
  createElement as server,
  Fragment as serverFragment,
  renderToStringRoot,
} from "../../server.ts";
import {
  createElement as client,
  createRoot,
  Fragment as clientFragment,
} from "../../client.ts";

import * as Server from "./components.server.tsx";
import * as Client from "./components.client.tsx";

test("matches simple node", () => {
  const htmlServer = renderToStringRoot(
    server("div", null),
  );

  const htmlClient = createRoot(document.body).render(
    client("div", null),
  );

  assert.snapshot.html(
    htmlServer,
    htmlClient,
  );
});

test("matches simple node with children", () => {
  const htmlServer = renderToStringRoot(
    server("div", null, "Hello", " ", "World"),
  );

  const htmlClient = createRoot(document.body).render(
    client("div", null, "Hello", " ", "World"),
  );

  assert.snapshot.html(
    htmlServer,
    htmlClient,
  );
});

test("matches simple node with children & props", () => {
  const htmlServer = renderToStringRoot(
    server(
      "div",
      { className: "foo", style: { color: "red" } },
      "Hello",
      " ",
      "World",
    ),
  );

  const htmlClient = createRoot(document.body).render(
    client(
      "div",
      { className: "foo", style: { color: "red" } },
      "Hello",
      " ",
      "World",
    ),
  );

  assert.snapshot.html(
    htmlServer,
    htmlClient,
  );
});

test("matches simple node with nested children & props", () => {
  const htmlServer = renderToStringRoot(
    server(
      "div",
      { id: "parent" },
      "Hello",
      " ",
      server("strong", null, "Radi"),
    ),
  );

  const htmlClient = createRoot(document.body).render(
    client(
      "div",
      { id: "parent" },
      "Hello",
      " ",
      client("strong", null, "Radi"),
    ),
  );

  assert.snapshot.html(
    htmlServer,
    htmlClient,
  );
});

test("matches simple app", () => {
  const htmlServer = renderToStringRoot(
    server(Server.App, null),
  );

  const htmlClient = createRoot(document.body).render(
    client(Client.App, null),
  );

  assert.snapshot.html(
    htmlServer,
    htmlClient,
  );
});

test("matches boolean and null children", () => {
  const htmlServer = renderToStringRoot(
    server("div", null, true, null, false),
  );

  const htmlClient = createRoot(document.body).render(
    client("div", null, true, null, false),
  );

  assert.snapshot.html(
    htmlServer,
    htmlClient,
  );
});

test("matches style camelCase serialization", () => {
  const htmlServer = renderToStringRoot(
    server(
      "div",
      { style: { paddingLeft: 10, backgroundColor: "yellow" } },
      "Styled",
    ),
  );

  const htmlClient = createRoot(document.body).render(
    client(
      "div",
      { style: { paddingLeft: 10, backgroundColor: "yellow" } },
      "Styled",
    ),
  );

  assert.snapshot.html(
    htmlServer,
    htmlClient,
  );
});

test("matches nested component inside element", () => {
  const htmlServer = renderToStringRoot(
    server("section", null, server(Server.App, null)),
  );

  const htmlClient = createRoot(document.body).render(
    client("section", null, client(Client.App, null)),
  );

  assert.snapshot.html(
    htmlServer,
    htmlClient,
  );
});

test("matches null and numeric props", () => {
  const htmlServer = renderToStringRoot(
    server("div", { datanull: null, datanum: 0, databool: true }, "Values"),
  );

  const htmlClient = createRoot(document.body).render(
    client("div", { datanull: null, datanum: 0, databool: true }, "Values"),
  );

  assert.snapshot.html(
    htmlServer,
    htmlClient,
  );
});

test("matches fragment children", () => {
  const htmlServer = renderToStringRoot(
    server("div", null, server(serverFragment, null, "A", "B")),
  );
  const htmlClient = createRoot(document.body).render(
    client("div", null, client(clientFragment, null, "A", "B")),
  );
  assert.snapshot.html(htmlServer, htmlClient);
});

test("matches nested fragments", () => {
  const htmlServer = renderToStringRoot(
    server(
      "div",
      null,
      server(
        serverFragment,
        null,
        "X",
        server(serverFragment, null, "Y", "Z"),
      ),
    ),
  );
  const htmlClient = createRoot(document.body).render(
    client(
      "div",
      null,
      client(
        clientFragment,
        null,
        "X",
        client(clientFragment, null, "Y", "Z"),
      ),
    ),
  );
  assert.snapshot.html(htmlServer, htmlClient);
});

// Simple subscribable mock (synchronous initial emission)
function makeSubscribable(initial: unknown) {
  return {
    subscribe(fn: (v: unknown) => void) {
      fn(initial);
    },
  };
}

test("matches subscribable child", () => {
  const sub = makeSubscribable("Sub");
  const htmlServer = renderToStringRoot(
    server("div", null, sub),
  );
  const htmlClient = createRoot(document.body).render(
    client("div", null, sub),
  );
  assert.snapshot.html(htmlServer, htmlClient);
});

test("matches reactive function child", () => {
  const htmlServer = renderToStringRoot(
    server("div", null, (_el: Element) => "R"),
  );
  const htmlClient = createRoot(document.body).render(
    client("div", null, (_el: Element) => "R"),
  );
  assert.snapshot.html(htmlServer, htmlClient);
});

await test.run();
