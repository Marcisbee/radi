import GLOBALS from '../consts/GLOBALS'

const currentListener = null;

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

  if (state && typeof state === 'object') {
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
      // console.log('addDependency', key, component, this.dependencies[key])
      this.dependencies[key].push(component);
    }

    this.dependencies[key] = this.dependencies[key].filter(c => {
      if (c.dom instanceof Node) {
        return c.dom.isConnected;
      }

      return true;
    });
  };
  this.remove = (path, component) => {
    const key = path[0];
    const index = (this.dependencies[key] || []).indexOf(component);
    if (index >= 0) {
      // console.log('removeDependency', key, component)
      this.dependencies[key].splice(index, 1);
    }
  };
  this.component = (path, component) => {
    if (component) {
      this.add(path, component);

      component.__onDestroy = () => {
        this.remove(path, component);
      };
    }
    return component;
  };
  this.fn = fn => (path) => {
    const current = currentListener;
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

export class Listener {
  constructor(map, store, dep) {
    this.map = map;
    this.getValue = this.getValue.bind(this);
    this.render = this.render.bind(this);
    this.store = store;
    this.dep = dep;
  }

  getValue(updater) {
    const state = this.store.get();

    if (!this.subbed) {
      this.subbed = this.dep.add('*', updater);
    }

    return this.cached = this.map(state);
  }

  render() {
    const self = this;

    return (function () {
      const mappedState = self.getValue(this);
      return mappedState;
    });
  }
}

function getDataFromObject(path, source) {
  let i = 0;
  while (i < path.length) {
    if (typeof source === 'undefined') {
      i++;
    } else {
      source = source[path[i++]];
    }
  }
  return source;
}

function updateState(state, source, path, data, useUpdate, name = '') {
  const payload = state.setPartial(path, data);

  if (!useUpdate) {
    const f = () => payload;
    Object.defineProperty(f, 'name', { value: name, writable: false });
    state.dispatch(f);
  } else {
    state.update(payload);
  }
}

function getClonedState(state, chunk) {
  if (Array.isArray(state)) {
    return [ ...state, ...chunk ];
  }

  if (state && typeof state === 'object') {
    return { ...state, ...chunk };
  }

  if (typeof chunk !== 'undefined') {
    return chunk;
  }

  return state;
}

export function Store(state = {}/* , fn = () => {} */) {
  let currentState = getClonedState(state);

  const StoreHold = function (listenerToRender = e => e) {
    const listener = new Listener(listenerToRender, StoreHold, dependencies);

    return listener;
  };

  const dependencies = new Dependencies();
  let remap = noop;
  let mappedState;

  Object.defineProperty(StoreHold, 'state', {
    get: function () {
      if (GLOBALS.CURRENT_COMPONENT) {
        dependencies.component('*', GLOBALS.CURRENT_COMPONENT);
      }
      return StoreHold.get();
    },
  });
  StoreHold.getInitial = () => initialSate;
  StoreHold.get = (path) => {
    const remappedState = remap(currentState);
    if (path) {
      return getDataFromObject(
        typeof path === 'string' ? path.split('.') : path,
        remappedState,
      );
    }

    return remappedState;
  };
  StoreHold.setPartial = (path, value) => {
    const target = Array.isArray(currentState) ? [] : {};
    if (path.length) {
      target[path[0]] =
        path.length > 1
          ? this.setPartial(path.slice(1), value, currentState[path[0]])
          : value;
      return getClonedState(currentState, target);
    }
    return value;
  };
  StoreHold.bind = (path, output = e => e, input = e => e) => {
    const pathAsArray = Array.isArray(path) ? path : path.split('.');
    const getVal = (source) => output(getDataFromObject(pathAsArray, source));
    const setVal = (value) => updateState(StoreHold, StoreHold.get(), pathAsArray, input(value), false, `Bind:${path}`);

    return {
      model: StoreHold(getVal),
      oninput: (e) => setVal(e.target.value),
    };
  };
  StoreHold.update = (chunkState/* , noStrictSubs */) => {
    // const keys = Object.keys(chunkState || {});
    const newState = getClonedState(currentState, chunkState);
    currentState = newState;
    const newlyMappedState = StoreHold.get();
    // if (remap !== noop) {
    //   for (const key in newlyMappedState) {
    //     if (
    //       newlyMappedState.hasOwnProperty(key)
    //       && (
    //         !mappedState || (
    //           mappedState
    //           && mappedState[key] !== newlyMappedState[key]
    //           && keys.indexOf(key) < 0
    //         )
    //       )
    //     ) {
    //       keys.push(key);
    //     }
    //   }
    // }
    dependencies.trigger('*', newlyMappedState, mappedState);
    // keys.forEach(key => dependencies.trigger(key, newlyMappedState, mappedState));
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
  Object.defineProperty(StoreHold, 'interface', {
    get: () => [
      StoreHold.state,
      StoreHold.dispatch,
      StoreHold.subscribe,
      StoreHold.unsubscribe,
    ],
  });

  const initialSate = extractState.call(StoreHold, state);

  return StoreHold;
}
