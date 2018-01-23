/** @jsx r **/

const rand = Math.random

function buildData(count, start) {
  start = (start) ? start : 0;
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
  ]

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
  ]

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
  ]

  var i = start + 1;
  return new Array(count).fill(0).map(_ => ({ id: i++, value: `${adjectives[
    rand() * 1000 % adjectives.length >> 0]} ${colours[
    rand() * 1000 % colours.length >> 0]} ${nouns[
    rand() * 1000 % nouns.length >> 0]}`
  }))
}

var bnc = {};
var av = (k = 'null', i) => {
  if (typeof bnc[k] === 'undefined') bnc[k] = [];
  var p = bnc[k];
  p.push(i);
  return p.reduce((a, b) => (a + b)) / p.length;
}
var bench = (k, c, cb) => {
  let t;
  c();
  t = performance.now();
  window.requestAnimationFrame(() => {
    let e = performance.now();
    console.log(k, (e - t).toFixed(2), ', AVG =', av(k, e - t).toFixed(2) + 'ms');
    cb((e - t).toFixed(2));
  });
};

function random_rgba() {
  var o = Math.round, r = Math.random, s = 175, i = 50;
  return 'rgb(' + o(r()*s+i) + ',' + o(r()*s+i) + ',' + o(r()*s+i) + ')';
}


var perf0 = performance.now();
const { r, l, component, mount, condition } = require('../../src/index.js');

const state = {
  name: 'Marcis',
  num: 0,
  time: 0,
  count: 0,
  color: 'red',
  show: false,
  list: [],
  bench: '-',
  intervals: {
    a: null,
    b: null,
    c: null,
  }
}

const actions = {
  onMount() {
    // console.log('Mounted in', performance.now() - perf0, 'ms');

    this.intervals.a = setInterval(() => {
      this.num = ('0' + Math.round(Math.random() * 100)).substr(-2);
    }, 0);

    this.intervals.a = setInterval(() => {
      this.time = ('0' + Math.round(Math.random() * 100)).substr(-2);
    }, 1000);

    this.intervals.a = setInterval(() => {
      this.color = random_rgba();
    }, 100);
  },
  onDestroy() {
    clearInterval(this.intervals.a);
    clearInterval(this.intervals.b);
    clearInterval(this.intervals.c);
  },
  toggle(events) {
    bench('Toggle element', () => {
      this.show = !this.show;
    }, (b) => {
      this.bench = b;
    });
  },
  reverse() {
    bench('Reverse list', () => {
      this.list.reverse();
    }, (b) => {
      this.bench = b;
    });
  },
  create1000() {
    bench('Create 1,000 rows', () => {
      this.list = buildData(1000, this.list.length);
      this.count = 1000;
    }, (b) => {
      this.bench = b;
    });
  },
  add1000() {
    bench('Add 1,000 rows', () => {
      this.list = this.list.concat(buildData(1000, this.list.length));
      this.count += 1000;
    }, (b) => {
      this.bench = b;
    });
  },
  add10000() {
    bench('Add 10,000 rows', () => {
      this.list = this.list.concat(buildData(10000, this.list.length));
      this.count += 10000;
    }, (b) => {
      this.bench = b;
    });
  },
  pop() {
    bench('Remove 1 row', () => {
      this.list.pop();
      this.count -= 1;
    }, (b) => {
      this.bench = b;
    });
  },
  update(events) {
    bench('Update every 10th row', () => {
      for (var i = 0; i < this.list.length; i++) {
        if (!((i + 1) % 10)) this.list[i] = { value: this.list[i].value + ' !!!' };
      }
    }, (b) => {
      this.bench = b;
    });
  },
  remove(events) {
    bench('Remove all rows', () => {
      this.list.splice(0, this.list.length);
      this.count = 0;
    }, (b) => {
      this.bench = b;
    });
  },
  swap(events) {
    bench('Swap 5th and 10th rows', () => {
      var x = 4, y = 9;
      this.list[x] = this.list.splice(y, 1, this.list[x])[0];
    }, (b) => {
      this.bench = b;
    });
  }
}

const view = function () {
  var name = l(this.name);

  return (
    <div style="white-space: pre;">
      <h4>[dynamic predefined] My name is { name }</h4>
      <h4>[dynamic] My name is { l(this.name + ' Bergmanis') }</h4>
      <h4>[static] My name is { this.name }</h4>
      <input type="email" autofocus="true" model={ l(this.name) } />
      <hr />
      { condition(
        l(this.show),
        <div style={ { color: l(this.color) } }>
          This refreshes 60fps: { l(this.num) }
          <br/>
          This refreshes every second: { l(this.time) }
          <br/>
        </div>
      ) }
      <button onclick={ this.toggle.props('asd') }>Toggle Color Test</button>
      <hr />
      <div>
        <h3>Item count: { l(this.count) }</h3>
        <h3>More than 1000: { l(this.count > 1000) }</h3>
        <p>Benchmark: { l(this.bench) } ms</p>
        <div>
          <button onclick={ this.create1000 }>Create 1,000 rows</button>
          <button onclick={ this.add1000 }>Add 1,000 rows</button>
          <button onclick={ this.add10000 }>Add 10,000 rows</button>
          <br/>
          <button onclick={ this.pop }>Remove 1 row</button>
          <button onclick={ this.reverse }>Reverse Test</button>
          <button onclick={ this.swap }>Swap Test</button>
          <button onclick={ this.remove }>Remove all</button>
        </div>
        <ul>
          <li>Child node on top</li>
          { l(this.list).loop(item =>
            <li>{ l(item.id) } - { l(item.value) }</li>
          ) }
          <li>Child node at bottom</li>
        </ul>
      </div>
    </div>
  );
};

const main = component({
  name: 'main-component',
  view: view,
  state: state,
  actions: actions
});

module.exports = main
