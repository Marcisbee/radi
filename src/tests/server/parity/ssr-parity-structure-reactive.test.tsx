import { assert, test } from "@marcisbee/rion";
import {
  createElement as hServer,
  Fragment as ServerFragment,
  renderToStringRoot,
} from "../../../server.ts";
import {
  createElement as hClient,
  createRoot,
  Fragment as ClientFragment,
} from "../../../client.ts";

/**
 * Parity edge case tests for structural + reactive behaviors:
 *  - Empty fragments
 *  - Fragment with primitives only
 *  - Fragment with reactive functions (deferred placeholders)
 *  - Nested fragments (multi-level)
 *  - Component returning Fragment / arrays + mixed children
 *  - Reactive function returning multiple nodes / fragment sentinel
 *  - Subscribables (no initial sample) & nested subscribables
 *  - Component returning null / boolean
 *  - Deep nesting of Fragment -> Component -> Fragment -> Reactive -> Primitive
 *
 * Snapshot strategy:
 *  - Server: renderToStringRoot(...)
 *  - Client: createRoot(document.body).render(...)
 *  - Compare raw HTML string / outerHTML (for element roots).
 */

function snapshot(serverNode: unknown, clientNode: unknown) {
  const serverHTML = renderToStringRoot(serverNode as any);
  const root = createRoot(document.body);
  const clientRendered = root.render(clientNode as any);
  const clientHTML = clientRendered instanceof HTMLElement
    ? clientRendered.outerHTML
    : document.body.innerHTML;
  assert.snapshot.html(serverHTML, clientHTML);
}

// Helper: subscribable without initial emission (parity yields empty fragment markers)
function makeStore(emit: boolean) {
  return {
    subscribe(fn: (v: unknown) => void) {
      if (emit) fn("VALUE");
    },
  };
}

