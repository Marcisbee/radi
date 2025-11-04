import { assert, test } from "@marcisbee/rion/test";
import { createElement as h, createRoot } from "../../../client.ts";

/**
 * Empirical DOM parity probe.
 *
 * Captures actual client-side outerHTML and attribute/style state for edge cases.
 * Output is logged as JSON lines (one per probe). Assertions are minimal to avoid
 * premature failures before server parity adjustments are finalized.
 *
 * To view raw results, run only this test file:
 *   deno task test src/tests/server/parity/ssr-parity-probe.test.tsx
 *
 * Each test logs:
 * {
 *   id,
 *   outerHTML,
 *   attributes: { name: value },
 *   props: { disabled, tabIndex, className, id, value },
 *   style: { cssText, props: { k: v } }
 * }
 */

interface ProbeResult {
  id: string;
  outerHTML: string;
  attributes: Record<string, string>;
  props: Record<string, unknown>;
  style: {
    cssText: string;
    props: Record<string, string>;
  };
}

function collectAttributes(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    out[attr.name] = attr.value;
  }
  return out;
}

function collectStyle(
  el: HTMLElement,
): { cssText: string; props: Record<string, string> } {
  const out: Record<string, string> = {};
  const cssText = el.style.cssText;
  if (cssText) {
    for (const seg of cssText.split(";")) {
      const trimmed = seg.trim();
      if (!trimmed) continue;
      const [k, v] = trimmed.split(":");
      if (k && v != null) {
        out[k.trim()] = v.trim();
      }
    }
  }
  return { cssText, props: out };
}

function mount(node: any): HTMLElement {
  const container = document.createElement("div");
  const root = createRoot(container);
  const rendered = root.render(node);
  return rendered instanceof HTMLElement
    ? rendered
    : container.firstElementChild as HTMLElement;
}

function probe(id: string, nodeFactory: () => any): ProbeResult {
  const el = mount(nodeFactory());
  const attributes = el ? collectAttributes(el) : {};
  const styleInfo = el instanceof HTMLElement
    ? collectStyle(el)
    : { cssText: "", props: {} };
  const props: Record<string, unknown> = {};
  if (el instanceof HTMLElement) {
    props.disabled = (el as HTMLButtonElement).disabled;
    props.tabIndex = el.tabIndex;
    props.className = el.className;
    props.id = el.id;
    if ("value" in el) {
      props.value = (el as HTMLInputElement).value;
    }
  }
  return {
    id,
    outerHTML: el?.outerHTML || "",
    attributes,
    props,
    style: styleInfo,
  };
}

function logResult(r: ProbeResult): void {
  // JSON line
  // console.log(JSON.stringify(r));
}

/* -------------------------------------------------------------------------- */
/* Probe Cases                                                                 */
/* -------------------------------------------------------------------------- */

const cases: Array<[string, () => any]> = [
  [
    "attributes-null-undefined",
    () => h("div", { a: null, b: undefined, c: "x" }, "A"),
  ],
  ["input-empty-string", () => h("input", { value: "" }, null)],
  [
    "boolean-attributes",
    () => h("button", { disabled: true, inert: false }, "Btn"),
  ],
  [
    "numeric-and-tabindex",
    () => h("div", { "data-count": 0, tabIndex: 3 }, "N"),
  ],
  ["mixed-ordering", () =>
    h("div", {
      id: "root",
      className: "order",
      "data-x": "1",
      title: "<&>",
      disabled: true,
      a: null,
      z: "last",
    }, "O")],
  ["styles-camel-vendor-numeric", () =>
    h("div", {
      style: {
        backgroundColor: "black",
        borderTopLeftRadius: "4px",
        WebkitLineClamp: 3,
        opacity: 0.5,
      },
    }, "S")],
  ["styles-zero-values", () =>
    h("div", {
      style: {
        margin: 0,
        padding: "0",
        lineHeight: 1,
      },
    }, "Z")],
  ["styles-omit-invalid", () =>
    h("div", {
      style: {
        color: "red",
        padding: null,
        margin: undefined,
        outline: false,
        fontSize: 14,
      },
    }, "O")],
  ["styles-mixed-lengths", () =>
    h("div", {
      style: {
        width: 10,
        height: "20px",
        flexGrow: 1,
        zIndex: 2,
      },
    }, "M")],
  ["styles-empty-object", () => h("div", { style: {} }, "E")],
  // Direct style mutation (non-Radi style application)
  ["styles-manual-fontSize-number", () => {
    const el = document.createElement("div");
    el.textContent = "FS";
    (el.style as any).fontSize = 14;
    return el;
  }],
  ["styles-manual-fontSize-px", () => {
    const el = document.createElement("div");
    el.textContent = "FSPX";
    el.style.fontSize = "14px";
    return el;
  }],
  [
    "attributes-boolean-false-only",
    () => h("input", { disabled: false }, null),
  ],
  ["attributes-data-array", () => h("div", { "data-arr": [1, 2, 3] }, "ARR")],
  ["attributes-bigint-like", () => h("div", { "data-big": BigInt(10) }, "BIG")],
  ["attributes-symbol-function", () => {
    const sym = Symbol("s");
    return h("div", { sym, fn: () => "ignored", keep: "yes" }, "SF");
  }],
];

/* -------------------------------------------------------------------------- */
/* Tests                                                                       */
/* -------------------------------------------------------------------------- */

for (const [id, factory] of cases) {
  test(`probe: ${id}`, () => {
    const result = probe(id, factory);
    // Minimal assertions: outerHTML should exist; attribute omission rules are empirical.
    assert.equal(
      result.outerHTML.length > 0,
      true,
      `${id} outerHTML should not be empty`,
    );
    logResult(result);
  });
}

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */
await test.run();
