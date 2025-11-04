import { el, list, mount as mountRedom, unmount as unmountRedom } from 'npm:redom';

function _random (max) {
  return Math.floor(Math.random() * max);
}

export class Store {
  constructor () {
    this.data = [];
    this.backup = null;
    this.selected = null;
    this.id = 1;
  }
  buildData (count = 1000) {
    const adjectives = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy'];
    const colours = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange'];
    const nouns = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard'];
    const data = new Array(1000);

    for (let i = 0; i < count; i++) {
      data[i] = {
        id: this.id++,
        label: adjectives[_random(adjectives.length)] + ' ' + colours[_random(colours.length)] + ' ' + nouns[_random(nouns.length)]
      };
    }
    return data;
  }
  updateData (mod = 10) {
    for (let i = 0; i < this.data.length; i += 10) {
      this.data[i].label += ' !!!';
    }
  }
  delete (id) {
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].id === id) {
        this.data.splice(i--, 1);
        return;
      }
    }
  }
  run () {
    this.data = this.buildData();
    this.selected = null;
  }
  add () {
    this.data.push.apply(this.data, this.buildData(1000));
    this.selected = null;
  }
  update () {
    this.updateData();
    this.selected = null;
  }
  select (id) {
    this.selected = id;
  }
  hideAll () {
    this.backup = this.data;
    this.data = [];
    this.selected = null;
  }
  showAll () {
    this.data = this.backup;
    this.backup = null;
    this.selected = null;
  }
  runLots () {
    this.data = this.buildData(10000);
    this.selected = null;
  }
  clear () {
    this.data = [];
    this.selected = null;
  }
  swapRows () {
    if (this.data.length > 998) {
      const a = this.data[1];
      this.data[1] = this.data[998];
      this.data[998] = a;
    }
  }
}

export class App {
  constructor ({ store }) {
    this.store = store;
    this.el = el('.container',
      el('.jumbotron',
        el('.row',
          el('.col-md-6',
            el('h1', 'RE:DOM')
          ),
          el('.col-md-6',
            el('.row',
              el('.col-sm-6.smallpad',
                el('button#run.btn.btn-primary.btn-block', { type: 'button', onclick: e => this.run() },
                  'Create 1,000 rows'
                )
              ),
              el('.col-sm-6.smallpad',
                el('button#runlots.btn.btn-primary.btn-block', { type: 'button', onclick: e => this.runLots() },
                  'Create 10,000 rows'
                )
              ),
              el('.col-sm-6.smallpad',
                el('button#add.btn.btn-primary.btn-block', { type: 'button', onclick: e => this.add() },
                  'Append 1,000 rows'
                )
              ),
              el('.col-sm-6.smallpad',
                el('button#update.btn.btn-primary.btn-block', { type: 'button', onclick: e => this.update() },
                'Update every 10th row'
                )
              ),
              el('.col-sm-6.smallpad',
                el('button#clear.btn.btn-primary.btn-block', { type: 'button', onclick: e => this.clear() },
                  'Clear'
                )
              ),
              el('.col-sm-6.smallpad',
                el('button#swaprows.btn.btn-primary.btn-block', { type: 'button', onclick: e => this.swapRows() },
                  'Swap Rows'
                )
              )
            )
          )
        )
      ),
      el('table.table.table-hover.table-striped.test-data',
        this.table = list('tbody', Tr, 'id', { app: this, store })
      ),
      el('span.preloadicon.glyphicon.glyphicon-remove', { 'aria-hidden': true })
    );
  }
  add () {
    this.store.add();
    this.render();
  }
  remove (id) {
    this.store.delete(id);
    this.render();
  }
  select (id) {
    this.store.select(id);
    this.render();
  }
  run () {
    this.store.run();
    this.render();
  }
  update () {
    this.store.update();
    this.render();
  }
  runLots () {
    this.store.runLots();
    this.render();
  }
  clear () {
    this.store.clear();
    this.render();
  }
  swapRows () {
    this.store.swapRows();
    this.render();
  }
  render () {
    this.table.update(this.store.data);
  }
}

class Tr {
  constructor ({ app, store }) {
    this.data = {};
    this.app = app;
    this.store = store;
    this.isSelected = false;
    this.el = el('tr',
      this.id = el('td.col-md-1'),
      el('td.col-md-4',
        this.label = el('a', { onclick: e => app.select(this.data.id) })
      ),
      el('td.col-md-1',
        el('a', { onclick: e => app.remove(this.data.id) },
          el('span.glyphicon.glyphicon-remove', { 'aria-hidden': true })
        )
      ),
      el('td.col-md-6')
    );
  }
  update (data) {
    const { id, label } = data;
    const { selected } = this.store;

    if (id !== this.data.id) {
      this.id.textContent = id;
    }

    if (label !== this.data.label) {
      this.label.textContent = label;
    }

    if (id === selected && !this.isSelected) {
      this.el.classList.add('danger');
      this.isSelected = true;
    } else if (this.isSelected) {
      this.el.classList.remove('danger');
      this.isSelected = false;
    }

    this.data = { id, label };
  }
}

export const title = "RE:DOM";
let app: App;
export function mount() {
  const store = new Store();
  app = new App({ store });

  mountRedom(document.body, app!);
}

export function unmount() {
  unmountRedom(document.body, app!);
}
