// @ts-nocheck
/**
 * SSR prop/event handling & error boundary behavior tests for Radi server renderer.
 *
 * Verifies:
 *  - style object + className normalization
 *  - omission of function-valued props (events and plain functions)
 *  - null / numeric / boolean attribute serialization rules
 *  - attribute escaping
 *  - component error fallback marker ("component-error")
 *  - mixed success + error component chain
 *  - multiple error components do not break overall serialization
 */

import { assert, test } from "@marcisbee/rion";
import {
  createElement as h,
  Fragment,
  renderToStringRoot,
} from "../../server.ts";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
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
    `Did NOT expect HTML to include fragment:\n${fragment}\n---\nHTML:\n${html}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

function Good(props: () => { label: string }) {
  return h(
    "div",
    { className: "good", "data-label": props().label },
    "Good:",
    props().label,
  );
}

function Throws(_props: () => Record<string, unknown>) {
  throw new Error("explode");
}

function ThrowsLate(props: () => { text: string }) {
  // Deliberately throw after some work
  if (props().text.length > 0) {
    throw new Error("late");
  }
  return h("span", null, "will-not-render");
}

function Mixed(props: () => { a: string; b: string }) {
  return [
    h(Good, { label: props().a }),
    h(Throws, null),
    h(Good, { label: props().b }),
    h(ThrowsLate, { text: props().a + props().b }),
  ];
}

/* -------------------------------------------------------------------------- */
/* Tests: Props & Events                                                      */
/* -------------------------------------------------------------------------- */

test("ssr: style object & className normalization + primitive props", () => {
  const html = renderToStringRoot(
    h(
      "div",
      {
        className: "foo bar",
        style: { backgroundColor: "black", fontSize: "12px" },
        dataNull: null,
        dataNum: 7,
        dataBoolTrue: true,
        title: '<>&"',
      },
      "content",
    ),
  );

  includes(html, '<div class="foo bar"');
  includes(html, 'style="background-color: black; font-size: 12px;"');
  includes(html, 'dataNull="null"');
  includes(html, 'dataNum="7"');
  includes(html, 'dataBoolTrue="true"');
  includes(html, 'title="&lt;&gt;&amp;&quot;"');
  includes(html, ">content</div>");
});

test("ssr: event handler props are omitted (onClick/onInput)", () => {
  const html = renderToStringRoot(
    h(
      "button",
      {
        onClick: () => console.log("clicked"),
        onInput: () => {},
        className: "btn",
      },
      "Push",
    ),
  );

  includes(html, '<button class="btn">Push</button>');
  notIncludes(html, "onClick");
  notIncludes(html, "onInput");
});

test("ssr: plain function-valued non-event prop omitted", () => {
  const html = renderToStringRoot(
    h("div", { compute: () => 42, id: "fn-test" }, "X"),
  );
  includes(html, '<div id="fn-test">X</div>');
  notIncludes(html, "compute=");
});

test("ssr: boolean primitive child serialized as comment, null child comment", () => {
  const html = renderToStringRoot(
    h("div", null, true, null, false),
  );
  includes(html, "<!--true-->");
  includes(html, "<!--null-->");
  includes(html, "<!--false-->");
});

/* -------------------------------------------------------------------------- */
/* Tests: Error Boundary / Component Errors                                   */
/* -------------------------------------------------------------------------- */

test("ssr: single error component produces fallback marker", () => {
  const html = renderToStringRoot(
    h("section", null, h(Throws, null)),
  );
  includes(html, "<section>");
  includes(html, '<radi-host style="display: contents;">');
  includes(html, "component-error");
  includes(html, "</section>");
});

test("ssr: mixed good + error components retain good output", () => {
  const html = renderToStringRoot(
    h("main", null, h(Mixed, { a: "A", b: "B" })),
  );
  includes(html, "<main>");
  // Good components
  includes(html, "Good:A");
  includes(html, "Good:B");
  // Error components markers
  const errCount = html.split("component-error").length - 1;
  assert.equal(
    errCount >= 2,
    true,
    "Expected at least two component-error markers",
  );
  // Wrapper nodes present
  const hostCount =
    html.split('<radi-host style="display: contents;">').length - 1;
  assert.equal(hostCount >= 4, true, "Expected multiple radi-host wrappers");
  includes(html, "</main>");
});

test("ssr: nested error inside fragment does not break siblings", () => {
  const html = renderToStringRoot(
    h(
      Fragment,
      null,
      h(Good, { label: "inside-frag" }),
      h(Throws, null),
      h("span", null, "tail"),
    ),
  );
  // Fragment serialization (outer + inner markers)
  includes(html, "<!--(-->");
  includes(html, "<!--)-->"); // at least one end boundary
  includes(html, "inside-frag");
  includes(html, "component-error");
  includes(html, "<span>tail</span>");
});

test("ssr: multiple throwing components sequentially", () => {
  const html = renderToStringRoot(
    h(
      "div",
      null,
      h(Throws, null),
      h(ThrowsLate, { text: "X" }),
      h(Throws, null),
    ),
  );
  const count = html.split("component-error").length - 1;
  assert.equal(
    count === 3,
    true,
    `Expected exactly 3 component-error markers, got ${count}`,
  );
  includes(html, "<div>");
  includes(html, "</div>");
});

/* -------------------------------------------------------------------------- */
/* Run                                                                        */
/* -------------------------------------------------------------------------- */

await test.run();
