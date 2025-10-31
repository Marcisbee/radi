import { createRoot, Fragment, memo, update } from "../src/client.ts";

// --- Data sources ---
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

// --- App state (module-local) ---
type Row = { id: number; label: string; selected: boolean };

let rows: Row[] = [];
let nextId = 1;
let selectedIndex = -1;

// Random helpers mirror the lit-html app behavior
function rand(max: number): number {
  return Math.round(Math.random() * 1000) % max;
}

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

let table: HTMLElement;

// --- Actions (match lit-html app semantics) ---
function actionRun(root: DocumentFragment) {
  rows = buildData(1000);
  selectedIndex = -1;
  update(table);
}

function actionRunLots(root: DocumentFragment) {
  rows = buildData(10000);
  selectedIndex = -1;
  update(table);
}

function actionAdd(root: DocumentFragment) {
  rows = rows.concat(buildData(1000));
  update(table);
}

function actionClear(root: DocumentFragment) {
  rows = [];
  selectedIndex = -1;
  update(table);
}

function actionSwapRows(root: DocumentFragment) {
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

function actionUpdate(root: DocumentFragment) {
  for (let i = 0; i < rows.length; i += 10) {
    rows[i].label += " !!!";
  }
  update(table);
}

function actionDelete(root: DocumentFragment, id: number) {
  const idx = rows.findIndex((r) => r.id === id);
  if (idx !== -1) {
    rows.splice(idx, 1);
    // Fix selectedIndex if deletion affects it
    if (selectedIndex === idx) {
      selectedIndex = -1;
    } else if (selectedIndex > idx) {
      selectedIndex -= 1;
    }
  }
  update(table);
}

function actionSelect(root: DocumentFragment, id: number) {
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
function Toolbar(this: DocumentFragment) {
  return (
    <div className="row">
      <div className="col-md-6">
        <h1>Radi</h1>
      </div>
      <div className="col-md-6">
        <div className="row">
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="run"
              className="btn btn-primary btn-block"
              onclick={() => actionRun(this)}
            >
              Create 1,000 rows
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="runlots"
              className="btn btn-primary btn-block"
              onclick={() => actionRunLots(this)}
            >
              Create 10,000 rows
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="add"
              className="btn btn-primary btn-block"
              onclick={() => actionAdd(this)}
            >
              Append 1,000 rows
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="update"
              className="btn btn-primary btn-block"
              onclick={() => actionUpdate(this)}
            >
              Update every 10th row
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="clear"
              className="btn btn-primary btn-block"
              onclick={() => actionClear(this)}
            >
              Clear
            </button>
          </div>
          <div className="col-sm-6 smallpad">
            <button
              type="button"
              id="swaprows"
              className="btn btn-primary btn-block"
              onclick={() => actionSwapRows(this)}
            >
              Swap Rows
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Table(this: HTMLElement) {
  // Delegate clicks to identify select/delete just like the lit-html `@click` on <table>
  this.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement;
    const td = target.closest("td");
    const tr = target.closest("tr");
    if (!td || !tr) return;

    const id = parseInt(tr.id, 10);
    const interaction = td.getAttribute("data-interaction");
    if (interaction === "delete") {
      actionDelete(this.ownerDocument!.createDocumentFragment(), id);
    } else {
      actionSelect(this.ownerDocument!.createDocumentFragment(), id);
    }
  });

  table = this;

  let lastItemCountStatic;
  return (
    <table className="table table-hover table-striped test-data">
      <tbody>
        {memo(() =>
          rows.map((item, index) => (
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
          )), () => {
          const changed = lastItemCountStatic !== rows.length;
          lastItemCountStatic = rows.length;
          return !changed;
        })}
        {
          /*{rows.map((item) => (
          <tr
            // key={String(item.id)}
            id={String(item.id)}
            className={item.selected ? "danger" : ""}
          >
            <td className="col-md-1">{item.id}</td>
            <td className="col-md-4">
              <a>{item.label}</a>
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
        ))}*/
        }
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
