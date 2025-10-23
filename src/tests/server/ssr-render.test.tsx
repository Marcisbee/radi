// @ts-nocheck
import { assert, test } from "@marcisbee/rion";
import {
  createElement as h,
  Fragment,
  renderToStringRoot,
} from "../../server.ts";
import type { Child } from "../../types.ts";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function oneShot<T>(value: T) {
  return {
    subscribe(fn: (v: T) => void) {
      fn(value); // single emission only
    },
  };
}

function multiShot<T>(first: T, second: T) {
  return {
    subscribe(fn: (v: T) => void) {
      fn(first);
      fn(second); // second emission should be ignored by server one-shot logic
    },
  };
}

function includes(html: string, fragment: string) {
  assert.equal(
    html.includes(fragment),
    true,
    `Expected HTML to include: ${fragment}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

function Echo(props: () => { value: string }) {
  return h("span", null, props().value);
}

function Wrapper(props: () => { label: string }) {
  return h(
    "div",
    { class: "wrap" },
    h(Echo, { value: props().label }),
    h("strong", null, props().label.toUpperCase()),
  );
}

function Leaf(props: () => { text: string; flag?: boolean }) {
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

function Nest(props: () => { base: string }): Child {
  return [
    h("header", null, "Header:", props().base),
    h(Wrapper, { label: props().base + "-wrap" }),
    h(Leaf, { text: props().base + "-leaf", flag: true }),
    h("footer", null, "Footer"),
  ];
}

function ErrorComponent(_props: () => Record<string, unknown>): Child {
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
  // Component wrappers
  const count = html.split("<radi-component>").length - 1;
  assert.equal(count >= 3, true, "Expected multiple component wrappers");
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
  includes(html, "<radi-fragment>");
  includes(html, "<em>a</em>");
  includes(html, "b");
  includes(html, "<strong>c</strong>");
  includes(html, "</radi-fragment>");
});

test("ssr: attribute escaping", () => {
  const html = renderToStringRoot(
    h("div", { title: '<>&"' }, "x"),
  );
  includes(html, 'title="&lt;&gt;&amp;&quot;"');
  includes(html, ">x</div>");
});

test("ssr: subscribable one-shot sampling", () => {
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
  includes(html, "<radi-component>");
  includes(html, "component-error");
});

test("ssr: boolean and null markers inside component", () => {
  const html = renderToStringRoot(
    h(Leaf, { text: "sample", flag: true }),
  );
  includes(html, 'data-leaf="sample"');
  includes(html, "<!--true-->"); // flag
  includes(html, "<!--null-->"); // explicit null child
  // Leaf does not emit a false marker when flag=true
});

test("ssr: mixed types & component chain", () => {
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
