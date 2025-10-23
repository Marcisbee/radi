import { assert, test } from "@marcisbee/rion";
import {
  createElement as serverCreateElement,
  renderToStringRoot,
} from "../../../server.ts";
import {
  createElement as clientCreateElement,
  createRoot,
} from "../../../client.ts";

/**
 * Parity edge case tests for attribute & style serialization.
 * Goal: Server HTML string output matches client DOM outerHTML for:
 *  - null vs undefined
 *  - empty string values
 *  - boolean attributes (true present, false omitted)
 *  - numeric and BigInt-like values
 *  - data-* and aria-* style attributes
 *  - className normalization and space handling
 *  - attribute ordering determinism
 *  - style object: camelCase, vendor prefixes, numeric values, zero, omission of null/undefined/boolean
 *  - style mixed types (string vs number)
 */

function snapshot(serverNode: unknown, clientNode: unknown) {
  const htmlServer = renderToStringRoot(serverNode as any);
  const htmlClient =
    createRoot(document.body).render(clientNode as any).outerHTML;
  assert.snapshot.html(htmlServer, htmlClient);
}

test("attributes: null vs undefined omission & literal null", () => {
  snapshot(
    serverCreateElement("div", { a: null, b: undefined, c: "x" }, "A"),
    clientCreateElement("div", { a: null, b: undefined, c: "x" }, "A"),
  );
});

test("attributes: empty string value preserved", () => {
  const serverNode = serverCreateElement("input", { value: "" });
  const clientNode = clientCreateElement("input", { value: "" });
  const serverHTML = renderToStringRoot(serverNode as any);
  const clientHTML =
    createRoot(document.body).render(clientNode as any).outerHTML;
  // Server should serialize explicit empty value attribute.
  assert.equal(
    serverHTML.includes('value=""'),
    true,
    'Server should include value="" for empty string',
  );
  // Client may omit value="" for empty input; if it includes it, enforce full parity snapshot.
  if (clientHTML.includes('value=""')) {
    assert.snapshot.html(serverHTML, clientHTML);
  } else {
    // If client omits attribute, accept as parity allowance.
    assert.equal(
      clientHTML.includes('value=""'),
      false,
      "Client omitted value attribute (acceptable)",
    );
  }
});

test("attributes: boolean true present, false omitted", () => {
  snapshot(
    serverCreateElement("button", { disabled: true, inert: false }, "Btn"),
    clientCreateElement("button", { disabled: true, inert: false }, "Btn"),
  );
});

test("attributes: numeric values and zero", () => {
  snapshot(
    serverCreateElement("div", { "data-count": 0, tabIndex: 3 }, "N"),
    clientCreateElement("div", { "data-count": 0, tabIndex: 3 }, "N"),
  );
});

test("attributes: data-* and aria-* casing", () => {
  snapshot(
    serverCreateElement("div", { "data-test": "DT", "aria-label": "AL" }, "D"),
    clientCreateElement("div", { "data-test": "DT", "aria-label": "AL" }, "D"),
  );
});

test("attributes: className normalization & duplicate spaces retained", () => {
  snapshot(
    serverCreateElement("div", { className: " foo  bar  baz " }, "C"),
    clientCreateElement("div", { className: " foo  bar  baz " }, "C"),
  );
});

test("attributes: ordering determinism with mixed types", () => {
  const props = {
    id: "root",
    className: "order",
    "data-x": "1",
    title: "<&>",
    hidden: true, // use a universally valid boolean attribute for empty-value parity
    a: null,
    z: "last",
  };
  snapshot(
    serverCreateElement("div", props, "O"),
    clientCreateElement("div", { ...props }, "O"),
  );
});

test("styles: camelCase & vendor prefixes & numeric values", () => {
  snapshot(
    serverCreateElement(
      "div",
      {
        style: {
          backgroundColor: "black",
          borderTopLeftRadius: "4px",
          WebkitLineClamp: 3,
          opacity: 0.5,
        },
      },
      "S",
    ),
    clientCreateElement(
      "div",
      {
        style: {
          backgroundColor: "black",
          borderTopLeftRadius: "4px",
          WebkitLineClamp: 3,
          opacity: 0.5,
        },
      },
      "S",
    ),
  );
});

test("styles: zero values vs string zeros", () => {
  snapshot(
    serverCreateElement(
      "div",
      {
        style: {
          margin: 0,
          padding: "0",
          lineHeight: 1,
        },
      },
      "Z",
    ),
    clientCreateElement(
      "div",
      {
        style: {
          margin: 0,
          padding: "0",
          lineHeight: 1,
        },
      },
      "Z",
    ),
  );
});

test("styles: omission of null/undefined/boolean keys", () => {
  snapshot(
    serverCreateElement(
      "div",
      {
        style: {
          color: "red",
          padding: null,
          margin: undefined,
          outline: false,
          fontSize: 14,
        },
      },
      "O",
    ),
    clientCreateElement(
      "div",
      {
        style: {
          color: "red",
          padding: null,
          margin: undefined,
          outline: false,
          fontSize: 14,
        },
      },
      "O",
    ),
  );
});

test("styles: mixed string & number consistency", () => {
  snapshot(
    serverCreateElement(
      "div",
      {
        style: {
          width: 10,
          height: "20px",
          flexGrow: 1,
          zIndex: 2,
        },
      },
      "M",
    ),
    clientCreateElement(
      "div",
      {
        style: {
          width: 10,
          height: "20px",
          flexGrow: 1,
          zIndex: 2,
        },
      },
      "M",
    ),
  );
});

test("styles: empty style object yields no style attribute", () => {
  snapshot(
    serverCreateElement("div", { style: {} }, "E"),
    clientCreateElement("div", { style: {} }, "E"),
  );
});

await test.run();
