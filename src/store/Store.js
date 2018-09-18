import { patch } from '../html/patch';

function setDataInObject(source, path, data) {
  const name = path[0];
  const out = {
    [name]: source[name],
  };
  let temp = out;
  let i = 0;
  while (i < path.length - 1) {
    temp = temp[path[i++]];
  }
  temp[path[i]] = data;
  return out;
}

function mapData(target, store, source, path = []) {
  const out = {};
  if (target && target.$loading) {
    Object.defineProperty(out, '$loading', {
      value: true,
      writable: false,
    });
  }
  if (!source) source = out;

  for (const i in target) {
    const name = i;
    if (typeof target[i] === 'function') {
      const tempOutput = target[i]((data, useUpdate) => {
        const payload = setDataInObject(source, path.concat(name), data);
        if (!useUpdate) {
          store.dispatch(() => payload);
        } else {
          store.update(payload);
        }
      });
      out[name] = typeof tempOutput === 'object' ? tempOutput : {};

      Object.defineProperty(out[name], '$loading', {
        value: true,
        writable: false,
      });
    } else {
      out[name] = target[name] && typeof target[name] === 'object'
        && !Array.isArray(target[name])
        ? mapData(target[name], store, source, path.concat(name))
        : target[name];
    }
  }

  return out;
}

// TODO: Check out why initial state for Subscribe is `{}`

export function Store(state = {}) {
  const OUT = {};
  const subscriptions = [];
  const subscriptionsStrict = [];
  let latestStore;

  Object.setPrototypeOf(OUT, {
    getInitial() {
      return STORE;
    },
    get() {
      return latestStore;
    },
    update(chunkState, noStrictSubs) {
      const newState = {
        ...latestStore,
        ...mapData(chunkState, OUT),
      };
      latestStore = newState;
      if (!noStrictSubs) {
        subscriptionsStrict.map(s => {
          if (typeof s === 'function') {
            s(newState);
          }
          return false;
        });
      }
      subscriptions.map(s => {
        if (typeof s === 'function') {
          s(newState);
        }
        return false;
      });
      return latestStore;
    },
    subscribe(fn, strict) {
      if (strict) {
        subscriptionsStrict.push(fn);
      } else {
        subscriptions.push(fn);
      }
    },
    dispatch(fn, ...args) {
      const payload = fn(latestStore, ...args);
      // console.log('dispatch', {
      //   action: fn.name,
      //   args: args,
      //   payload,
      // });
      // console.log('dispatch', fn.name, payload);
      return this.update(payload);
    },
    render(fn = (s) => JSON.stringify(s)) {
      let $parent;
      let $pointer;
      let newTree;
      let oldTree;
      let mounted = false;

      function update(data) {
        newTree = fn(data);
        patch($parent, newTree, oldTree, 0, $pointer);
        oldTree = newTree;
        return data;
      }

      subscriptions.push((data) => {
        if (mounted) {
          update(data);
        }
        return data;
      });

      function item() {
        this.onMount = (element, parent) => {
          mounted = true;
          $pointer = element;
          $parent = parent || element.parentNode;
          update(latestStore);
        };
        return '';
      }

      return item;
    },
    inject(update) {
      if (typeof update !== 'function') {
        console.warn('[Radi.js] Store\'s `.inject()` method must not be called on it\'s own. Instead use `{ field: Store.inject }`.');
        return latestStore;
      }
      OUT.subscribe(update, true);
      update(latestStore, true);
      return latestStore;
    },
    out(fn) {
      let lastValue;
      function stateUpdater(update) {
        if (typeof update === 'function') {
          OUT.subscribe(s => {
            const newValue = fn(s);
            if (lastValue !== newValue) {
              update(newValue);
            }
          });
          update(lastValue = fn(latestStore), true);
        } else {
          const a = OUT.render(fn);
          return a;
        }
        return lastValue;
      }
      stateUpdater.__radiStateUpdater = true;
      return stateUpdater;
    },
  });

  const STORE = mapData(state, OUT);

  latestStore = STORE;

  return OUT;
}