// Nested subscribable: outer emits inner store (both without initial emission)
function makeNestedStore() {
  const inner = makeStore(false);
  return {
    subscribe(fn: (v: unknown) => void) {
      fn(inner);
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Fragments                                                                  */
/* -------------------------------------------------------------------------- */

test("fragment: empty", () => {
  snapshot(
    hServer("div", null, hServer(ServerFragment, null)),
    hClient("div", null, hClient(ClientFragment, null)),
  );
});

test("fragment: primitives only", () => {
  snapshot(
    hServer("div", null, hServer(ServerFragment, null, "A", " ", "B", 1)),
    hClient("div", null, hClient(ClientFragment, null, "A", " ", "B", 1)),
  );
});

test("fragment: reactive placeholders inside fragment", () => {
  snapshot(
    hServer(
      "div",
      null,
      hServer(
        ServerFragment,
        null,
        (_: Element) => "RX1",
        " mid ",
        (_: Element) => "RX2",
      ),
    ),
    hClient(
      "div",
      null,
      hClient(
        ClientFragment,
        null,
        (_: Element) => "RX1",
        " mid ",
        (_: Element) => "RX2",
      ),
    ),
  );
});

test("fragment: nested fragments with primitives & reactive placeholders", () => {
  snapshot(
    hServer(
      "div",
      null,
      hServer(
        ServerFragment,
        null,
        "L1-",
        hServer(ServerFragment, null, "L2-", (_: Element) => "R"),
        "END",
      ),
    ),
    hClient(
      "div",
      null,
      hClient(
        ClientFragment,
        null,
        "L1-",
        hClient(ClientFragment, null, "L2-", (_: Element) => "R"),
        "END",
      ),
    ),
  );
});

/* -------------------------------------------------------------------------- */
/* Components returning fragments / complex trees                             */
/* -------------------------------------------------------------------------- */

function CompFragmentServer() {
  return hServer(ServerFragment, null, "CF", (_: Element) => "R", "X");
}
function CompFragmentClient() {
  return hClient(ClientFragment, null, "CF", (_: Element) => "R", "X");
}

test("component: returns fragment with reactive placeholders", () => {
  snapshot(
    hServer("section", null, hServer(CompFragmentServer, null)),
    hClient("section", null, hClient(CompFragmentClient, null)),
  );
});

function CompMixedServer() {
  return [
    hServer("span", null, "S1"),
    (_: Element) => "RS",
    hServer(ServerFragment, null, "F1", (_: Element) => "RF"),
    makeStore(false),
    null,
    true,
    0,
  ];
}
function CompMixedClient() {
  return [
    hClient("span", null, "S1"),
    (_: Element) => "RS",
    hClient(ClientFragment, null, "F1", (_: Element) => "RF"),
    makeStore(false),
    null,
    true,
    0,
  ];
}

test("component: returns array mixing element/reactive/fragment/subscribable/primitives", () => {
  snapshot(
    hServer("div", null, hServer(CompMixedServer, null)),
    hClient("div", null, hClient(CompMixedClient, null)),
  );
});

/* -------------------------------------------------------------------------- */
/* Reactive function variations                                                */
/* -------------------------------------------------------------------------- */

test("reactive: function returning array of primitives", () => {
  snapshot(
    hServer("div", null, (_: Element) => ["A", "B", "C"]),
    hClient("div", null, (_: Element) => ["A", "B", "C"]),
  );
});

test("reactive: function returning fragment sentinel output", () => {
  snapshot(
    hServer(
      "div",
      null,
      (_: Element) => hServer(ServerFragment, null, "FX", "FY"),
    ),
    hClient(
      "div",
      null,
      (_: Element) => hClient(ClientFragment, null, "FX", "FY"),
    ),
  );
});

/* -------------------------------------------------------------------------- */
/* Subscribable edge cases                                                     */
/* -------------------------------------------------------------------------- */

test("subscribable: empty fragment (no initial emission) parity", () => {
  const store = makeStore(false);
  snapshot(
    hServer("div", null, store),
    hClient("div", null, store),
  );
});

test("subscribable: nested subscribable parity", () => {
  const nested = makeNestedStore();
  snapshot(
    hServer("div", null, nested),
    hClient("div", null, nested),
  );
});

test("subscribable: inside fragment with reactive & primitive siblings", () => {
  const storeA = makeStore(false);
  const storeB = makeStore(false);
  snapshot(
    hServer(
      "div",
      null,
      hServer(
        ServerFragment,
        null,
        "P1",
        storeA,
        (_: Element) => "RX",
        storeB,
        "P2",
      ),
    ),
    hClient(
      "div",
      null,
      hClient(
        ClientFragment,
        null,
        "P1",
        storeA,
        (_: Element) => "RX",
        storeB,
        "P2",
      ),
    ),
  );
});

/* -------------------------------------------------------------------------- */
/* Component host edge cases                                                   */
/* -------------------------------------------------------------------------- */

function CompNullServer() {
  return null;
}
function CompNullClient() {
  return null;
}
test("component: returns null child", () => {
  snapshot(
    hServer("div", null, hServer(CompNullServer, null)),
    hClient("div", null, hClient(CompNullClient, null)),
  );
});

function CompBoolServer() {
  return true;
}
function CompBoolClient() {
  return true;
}
test("component: returns boolean child", () => {
  snapshot(
    hServer("div", null, hServer(CompBoolServer, null)),
    hClient("div", null, hClient(CompBoolClient, null)),
  );
});

/* -------------------------------------------------------------------------- */
/* Deep structural parity                                                      */
/* -------------------------------------------------------------------------- */

function DeepReactiveServer() {
  return hServer(
    ServerFragment,
    null,
    hServer("em", null, "E1"),
    hServer(ServerFragment, null, "Inner-", (_: Element) => "IR"),
    (_: Element) => ["DR1", "DR2"],
    makeStore(false),
    "Tail",
  );
}
function DeepReactiveClient() {
  return hClient(
    ClientFragment,
    null,
    hClient("em", null, "E1"),
    hClient(ClientFragment, null, "Inner-", (_: Element) => "IR"),
    (_: Element) => ["DR1", "DR2"],
    makeStore(false),
    "Tail",
  );
}

test("deep: fragment -> element -> fragment -> reactive -> subscribable -> primitive chain", () => {
  snapshot(
    hServer("section", null, hServer(DeepReactiveServer, null)),
    hClient("section", null, hClient(DeepReactiveClient, null)),
  );
});

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */

await test.run();
