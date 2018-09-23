import { Component } from '../component';
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
      writable: true,
    });
  }
  if (!source) source = out;

  for (const i in target) {
    const name = i;
    if (typeof target[i] === 'function') {
      out[name] = target[i].call(store, (data, useUpdate, fnName = '') => {
        const payload = setDataInObject(source, path.concat(name), data);
        if (!useUpdate) {
          const f = () => payload;
          Object.defineProperty(f, 'name', { value: fnName, writable: false });
          store.dispatch(f);
        } else {
          store.update(payload);
        }
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

export function Store(state = {}) {
  const subscriptions = [];
  const subscriptionsStrict = [];
  let latestStore;

  function StoreOutput(fn = e => e, ...args) {
    // Handle rendering inside DOM
    if (this instanceof Component) {
      return StoreHold.render(fn);
    }

    // Handle injection into another store
    if (this && this.name === 'StoreHold' && typeof args[0] === 'function') {
      StoreHold.subscribe(args[0], true);
      fn(latestStore, true);
      return latestStore;
    }

    // Handle dom props and other 3rd party plugins
    let lastValue;
    function stateUpdater(update) {
      if (typeof update === 'function') {
        StoreHold.subscribe(s => {
          const newValue = fn(s);
          if (lastValue !== newValue) {
            update(newValue);
          }
        });
        update(lastValue = fn(latestStore), true);
      } else {
        const a = StoreHold.render(fn);
        return a;
      }
      return lastValue;
    }
    stateUpdater.__radiStateUpdater = true;
    return stateUpdater(...args);
  }

  function StoreHold(fn) {
    function stateUpdater(...args) {
      return StoreOutput.call(this, fn, ...args);
    }
    stateUpdater.__radiStateUpdater = true;
    return stateUpdater;
  }

  StoreHold.getInitial = () => STORE;
  StoreHold.get = () => latestStore;
  StoreHold.update = (chunkState, noStrictSubs) => {
    const oldState = latestStore;
    const newState = {
      ...latestStore,
      ...mapData(chunkState, StoreHold),
    };
    latestStore = newState;
    if (!noStrictSubs) {
      subscriptionsStrict.map(s => {
        if (typeof s === 'function') {
          s(newState, oldState);
        }
        return false;
      });
    }
    subscriptions.map(s => {
      if (typeof s === 'function') {
        s(newState, oldState);
      }
      return false;
    });
    return latestStore;
  };
  StoreHold.subscribe = (fn, strict) => {
    if (strict) {
      subscriptionsStrict.push(fn);
    } else {
      subscriptions.push(fn);
    }
    fn(latestStore);
    return StoreHold;
  };
  StoreHold.dispatch = (fn, ...args) => {
    const payload = fn(latestStore, ...args);
    // console.log('dispatch', {
    //   action: fn.name,
    //   args: args,
    //   payload,
    // });
    // console.log('dispatch', fn.name, payload);
    return StoreHold.update(payload);
  };
  StoreHold.render = (fn = (s) => JSON.stringify(s)) => {
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
  };

  const STORE = mapData(state, StoreHold);

  latestStore = STORE;

  return StoreHold;
}
