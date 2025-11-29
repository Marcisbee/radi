import { assert, test } from "@marcisbee/rion/test";
import {
  createElement as hServer,
  Fragment as ServerFragment,
  renderToStringRoot,
} from "../../server.ts";
import {
  createElement as hClient,
  createRoot,
  Fragment as ClientFragment,
} from "../../client.ts";

/**
 * Strict parity tests for reactive generators & subscribables.
 * All cases compare server HTML string output to client DOM snapshot after initial render.
 * Expectations:
 *  - Reactive function children produce identical boundary/comment structure.
 *  - Nested reactive functions render equivalent nested placeholders/content.
 *  - Reactive functions inside fragments match boundary markers.
 *  - Subscribables: initial snapshot shape matches (empty or sampled) in both environments.
 *  - Mixed reactive + subscribable combinations preserve ordering and markers.
 */

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function renderClient(node: unknown): string {
  const root = createRoot(document.body);
  const el = root.render(node as any);
  return el instanceof HTMLElement ? el.outerHTML : document.body.innerHTML;
}

/* -------------------------------------------------------------------------- */
/* Reactive Function Tests                                                    */
/* -------------------------------------------------------------------------- */

test("reactive: single function child parity", () => {
  const serverHTML = renderToStringRoot(
    hServer("div", null, (_el: Element) => "R"),
  );
  const clientHTML = renderClient(
    hClient("div", null, (_el: Element) => "R"),
  );
  assert.snapshot.html(serverHTML, clientHTML);
});

test("reactive: nested reactive function (function returns function)", () => {
  const nested = (_el: Element) => (_el2: Element) => "NR";
  const serverHTML = renderToStringRoot(
    hServer("div", null, nested),
  );
  const clientHTML = renderClient(
    hClient("div", null, nested),
  );
  assert.snapshot.html(serverHTML, clientHTML);
});

test("reactive: reactive inside fragment", () => {
  const serverHTML = renderToStringRoot(
    hServer(
      "div",
      null,
      hServer(
        ServerFragment,
        null,
        (_el: Element) => "F1",
        " ",
        (_: Element) => "F2",
      ),
    ),
  );
  const clientHTML = renderClient(
    hClient(
      "div",
      null,
      hClient(
        ClientFragment,
        null,
        (_el: Element) => "F1",
        " ",
        (_: Element) => "F2",
      ),
    ),
  );
  assert.snapshot.html(serverHTML, clientHTML);
});

test("reactive: component wrapping reactive child", () => {
  function CompServer() {
    return hServer("span", null, (_el: Element) => "C-R");
  }
  function CompClient() {
    return hClient("span", null, (_el: Element) => "C-R");
  }
  const serverHTML = renderToStringRoot(hServer(CompServer, null));
  const clientHTML = renderClient(hClient(CompClient, null));
  assert.snapshot.html(serverHTML, clientHTML);
});

test("reactive: nested components with reactive chain", () => {
  function InnerServer() {
    return hServer("i", null, (_: Element) => "Inner");
  }
  function OuterServer() {
    return hServer(
      "div",
      null,
      hServer(InnerServer, null),
      (_: Element) => "Outer",
    );
  }
  function InnerClient() {
    return hClient("i", null, (_: Element) => "Inner");
  }
  function OuterClient() {
    return hClient(
      "div",
      null,
      hClient(InnerClient, null),
      (_: Element) => "Outer",
    );
  }
  const serverHTML = renderToStringRoot(hServer(OuterServer, null));
  const clientHTML = renderClient(hClient(OuterClient, null));
  assert.snapshot.html(serverHTML, clientHTML);
});

/* -------------------------------------------------------------------------- */
/* Subscribable Tests                                                         */
/* -------------------------------------------------------------------------- */

function createStore(initial: unknown, emitInitial: boolean) {
  return {
    subscribe(fn: (v: unknown) => void) {
      if (emitInitial) fn(initial);
    },
  };
}

function createNestedStore(innerInitial: unknown, emitInner: boolean) {
  const inner = {
    subscribe(fn: (v: unknown) => void) {
      if (emitInner) fn(innerInitial);
    },
  };
  return {
    subscribe(fn: (v: unknown) => void) {
      fn(inner);
    },
  };
}

test("subscribable: immediate emission (one-shot store)", () => {
  const store = createStore("S1", true);
  const serverHTML = renderToStringRoot(
    hServer("div", null, store),
  );
  const clientHTML = renderClient(
    hClient("div", null, store),
  );
  assert.snapshot.html(serverHTML, clientHTML);
});

test("subscribable: no initial emission (deferred store)", () => {
  const store = createStore("S2", false);
  const serverHTML = renderToStringRoot(
    hServer("div", null, store),
  );
  const clientHTML = renderClient(
    hClient("div", null, store),
  );
  assert.snapshot.html(serverHTML, clientHTML);
});

test("subscribable: nested subscribable (outer emits inner)", () => {
  const nestedStore = createNestedStore("InnerValue", true);
  const serverHTML = renderToStringRoot(
    hServer("div", null, nestedStore),
  );
  const clientHTML = renderClient(
    hClient("div", null, nestedStore),
  );
  assert.snapshot.html(serverHTML, clientHTML);
});

/* -------------------------------------------------------------------------- */
/* Mixed Reactive + Subscribable                                              */
/* -------------------------------------------------------------------------- */

test("mixed: reactive and subscribable siblings", () => {
  const store = createStore("MS", true);
  const serverHTML = renderToStringRoot(
    hServer("div", null, (_: Element) => "RX", store, "TAIL"),
  );
  const clientHTML = renderClient(
    hClient("div", null, (_: Element) => "RX", store, "TAIL"),
  );
  assert.snapshot.html(serverHTML, clientHTML);
});

test("mixed: reactive inside fragment with subscribable sibling", () => {
  const store = createStore("FS", true);
  const serverHTMLRaw = renderToStringRoot(
    hServer(
      "section",
      null,
      hServer(ServerFragment, null, (_: Element) => "FR", store, "END"),
    ),
  );
  const clientHTMLRaw = renderClient(
    hClient(
      "section",
      null,
      hClient(ClientFragment, null, (_: Element) => "FR", store, "END"),
    ),
  );
  assert.snapshot.html(serverHTMLRaw, clientHTMLRaw);
});

/* -------------------------------------------------------------------------- */
/* Run                                                                        */
/* -------------------------------------------------------------------------- */

await test.run();
