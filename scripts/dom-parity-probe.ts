/**
/**
 * Empirical DOM parity probe script.
 *
 * Run this script in the same environment where client-side Radi rendering occurs
 * (Deno + DOM / test runner) to capture actual outerHTML results for a set of
 * attribute and style edge cases. Use the output to align server-side string
 * serialization and snapshot tests with real client DOM behavior.
 *
 * Usage (example):
 *   deno run -A radi/scripts/dom-parity-probe.tsx
 *
 * Output:
 *   - JSON lines per probe case with:
 *       id: identifier
 *       outerHTML: element.outerHTML after render
 *       attributes: map of attribute names -> values (Attribute node values)
 *       props: selected property reads (e.g. el.disabled, el.tabIndex)
 *       style.cssText: full inline style
 *       style.props: individual extracted style property values
 *
 * Notes:
 *   - Radi's client createElement applies style object values by stringifying numbers.
 *   - Boolean attributes in outerHTML typically appear as empty attribute (disabled="").
 *   - Undefined attribute values are omitted entirely.
 *   - Numeric length values without units may be ignored or converted by the browser/CSSOM.
 */

import { createElement as h, createRoot } from "../src/client.ts";

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

function collectStyle(el: HTMLElement): {
  cssText: string;
  props: Record<string, string>;
} {
  const out: Record<string, string> = {};
  const styleDecl = el.style;
  // Collect a representative subset (all declared in cssText)
  if (styleDecl.cssText) {
    // Parse cssText roughly (split on ';')
    for (const seg of styleDecl.cssText.split(";")) {
      const part = seg.trim();
      if (!part) continue;
      const [k, v] = part.split(":");
      if (k && v != null) {
        out[k.trim()] = v.trim();
      }
    }
  }
  return { cssText: styleDecl.cssText, props: out };
}

function recordCase(
  id: string,
  nodeFactory: () => Node | HTMLElement,
): ProbeResult {
  const container = document.createElement("div");
  // Use Radi root to ensure consistent mounting semantics
  const root = createRoot(container);
  const element = root.render(nodeFactory() as any);
  const target = element instanceof HTMLElement ? element : container;
  const el = target instanceof HTMLElement
    ? target
    : container.firstElementChild ?? target;
  const attributes = el ? collectAttributes(el) : {};
  const style = el instanceof HTMLElement
    ? collectStyle(el)
    : { cssText: "", props: {} };
  const props: Record<string, unknown> = {};
  if (el instanceof HTMLElement) {
    // Representative property reads
    props.disabled = (el as HTMLButtonElement).disabled;
    props.tabIndex = el.tabIndex;
    props.className = el.className;
    props.id = el.id;
    props.value = (el as HTMLInputElement).value;
  }
  return {
    id,
    outerHTML: el?.outerHTML ?? "",
    attributes,
    props,
    style,
  };
}

/* -------------------------------------------------------------------------- */
/* Probe Definitions                                                           */
/* -------------------------------------------------------------------------- */

const probes: Array<() => ProbeResult> = [];

// 1. null vs undefined
probes.push(() =>
  recordCase(
    "attributes-null-undefined",
    () => h("div", { a: null, b: undefined, c: "x" }, "A"),
  )
);

// 2. empty string input value
probes.push(() =>
  recordCase("input-empty-string", () => h("input", { value: "" }, null))
);

// 3. boolean attributes true/false
probes.push(() =>
  recordCase(
    "boolean-attributes",
    () => h("button", { disabled: true, inert: false }, "Btn"),
  )
);

// 4. numeric attributes & tabIndex
probes.push(() =>
  recordCase(
    "numeric-and-tabindex",
    () => h("div", { "data-count": 0, tabIndex: 3 }, "N"),
  )
);

// 5. mixed attribute ordering (with special chars & boolean)
probes.push(() =>
  recordCase("mixed-ordering", () =>
    h("div", {
      id: "root",
      className: "order",
      "data-x": "1",
      title: "<&>",
      disabled: true,
      a: null,
      z: "last",
    }, "O"))
);

// 6. style: camelCase, vendor prefixes, numeric
probes.push(() =>
  recordCase("styles-camel-vendor-numeric", () =>
    h("div", {
      style: {
        backgroundColor: "black",
        borderTopLeftRadius: "4px",
        WebkitLineClamp: 3,
        opacity: 0.5,
      },
    }, "S"))
);

// 7. style: zeros and numeric lineHeight
probes.push(() =>
  recordCase("styles-zero-values", () =>
    h("div", {
      style: {
        margin: 0,
        padding: "0",
        lineHeight: 1,
      },
    }, "Z"))
);

// 8. style: omit null/undefined/boolean keys
probes.push(() =>
  recordCase("styles-omit-invalid", () =>
    h("div", {
      style: {
        color: "red",
        padding: null,
        margin: undefined,
        outline: false,
        fontSize: 14,
      },
    }, "O"))
);

// 9. style: mixed string & number widths/heights
probes.push(() =>
  recordCase("styles-mixed-lengths", () =>
    h("div", {
      style: {
        width: 10,
        height: "20px",
        flexGrow: 1,
        zIndex: 2,
      },
    }, "M"))
);

// 10. style: empty object
probes.push(() =>
  recordCase("styles-empty-object", () => h("div", { style: {} }, "E"))
);

// 11. style: direct property assignment after element creation (fontSize number)
probes.push(() =>
  recordCase("styles-manual-fontSize-number", () => {
    const el = document.createElement("div");
    el.textContent = "FS";
    // Direct numeric assignment
    (el.style as any).fontSize = 14;
    return el;
  })
);

// 12. style: direct property valid unit
probes.push(() =>
  recordCase("styles-manual-fontSize-px", () => {
    const el = document.createElement("div");
    el.textContent = "FSPX";
    el.style.fontSize = "14px";
    return el;
  })
);

// 13. attribute: boolean false only (should omit)
probes.push(() =>
  recordCase(
    "attributes-boolean-false-only",
    () => h("input", { disabled: false }, null),
  )
);

// 14. attribute: data-array (array value)
probes.push(() =>
  recordCase(
    "attributes-data-array",
    () => h("div", { "data-arr": [1, 2, 3] }, "ARR"),
  )
);

// 15. attribute: BigInt-ish (stringify)
probes.push(() =>
  recordCase(
    "attributes-bigint-like",
    () => h("div", { "data-big": BigInt(10) }, "BIG"),
  )
);

// 16. attribute: symbol and function (should omit both)
const sym = Symbol("s");
probes.push(() =>
  recordCase(
    "attributes-symbol-function",
    () => h("div", { sym, fn: () => "ignored", keep: "yes" }, "SF"),
  )
);

/* -------------------------------------------------------------------------- */
/* Execute & Output                                                            */
/* -------------------------------------------------------------------------- */

const results: ProbeResult[] = probes.map((fn) => fn());

for (const r of results) {
  console.log(JSON.stringify(r));
}

// Pretty summary table
console.log("\n=== Summary ===");
for (const r of results) {
  console.log(
    `${r.id} :: outerHTML=${r.outerHTML}`,
  );
}
