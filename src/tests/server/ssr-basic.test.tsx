// @ts-nocheck
import { assert, test } from "@marcisbee/rion/test";
import {
  createElement as h,
  Fragment,
  renderToStringRoot,
} from "../../server.ts";

/**
 * Basic SSR tests for Radi server renderer using rion test runner.
 *
 * Covered:
 *  - Primitive rendering (string, number, boolean, null)
 *  - Nested component rendering
 *  - Fragment handling
 *  - Subscribable (one-shot) expansion
 *  - Attribute escaping
 *  - Component error fallback marker
 */

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function oneShot(value) {
  return {
    subscribe(fn) {
      fn(value); // single emission only
    },
  };
}

function multiShot(first, second) {
  return {
    subscribe(fn) {
      fn(first);
      fn(second); // second emission should be ignored by server one-shot logic
    },
  };
}

function includes(html, fragment) {
  assert.equal(
    html.includes(fragment),
    true,
    `Expected HTML to include: ${fragment}`,
  );
}

function notIncludes(html, fragment) {
  assert.equal(
    html.includes(fragment),
    false,
    `Did not expect HTML to include: ${fragment}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

function Label(props) {
  return h("span", null, "Label:", props().text);
}

function Wrapper(props) {
  return h(
    "div",
    { class: "wrap" },
    h(Label, { text: props().label }),
    h("strong", null, props().label.toUpperCase()),
  );
}

function Leaf(props) {
  return h(
    "div",
    { "data-leaf": props().text },
    props().text,
    7,
    props().flag ?? false,
    null,
    h(Fragment, null, "frag-part", h("i", null, "italic")),
  );
}

function Nest(props) {
  return [
    h("header", null, "Header:", props().base),
    h(Wrapper, { label: props().base + "-wrap" }),
    h(Leaf, { text: props().base + "-leaf", flag: true }),
    h("footer", null, "Footer"),
  ];
}

function ErrorComponent() {
  throw new Error("boom");
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

test("ssr: primitives & basic structure", () => {
  const html = renderToStringRoot(
    h(
      "div",
      { id: "root" },
      "hello",
      42,
      true,
      null,
      false,
    ),
  );
  includes(html, '<div id="root">');
  includes(html, "hello");
  includes(html, "42");
  includes(html, "<!--true-->");
  includes(html, "<!--null-->");
  includes(html, "<!--false-->");
  includes(html, "</div>");
});

test("ssr: nested components & fragment", () => {
  const html = renderToStringRoot(
    h("section", { id: "app" }, h(Nest, { base: "base" })),
  );
  includes(html, '<section id="app">');
  includes(html, "Header:base");
  includes(html, "base-wrap");
  includes(html, "base-leaf");
  includes(html, "frag-part");
  includes(html, "<i>italic</i>");
  includes(html, "<footer>Footer</footer>");
  const count = html.split("<host>").length - 1;
  assert.equal(count >= 3, true, "Expected multiple component wrappers (host)");
});

test("ssr: fragment top-level wrapper", () => {
  const html = renderToStringRoot(
    h(
      Fragment,
      null,
      h("em", null, "a"),
      "b",
      h("strong", null, "c"),
    ),
  );
  notIncludes(html, "<!--(-->");
  notIncludes(html, "<!--)-->");
  includes(html, "<em>a</em>");
  includes(html, "b");
  includes(html, "<strong>c</strong>");
});

test("ssr: attribute escaping", () => {
  const html = renderToStringRoot(
    h("div", { title: '<>&"' }, "x"),
  );
  includes(html, 'title="&lt;&gt;&amp;&quot;"');
  includes(html, ">x</div>");
});

test("ssr: subscribable one-shot sampling (renders first emission only)", () => {
  const html = renderToStringRoot(
    h("section", null, multiShot("first", "second")),
  );
  includes(html, "<section>");
  includes(html, "first");
  assert.equal(
    html.includes("second"),
    false,
    "Second emission should not render",
  );
});

test("ssr: component error fallback marker", () => {
  const html = renderToStringRoot(
    h("div", null, h(ErrorComponent, null)),
  );
  includes(html, "<host>ERROR:ErrorComponent</host>");
  notIncludes(html, "<radi-host");
});

test("ssr: boolean and null markers inside component", () => {
  const html = renderToStringRoot(
    h(Leaf, { text: "sample", flag: true }),
  );
  includes(html, 'data-leaf="sample"');
  includes(html, "<!--true-->"); // flag
  includes(html, "<!--null-->"); // explicit null child
  // Leaf with flag=true does not emit a false marker
});

test("ssr: mixed types & component chain", () => {
  // Wrapper now reads its label from props().label (not props().text)
  const html = renderToStringRoot(
    h(
      "main",
      null,
      h(Wrapper, { label: "mix" }),
      oneShot("sub-value"),
      h(Leaf, { text: "tail" }),
    ),
  );
  includes(html, "<main>");
  includes(html, "mix");
  includes(html, "sub-value");
  includes(html, "tail");
  includes(html, "</main>");
});

/* -------------------------------------------------------------------------- */
/* Run                                                                        */
/* -------------------------------------------------------------------------- */

await test.run();
