import { assert, test } from "@marcisbee/rion";
import { createElement as server, renderToStringRoot } from "../../server.ts";
import { createElement as client, createRoot } from "../../client.ts";

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

await test.run();
