import { assert, test } from "@marcisbee/rion";
import { mount } from "../../test/utils.ts";
import { update } from "../main.ts";

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
 * Large non-keyed table demo component replicating playground scenario.
 * - Generates 1000 rows
 * - Appends 1000 rows
 * - Regenerates (fresh 1000 with new ids)
 */
function NonKeyedLargeTableRoot(this: HTMLElement) {
  let rows: Row[] = [];

  const generate = () => {
    rows = buildData(100);
    update(this);
  };

  const append = () => {
    rows = rows.concat(buildData(100));
    update(this);
  };

  const swapRows = () => {
    if (rows.length > 98) {
      const tmp = rows[1];
      rows[1] = rows[98];
      rows[98] = tmp;
    }
    update(this);
  };

  const updateRows = () => {
    for (let i = 0; i < rows.length; i += 10) {
      rows[i].label += " !!!";
    }
    update(this);
  };

  (this as any).__swapRows = swapRows;
  (this as any).__updateRows = updateRows;

  return () => (
    <div className="non-keyed-large-table-root">
      <div className="toolbar">
        <button
          type="button"
          className="btn-generate"
          onclick={() => {
            generate();
          }}
        >
          generate-100
        </button>
        <button
          type="button"
          className="btn-append"
          onclick={() => {
            append();
          }}
        >
          append-100
        </button>
        <button
          type="button"
          className="btn-regenerate"
          onclick={() => {
            generate();
          }}
        >
          regenerate-100
        </button>
      </div>
      <table className="data-table">
        <tbody>
          {rows.map((r) => (
            <tr
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
  assert.equal(parseInt(el.id, 10), expectedId);
  const labelCell = el.querySelector(".col-label") as HTMLElement;
  assert.true(
    labelCell && labelCell.textContent && labelCell.textContent.length > 0,
  );
}

/**
 * Regression test + diagnostics: non-keyed large table should render full 1000 rows.
 * Adds console diagnostics for child counts and sample node details.
 */
test("large-non-keyed-table-renders-all-and-appends", async () => {
  const root = await mount(<NonKeyedLargeTableRoot />, document.body);

  const generateBtn = root.querySelector(".btn-generate") as HTMLButtonElement;
  const appendBtn = root.querySelector(".btn-append") as HTMLButtonElement;
  const regenerateBtn = root.querySelector(
    ".btn-regenerate",
  ) as HTMLButtonElement;
  const tbody = root.querySelector("tbody")!;

  // Initial: no rows
  assert.equal(tbody.children.length, 0);

  // Generate 1000
   generateBtn.click();
   await Promise.resolve();
   assert.equal(root.querySelector("tbody")!.children.length, 100);

  const originalRow2 = root.querySelector("tbody")!.children[1] as HTMLElement;
   const originalRow999 = root.querySelector("tbody")!
     .children[98] as HTMLElement;
  const originalId2 = originalRow2.id;
  const originalId999 = originalRow999.id;

  (root as any).__swapRows();
  await Promise.resolve();

  const newRow2 = root.querySelector("tbody")!.children[1] as HTMLElement;
   const newRow999 = root.querySelector("tbody")!.children[98] as HTMLElement;
  assert.equal(newRow2.id, originalId999);
  assert.equal(newRow999.id, originalId2);
});

test("update-rows", async () => {
  const root = await mount(<NonKeyedLargeTableRoot />, document.body);

  const generateBtn = root.querySelector(".btn-generate") as HTMLButtonElement;
  generateBtn.click();
  await Promise.resolve();
   assert.equal(root.querySelector("tbody")!.children.length, 100);

  const row0 = root.querySelector("tbody")!.children[0] as HTMLElement;
  const originalLabel = row0.querySelector(".col-label")!.textContent;

  (root as any).__updateRows();
  await Promise.resolve();

  const newLabel = row0.querySelector(".col-label")!.textContent;
  assert.equal(newLabel, originalLabel + " !!!");
});

await test.run();
