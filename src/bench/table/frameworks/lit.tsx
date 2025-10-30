import { html, LitElement } from "npm:lit";
import { customElement, property } from "npm:lit/decorators.js";
import { repeat } from "npm:lit/directives/repeat.js";

function _random(max) {
  return Math.round(Math.random() * 1000) % max;
}

export class Store {
  data = [];
  selected = undefined;
  id = 1;

  buildData(count = 1000) {
    var adjectives = [
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
    var colours = [
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
    var nouns = [
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
    var data = [];
    for (var i = 0; i < count; i++) {
      data.push({
        id: this.id++,
        label: adjectives[_random(adjectives.length)] + " " +
          colours[_random(colours.length)] + " " + nouns[_random(nouns.length)],
      });
    }
    return data;
  }
  updateData(mod = 10) {
    // Just assigning setting each tenth this.data doesn't cause a redraw, the following does:
    var newData = [...this.data];

    for (let i = 0; i < newData.length; i += 10) {
      newData[i].label += " !!!";
    }
    this.data = newData;
  }
  delete(id) {
    const idx = this.data.findIndex((d) => d.id == id);
    this.data = this.data.slice(0, idx).concat(this.data.slice(idx + 1));
  }
  run() {
    this.data = this.buildData();
    this.selected = undefined;
  }
  add() {
    this.data = this.data.concat(this.buildData(1000));
  }
  update() {
    this.updateData();
  }
  select(id) {
    this.selected = id;
  }
  runLots() {
    this.data = this.buildData(10000);
    this.selected = undefined;
  }
  clear() {
    this.data = [];
    this.selected = undefined;
  }
  swapRows() {
    if (this.data.length > 998) {
      let d1 = this.data[1];
      let d998 = this.data[998];

      var newData = this.data.map(function (data, i) {
        if (i === 1) {
          return d998;
        } else if (i === 998) {
          return d1;
        }
        return data;
      });
      this.data = newData;
    }
  }
}

let store = new Store();

@customElement("main-element")
export class MainElement extends LitElement {
  @property()
  _rows = store.data;

  @property()
  _selected = store.selected;

  createRenderRoot() {
    // ensure the element uses an open shadow root
    return this.attachShadow({ mode: "open" });
  }

  render() {
    return html`
      <link href="/css/currentStyle.css" rel="stylesheet" />
      <div class="container">
        <div class="jumbotron">
          <div class="row">
            <div class="col-md-6">
              <h1>Lit keyed</h1>
            </div>
            <div class="col-md-6">
              <div class="row">
                <div class="col-sm-6 smallpad">
                  <button
                    type="button"
                    class="btn btn-primary btn-block"
                    id="run"
                    @click="${this._run}"
                  >
                    Create 1,000 rows
                  </button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button
                    type="button"
                    class="btn btn-primary btn-block"
                    id="runlots"
                    @click="${this._runLots}"
                  >
                    Create 10,000 rows
                  </button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button
                    type="button"
                    class="btn btn-primary btn-block"
                    id="add"
                    @click="${this._add}"
                  >
                    Append 1,000 rows
                  </button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button
                    type="button"
                    class="btn btn-primary btn-block"
                    id="update"
                    @click="${this._update}"
                  >
                    Update every 10th row
                  </button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button
                    type="button"
                    class="btn btn-primary btn-block"
                    id="clear"
                    @click="${this._clear}"
                  >
                    Clear
                  </button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button
                    type="button"
                    class="btn btn-primary btn-block"
                    id="swaprows"
                    @click="${this._swapRows}"
                  >
                    Swap Rows
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <table class="table table-hover table-striped test-data" @click="${this
          ._handleClick}">
          <tbody>
            ${repeat(this._rows, (item) => item.id, (item) =>
              html`
                <tr id="${item.id}" class="${item.id == this._selected
                  ? "danger"
                  : ""}">
                  <td class="col-md-1">${item.id}</td>
                  <td class="col-md-4">
                    <a data-action="select" data-id="${item.id}">${item
                      .label}</a>
                  </td>
                  <td class="col-md-1">
                    <a>
                      <span
                        class="glyphicon glyphicon-remove"
                        aria-hidden="true"
                        data-action="remove"
                        data-id="${item.id}"
                      ></span>
                    </a>
                  </td>
                  <td class="col-md-6"></td>
                </tr>
              `)}
          </tbody>
        </table>
        <span
          class="preloadicon glyphicon glyphicon-remove"
          aria-hidden="true"
        ></span>
      </div>
    `;
  }

  _handleClick(e) {
    const { action, id } = e.target.dataset;
    if (action && id) {
      this["_" + action](id);
    }
  }
  _add() {
    store.add();
    this._sync();
  }
  _remove(id) {
    store.delete(id);
    this._sync();
  }
  _select(id) {
    store.select(id);
    this._sync();
  }
  _run() {
    store.run();
    this._sync();
  }
  _update() {
    store.update();
    this._sync();
  }
  _runLots() {
    store.runLots();
    this._sync();
  }
  _clear() {
    store.clear();
    this._sync();
  }
  _swapRows() {
    store.swapRows();
    this._sync();
  }
  _sync() {
    this._rows = store.data;
    this._selected = store.selected;
  }
}

export const title = "Lit keyed";

export function mount() {
  store = new Store();
  document.body.innerHTML = "<main-element></main-element>";
  debugger;
}

export function unmount() {
  document.body.innerHTML = "";
}
