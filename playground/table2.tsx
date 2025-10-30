import { createElement, Fragment, createRoot, update } from "../src/client.ts";

// import { createElement, createRoot, Fragment, memo, update } from "../rework-fw.ts";

// --- Data sources ---
export const adjectives = [
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
export const colours = [
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
export const nouns = [
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

// --- App state (module-local) ---
export type Row = { id: number; label: string; selected: boolean };

export let rows: Row[] = [];
export let nextId = 1;
export let selectedIndex = -1;

export function resetState() {
  rows = [];
  nextId = 1;
  selectedIndex = -1;
}

export function setRows(newRows: Row[]) {
  rows = newRows;
  selectedIndex = -1;
}

// Random helpers mirror the lit-html app behavior
export function rand(max: number): number {
  return Math.round(Math.random() * 1000) % max;
}

export function buildData(count: number): Row[] {
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

export let table: HTMLElement;

// --- Actions (match lit-html app semantics) ---
export function actionRun() {
  rows = buildData(1000);
  selectedIndex = -1;
  update(table);
}

export function actionRunLots() {
  rows = buildData(10000);
  selectedIndex = -1;
  update(table);
}

export function actionAdd() {
  rows = rows.concat(buildData(1000));
  update(table);
}

export function actionClear() {
  rows = [];
  selectedIndex = -1;
  update(table);
}

export function actionSwapRows() {
  // Swap 2nd and 999th rows when length > 998 (same threshold as lit-html app)
  if (rows.length > 998) {
    const tmp = rows[1];
    rows[1] = rows[998];
    rows[998] = tmp;
    // If any of the swapped indices were selected, keep selection consistent
    if (selectedIndex === 1) selectedIndex = 998;
    else if (selectedIndex === 998) selectedIndex = 1;
  }
  update(table);
}

export function actionUpdate() {
  for (let i = 0; i < rows.length; i += 10) {
    rows[i].label += " !!!";
  }
  update(table);
}

export function actionDelete(id: number) {
  const idx = rows.findIndex((r) => r.id === id);
  if (idx !== -1) {
    rows.splice(idx, 1);
    if (selectedIndex === idx) {
      selectedIndex = -1;
    } else if (selectedIndex > idx) {
      selectedIndex -= 1;
    }
  }
  update(table);
}

export function actionSelect(id: number) {
  if (selectedIndex > -1 && rows[selectedIndex]) {
    rows[selectedIndex].selected = false;
  }
  selectedIndex = rows.findIndex((r) => r.id === id);
  if (selectedIndex > -1) {
    rows[selectedIndex].selected = true;
  }
  update(table);
}

// --- Components ---
export function Toolbar(this: DocumentFragment) {
  return (
    <div className="row">
      <div className="col-md-6">
        <h1>Radi2</h1>
      </div>
      <div className="col-md-6">
        <div className="row">
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="run"
              className="btn btn-primary btn-block"
              onclick={() => actionRun()}
            >
              Create 1,000 rows
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="runlots"
              className="btn btn-primary btn-block"
              onclick={() => actionRunLots()}
            >
              Create 10,000 rows
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="add"
              className="btn btn-primary btn-block"
              onclick={() => actionAdd()}
            >
              Append 1,000 rows
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="update"
              className="btn btn-primary btn-block"
              onclick={() => actionUpdate()}
            >
              Update every 10th row
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="clear"
              className="btn btn-primary btn-block"
              onclick={() => actionClear()}
            >
              Clear
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="swaprows"
              className="btn btn-primary btn-block"
              onclick={() => actionSwapRows()}
            >
              Swap Rows
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Row component removed; inline row mapping used in Table for benchmarks

export function Table(this: HTMLElement) {
  // Delegate clicks to identify select/delete just like the lit-html `@click` on <table>
  this.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement;
    const td = target.closest("td");
    const tr = target.closest("tr");
    if (!td || !tr) return;

    const id = parseInt(tr.id, 10);
    const interaction = td.getAttribute("data-interaction");
    if (interaction === "delete") {
      actionDelete(id);
    } else {
      actionSelect(id);
    }
  });

  table = this;

  let len;

  return (
    <table className="table table-hover table-striped test-data">
      <tbody>
        {memo(() =>
          (rows.map((item, index) => (
            <tr
              key={String(item.id)}
              id={String(item.id)}
              className={item.selected ? "danger" : ""}
            >
              <td className="col-md-1">{() => rows[index]?.id}</td>
              <td className="col-md-4">
                <a>{() => rows[index]?.label}</a>
              </td>
              <td data-interaction="delete" className="col-md-1">
                <a>
                  <span
                    className="glyphicon glyphicon-remove"
                    aria-hidden="true"
                  >
                  </span>
                </a>
              </td>
              <td className="col-md-6"></td>
            </tr>
          ))), () => {
            const changed = len !== rows.length;
            len = rows.length;
            return !changed;
          })}
      </tbody>
    </table>
  );
}

function App(this: DocumentFragment) {
  return (
    <div className="container">
      <div className="jumbotron">
        <Toolbar />
      </div>

      <Table />

      <span
        className="preloadicon glyphicon glyphicon-remove"
        aria-hidden="true"
      >
      </span>
    </div>
  );
}

// --- Mount app ---
createRoot(document.body).render(<App />);
