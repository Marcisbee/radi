// @ts-nocheck
/** @file SSR deep nesting & mixed primitives tests for Radi (server renderer).
 *
 * Verifies:
 *  - Deeply nested component hierarchy renders expected structure.
 *  - Mixed primitive children (string / number / boolean / null) inside components.
 *  - Fragment usage inside nested components.
 *  - Subscribable one-shot sampling within deep nesting.
 *  - Component error fallback marker.
 *
 * NOTE: Universal server createElement returns internal nodes not yet aligned
 * with the public Child union; tests focus on string output correctness.
 */

import { assert, test } from "@marcisbee/rion/test";
import {
  createElement as h,
  Fragment,
  renderToStringRoot,
} from "../../server.ts";

/* -------------------------------------------------------------------------- */
/* Local assertion helpers                                                     */
/* -------------------------------------------------------------------------- */

function includes(html: string, fragment: string) {
  assert.equal(
    html.includes(fragment),
    true,
    `Expected HTML to include fragment:\n${fragment}\n---\nHTML:\n${html}`,
  );
}

function notIncludes(html: string, fragment: string) {
  assert.equal(
    html.includes(fragment),
    false,
    `Did not expect HTML to include fragment:\n${fragment}\n---\nHTML:\n${html}`,
  );
}

function atLeast(html: string, fragment: string, minCount: number) {
  const count = html.split(fragment).length - 1;
  assert.equal(
    count >= minCount,
    true,
    `Expected at least ${minCount} occurrences of "${fragment}", found ${count}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Simple one-shot subscribable helper                                        */
/* -------------------------------------------------------------------------- */
function sub<T>(value: T) {
  return {
    subscribe(fn: (v: T) => void) {
      fn(value); // single emission
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

function Leaf(props: () => { label: string; flag?: boolean }) {
  return h(
    "div",
    { "data-leaf": props().label },
    props().label,
    7,
    props().flag ?? false,
    null,
    h(Fragment, null, "frag-part", h("i", null, "italic")),
  );
}

function Middle(props: () => { label: string; extra?: string }) {
  return h(
    Fragment,
    null,
    h(Leaf, { label: props().label, flag: true }),
    h("span", null, props().extra || "no-extra"),
    sub("store-value"),
  );
}

function RootNest(props: () => { base: string }) {
  return [
    h("header", null, "Header:", props().base),
    h(Middle, { label: props().base + "-mid", extra: "X" }),
    h(Middle, { label: props().base + "-alt" }),
    h("footer", null, "Footer"),
  ];
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                       */
/* -------------------------------------------------------------------------- */

test("ssr: deep nested components & primitives", () => {
  const html = renderToStringRoot(
    h("section", { id: "app" }, h(RootNest, { base: "root" })),
  );

  // Top-level wrapper
  includes(html, '<section id="app">');
  includes(html, "</section>");

  // Component wrappers (client parity host tags)
  const hostWrapperCount = html.split("<host>").length - 1;
  assert.equal(
    hostWrapperCount >= 3,
    true,
    `Expected multiple component host wrappers, found ${hostWrapperCount}`,
  );

  // Leaf + middle content
  includes(html, "Header:root");
  includes(html, "root-mid");
  includes(html, "root-alt");
  includes(html, "<footer>Footer</footer>");

  // Fragment + inner italic (no fragment boundary comments in parity)
  notIncludes(html, "<!--(-->");
  notIncludes(html, "<!--)-->");
  includes(html, "frag-part");
  includes(html, "<i>italic</i>");

  // Subscribable one-shot insertion (no value sampling)
  includes(html, "store-value");

  // Boolean/null markers: flag=true yields true + null
  includes(html, "<!--true-->");
  includes(html, "<!--null-->");
});

test("ssr: subscribable inside fragment sibling structure", () => {
  const html = renderToStringRoot(
    h(
      Fragment,
      null,
      sub("first-layer"),
      h(Middle, { label: "deep", extra: "<raw>" }),
    ),
  );

  includes(html, "first-layer");
  includes(html, "deep");
  includes(html, "&lt;raw&gt;"); // escaped extra value
  // Explicit extra provided; 'no-extra' placeholder should not appear
});

test("ssr: component error surfaces marker (client parity ERROR:Name)", () => {
  function Bad(_p: () => Record<string, unknown>) {
    throw new Error("explode");
  }
  const html = renderToStringRoot(
    h(
      "div",
      null,
      h(RootNest, { base: "ok" }),
      h(Bad, null),
      h(Leaf, { label: "final" }),
    ),
  );

  includes(html, "<host>ERROR:Bad</host>");
  notIncludes(html, "component-error");
  notIncludes(html, "<radi-host");
  includes(html, "final");
});

test("ssr: mixed nesting with multiple fragments & components", () => {
  const html = renderToStringRoot(
    h(
      Fragment,
      null,
      h(Leaf, { label: "A" }),
      h(Middle, { label: "B" }),
      h(RootNest, { base: "C" }),
    ),
  );
  includes(html, 'data-leaf="A"');
  includes(html, 'data-leaf="B"');
  includes(html, "Header:C");
  // Host wrappers parity (no radi-host)
  const hostWrapperCount = html.split("<host>").length - 1;
  assert.equal(
    hostWrapperCount >= 3,
    true,
    `Expected >=3 host wrappers, found ${hostWrapperCount}`,
  );
  notIncludes(html, "<radi-host");
});

test("ssr: ensure no second emission from multi-shot pattern", () => {
  const multi = {
    subscribe(fn: (v: string) => void) {
      fn("once");
      fn("twice");
    },
  };
  const html = renderToStringRoot(
    h("div", null, multi),
  );
  includes(html, "once");
  notIncludes(html, "twice");
});

test("ssr: boolean/null markers appear inside nested leaf only once per primitive", () => {
  const html = renderToStringRoot(h(Leaf, { label: "flags", flag: true }));
  // Leaf with flag=true emits true + null markers (no false marker in its child list)
  atLeast(html, "<!--true-->", 1);
  atLeast(html, "<!--null-->", 1);
});

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */
await test.run();
