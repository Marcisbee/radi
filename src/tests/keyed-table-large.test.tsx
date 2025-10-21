import { assert, test } from "jsr:@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { createElement, update } from "../main.ts";

/**
 * Row type for table entries.
 */
interface Row {
  id: number;
  label: string;
  selected: boolean;
}

/**
 * Data sources for random label construction.
 */
const adjectives = [
  "pretty",
  "large",
  "big",
  "small",
  "tall",
  "short",
  "long",
  "handsome",
  "plain",
  "quaint",
  "clean",
  "elegant",
  "easy",
  "angry",
  "crazy",
  "helpful",
  "mushy",
  "odd",
  "unsightly",
  "adorable",
  "important",
  "inexpensive",
  "cheap",
  "expensive",
  "fancy",
];
const colours = [
  "red",
  "yellow",
  "blue",
  "green",
  "pink",
  "brown",
  "purple",
  "brown",
  "white",
  "black",
  "orange",
];
const nouns = [
  "table",
  "chair",
  "house",
  "bbq",
  "desk",
  "car",
  "pony",
  "cookie",
  "sandwich",
  "burger",
  "pizza",
  "mouse",
  "keyboard",
];

function rand(max: number): number {
  return Math.round(Math.random() * 1000) % max;
}

/**
 * Build count rows, incrementing a global id.
 */
let nextId = 1;
function buildData(count: number): Row[] {
  const out: Row[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: nextId++,
      label: `${adjectives[rand(adjectives.length)]} ${
        colours[rand(colours.length)]
      } ${nouns[rand(nouns.length)]}`,
      selected: false,
    });
  }
  return out;
}

/**
 * Large keyed table demo component replicating playground scenario.
 * - Generates 1000 rows
 * - Appends 1000 rows
 * - Regenerates (fresh 1000 with new ids)
 */
function KeyedLargeTableRoot(this: HTMLElement) {
  let rows: Row[] = [];

  const generate = () => {
    rows = buildData(1000);
    update(this);
  };

  const append = () => {
    rows = rows.concat(buildData(1000));
    update(this);
  };

  return () => (
    <div className="keyed-large-table-root">
      <div className="toolbar">
        <button
          type="button"
          className="btn-generate"
          onclick={() => {
            generate();
          }}
        >
          generate-1000
        </button>
        <button
          type="button"
          className="btn-append"
          onclick={() => {
            append();
          }}
        >
          append-1000
        </button>
        <button
          type="button"
          className="btn-regenerate"
          onclick={() => {
            generate();
          }}
        >
          regenerate-1000
        </button>
      </div>
      <table className="data-table">
        <tbody>
          {rows.map((r) => (
            <tr
              key={String(r.id)}
              id={String(r.id)}
              className={r.selected ? "danger" : ""}
            >
              <td className="col-id">{r.id}</td>
              <td className="col-label">{r.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <span className="row-count">{rows.length}</span>
      <span className="next-id">{nextId}</span>
    </div>
  );
}

/**
 * Assert a single row element has expected id and non-empty label.
 */
function assertRow(el: HTMLTableRowElement, expectedId: number) {
  assert.is(parseInt(el.id, 10), expectedId);
  const labelCell = el.querySelector(".col-label") as HTMLElement;
  assert.ok(
    labelCell && labelCell.textContent && labelCell.textContent.length > 0,
  );
}

/**
 * Regression test + diagnostics: keyed large table should render full 1000 rows.
 * Adds console diagnostics for child counts and sample node details.
 */
test("large-keyed-table-renders-all-and-appends", async () => {
  const root = await mount(<KeyedLargeTableRoot />, document.body);

  const generateBtn = root.querySelector(".btn-generate") as HTMLButtonElement;
  const appendBtn = root.querySelector(".btn-append") as HTMLButtonElement;
  const regenerateBtn = root.querySelector(
    ".btn-regenerate",
  ) as HTMLButtonElement;
  const tbody = root.querySelector("tbody")!;

  // Initial: no rows
  assert.is(tbody.children.length, 0);

  // Generate 1000
  generateBtn.click();
  await Promise.resolve();
  assert.is(
    tbody.children.length,
    1000,
    "Expected 1000 rows after first generate",
  );
  const firstRow = tbody.children[0] as HTMLTableRowElement;
  const lastRow = tbody
    .children[tbody.children.length - 1] as HTMLTableRowElement;
  assertRow(firstRow, 1);
  assertRow(lastRow, 1000);

  // Append 1000 to reach 2000
  appendBtn.click();
  await Promise.resolve();
  assert.is(tbody.children.length, 2000, "Expected 2000 rows after append");
  const appendedLast = tbody
    .children[tbody.children.length - 1] as HTMLTableRowElement;
  assertRow(appendedLast, 2000);

  // Regenerate (fresh 1000 new ids)
  regenerateBtn.click();
  await Promise.resolve();
  assert.is(
    tbody.children.length,
    1000,
    "Expected 1000 rows after regeneration",
  );
  const regenFirst = tbody.children[0] as HTMLTableRowElement;
  const regenLast = tbody
    .children[tbody.children.length - 1] as HTMLTableRowElement;
  assertRow(regenFirst, 2001);
  assertRow(regenLast, 3000);
});

await test.run();
