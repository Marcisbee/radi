import { componentStore } from '../component';

function anchored(anchor, to) {
  return (newState, oldState) => {
    if (anchor[0] === newState) return false;
    if (newState !== oldState) {
      anchor[0] = newState;
      to.dispatch(() => newState);
    }
    return true;
  };
}

function extractState(state, path = []) {
  if (!state) return state;

  if (this && state && typeof state.subscribe === 'function') {
    const anchor = [];
    if (path.length > 0) {
      state.subscribe((newState, oldState) => {
        if (anchor[0] === newState) return false;
        if (newState !== oldState) {
          this.dispatch(() => this.setPartial(path, newState));
          anchor[0] = newState;
        }
        return true;
      });
    } else {
      this.subscribe(anchored(anchor, state));
      state.subscribe(anchored(anchor, this));
    }
    return state.get();
  }

  if (typeof state === 'object') {
    const tempState = Array.isArray(state) ? new Array(state.length) : {};
    for (const key in state) {
      if (state.hasOwnProperty(key)) {
        tempState[key] = extractState.call(this, state[key], path.concat(key));
      }
    }
    return tempState;
  }

  return state;
}

function clone(target, source) {
  const out = Array.isArray(target) ? [] : {};

  for (const i in target) out[i] = target[i];
  for (const i in source) out[i] = source[i];

  return out;
}

function proxied(state, fn, path = []) {
  return new Proxy(state, {
    get(_, prop) {
      const newPath = path.concat(prop);

      if (typeof state[prop] === 'object') {
        return proxied(state[prop], fn, newPath);
      }

      if (typeof fn === 'function') fn(newPath);
      return state[prop];
    },
  });
}

let renderQueue = [];

function addToRenderQueue(data) {
  const fn = data.update || data;
  if (renderQueue.indexOf(fn) < 0) {
    renderQueue.push(fn);
  }
  return fn;
}

function clearRenderQueue() {
  renderQueue = [];
}

function Dependencies() {
  this.dependencies = {};
  this.add = (path, component) => {
    const key = path[0];
    if (typeof this.dependencies[key] === 'undefined') this.dependencies[key] = [];

    if (this.dependencies[key].indexOf(component) < 0) {
      // console.log('addDependency', key, component)
      this.dependencies[key].push(component);
    }
  };
  this.remove = (path, component) => {
    const key = path[0];
    const index = (this.dependencies[key] || []).indexOf(component);
    if (index >= 0) {
      // console.log('removeDependency', key, component)
      this.dependencies[key].splice(index, 1);
    }
  };
  this.fn = fn => (path) => {
    const current = componentStore.currentComponent;
    if (current) {
      this.add(path, current);

      current.__onDestroy = () => {
        this.remove(path, current);
      };
    }
    return fn(path);
  };
  this.trigger = (key, newStore, oldState) => {
    if (this.dependencies[key]) {
      this.dependencies[key].forEach(fn => (
        addToRenderQueue(fn)(newStore, oldState)
      ));
    }
  };
}

const noop = e => e;

export function Store(state = {}, fn = () => {}) {
  let currentState = { ...state };

  const StoreHold = function (path) {
    if (typeof path === 'string') {
      const arrayPath = path.split('.');
      dependencies.fn(fn)(arrayPath);
      return arrayPath.reduce(
        (source, key) => source[key],
        StoreHold.get()
      )
    }

    return proxied(StoreHold.get(), dependencies.fn(fn));
  };

  const dependencies = new Dependencies();
  let remap = noop;
  let mappedState;

  StoreHold.getInitial = () => initialSate;
  StoreHold.get = () => remap(currentState);
  StoreHold.setPartial = (path, value) => {
    const target = Array.isArray(currentState) ? [] : {};
    if (path.length) {
      target[path[0]] =
        path.length > 1
          ? this.setPartial(path.slice(1), value, currentState[path[0]])
          : value;
      return clone(currentState, target);
    }
    return value;
  };
  StoreHold.update = (chunkState/* , noStrictSubs */) => {
    let keys = Object.keys(chunkState);
    const oldState = currentState;
    const newState = {
      ...currentState,
      ...chunkState,
    };
    currentState = newState;
    const newlyMappedState = StoreHold.get();
    if (remap !== noop) {
      for (var key in newlyMappedState) {
        if (
          newlyMappedState.hasOwnProperty(key)
          && (
            !mappedState || (
              mappedState
              && mappedState[key] !== newlyMappedState[key]
              && keys.indexOf(key) < 0
            )
          )
        ) {
          keys.push(key);
        }
      }
    }
    dependencies.trigger('*', newlyMappedState, mappedState);
    keys.forEach(key => dependencies.trigger(key, newlyMappedState, mappedState));
    mappedState = newlyMappedState;

    clearRenderQueue();

    return currentState;
  };
  StoreHold.dispatch = (action, ...args) => {
    const payload = action(currentState, ...args);
    // console.log('dispatch', {
    //   action: action.name,
    //   args: args,
    //   payload,
    // });
    // console.log('dispatch', action.name, payload);
    return StoreHold.update(payload);
  };
  StoreHold.willDispatch = (action, ...args) => (...args2) =>
    StoreHold.dispatch(action, ...args, ...args2);
  StoreHold.subscribe = (callback/* , strict */) => {
    dependencies.add('*', callback);
    callback(StoreHold.get(), null);
    return StoreHold;
  };
  StoreHold.unsubscribe = (subscriber) => {
    dependencies.remove('*', subscriber);
  };
  StoreHold.map = (fnMap) => {
    const tempFn = remap;
    remap = (...args) => fnMap(tempFn(...args));
    return StoreHold;
  };

  const initialSate = extractState.call(StoreHold, state);

  return StoreHold;
}
