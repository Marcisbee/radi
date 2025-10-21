// Shared vanilla JS implementation for table benchmarks

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
  renderTable();
}

export function actionRunLots() {
  rows = buildData(10000);
  selectedIndex = -1;
  renderTable();
}

export function actionAdd() {
  rows = rows.concat(buildData(1000));
  renderTable();
}

export function actionClear() {
  rows = [];
  selectedIndex = -1;
  renderTable();
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
  renderTable();
}

export function actionUpdate() {
  for (let i = 0; i < rows.length; i += 10) {
    rows[i].label += " !!!";
  }
  renderTable();
}

export function actionDelete(id: number) {
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
  renderTable();
}

export function actionSelect(id: number) {
  if (selectedIndex > -1 && rows[selectedIndex]) {
    rows[selectedIndex].selected = false;
  }
  selectedIndex = rows.findIndex((r) => r.id === id);
  if (selectedIndex > -1) {
    rows[selectedIndex].selected = true;
  }
  renderTable();
}

// --- Rendering ---
export function renderTable() {
  const tbody = table.querySelector("tbody")!;
  tbody.innerHTML = rows.map((item) => `
    <tr id="${item.id}" class="${item.selected ? "danger" : ""}">
      <td class="col-md-1">${item.id}</td>
      <td class="col-md-4"><a>${item.label}</a></td>
      <td data-interaction="delete" class="col-md-1">
        <a><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>
      </td>
      <td class="col-md-6"></td>
    </tr>
  `).join("");
}

// --- Setup ---
export function setupVanilla(container: HTMLElement) {
  container.innerHTML = `
    <div class="container">
      <div class="jumbotron">
        <div class="row">
          <div class="col-md-6">
            <h1>Vanilla</h1>
          </div>
          <div class="col-md-6">
            <div class="row">
              <div class="col-sm-6 smallpad">
                <button type="button" id="run" class="btn btn-primary btn-block">Create 1,000 rows</button>
              </div>
              <div class="col-sm-6 smallpad">
                <button type="button" id="runlots" class="btn btn-primary btn-block">Create 10,000 rows</button>
              </div>
              <div class="col-sm-6 smallpad">
                <button type="button" id="add" class="btn btn-primary btn-block">Append 1,000 rows</button>
              </div>
              <div class="col-sm-6 smallpad">
                <button type="button" id="update" class="btn btn-primary btn-block">Update every 10th row</button>
              </div>
              <div class="col-sm-6 smallpad">
                <button type="button" id="clear" class="btn btn-primary btn-block">Clear</button>
              </div>
              <div class="col-sm-6 smallpad">
                <button type="button" id="swaprows" class="btn btn-primary btn-block">Swap Rows</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <table class="table table-hover table-striped test-data">
        <tbody></tbody>
      </table>
      <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
    </div>
  `;

  table = container.querySelector("table")!;

  // Add event listeners
  container.querySelector("#run")!.addEventListener("click", actionRun);
  container.querySelector("#runlots")!.addEventListener("click", actionRunLots);
  container.querySelector("#add")!.addEventListener("click", actionAdd);
  container.querySelector("#update")!.addEventListener("click", actionUpdate);
  container.querySelector("#clear")!.addEventListener("click", actionClear);
  container.querySelector("#swaprows")!.addEventListener(
    "click",
    actionSwapRows,
  );

  // Delegate clicks on table
  table.addEventListener("click", (e: Event) => {
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
}
