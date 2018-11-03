import GLOBALS from '../consts/GLOBALS';

let renderQueue = [];

/**
 * @param {Function} data
 * @returns {Function}
 */
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

class Dependencies {
  /**
   * @constructor
   */
  constructor() {
    this.dependencies = {};
  }

  /**
   * @param {string[]} path
   * @param {Function} component
   */
  add(path, component) {
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
  }

  /**
   * @param {string[]} path
   * @param {Function} component
   */
  remove(path, component) {
    const key = path[0];
    const index = (this.dependencies[key] || []).indexOf(component);
    if (index >= 0) {
      // console.log('removeDependency', key, component)
      this.dependencies[key].splice(index, 1);
    }
  }

  /**
   * @param {string[]} path
   * @param {Function} component
   */
  component(path, component) {
    if (component) {
      this.add(path, component);

      component.__onDestroy = () => {
        this.remove(path, component);
      };
    }
    return component;
  }

  /**
   * @param {string} key
   * @param {*} newStore
   * @param {*} oldState
   */
  trigger(key, newStore, oldState) {
    if (this.dependencies[key]) {
      this.dependencies[key].forEach(fn => (
        addToRenderQueue(fn)(newStore, oldState)
      ));
    }
  }
}

/**
 * @param {*} key
 * @returns {Function}
 */
const noop = e => e;

export class Listener {
  /**
   * @param {Function} map
   * @param {Store} store
   * @param {Dependencies} dep
   * @constructor
   */
  constructor(map, store) {
    this.map = map;
    this.getValue = this.getValue.bind(this);
    this.render = this.render.bind(this);
    this.store = store;
    this.dep = store.event;
  }

  /**
   * @param {Function} updater
   * @returns {*} Cached state
   */
  getValue(updater) {
    const state = this.store.get();

    if (!this.subbed) {
      this.subbed = this.dep.add('*', updater);
    }

    return this.cached = this.map(state);
  }

  /**
   * @returns {Function} That returns mapped state
   */
  render() {
    const self = this;

    return (function () {
      const mappedState = self.getValue(this);
      return mappedState;
    });
  }
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function isObject(value) {
  return value && (
    value.constructor === Object
    || value.constructor === Array
  );
}

/**
 * @param {Store} store
 * @param {Store} state
 * @param {string[]} path
 * @returns {*} New state
 */
function evalState(store, state, path = []) {
  if (state) {
    if (isObject(state)) {
      const newState = Array.isArray(state) ? [] : {};
      for (const key in state) {
        newState[key] = evalState(store, state[key], path.concat(key));
      }
      return newState;
    }

    if (state instanceof Store) {
      state.subscribe.call(state, (newValue) => {
        store.update(store.setPartial(path, newValue));
      });
      return state.get();
    }
  }

  return state;
}

/**
 * @param {Store} state
 * @param {string|number} key
 * @param {*} value
 * @returns {*} New state
 */
function mapState(state, key, value) {
  if (state && isObject(state)) {
    const output = Array.isArray(state)
      ? [...state]
      : { ...state };
    output[key] = value;
    return output;
  }

  return state;
}

export class Store {
  /**
   * @param {*} state
   * @constructor
   */
  constructor(state) {
    this.dependencies = new Dependencies();
    this.transform = noop;
    this.willDispatch = this.willDispatch.bind(this);
    this.dispatch = this.dispatch.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.update = this.update.bind(this);
    this.get = this.get.bind(this);
    this.storedState = evalState(this, state);
  }

  /**
   * @returns {*} Stored state
   */
  get state() {
    if (GLOBALS.CURRENT_COMPONENT) {
      this.dependencies.component('*', GLOBALS.CURRENT_COMPONENT);
    }

    return this.get();
  }

  /**
   * @returns {*} Transformed state
   */
  get() {
    return this.transform(this.storedState);
  }

  /**
   * @param {Function} transform
   * @returns {Store}
   */
  map(transform) {
    const last = this.transform;
    this.transform = (data) => transform(last(data));
    return this;
  }

  /**
   * @param {string[]} path
   * @param {*} newValue
   * @param {*} source Stored state
   * @returns {*} Mapped state
   */
  setPartial(path, newValue, source = this.storedState) {
    if (source && path && path.length) {
      const [current, ...nextPath] = path;
      return mapState(source, current, this.setPartial(nextPath, newValue, source[current]));
    }

    return newValue;
  }

  /**
   * @param {*} newState
   * @returns {*} Mapped state
   */
  update(newState) {
    const parsedState = evalState(this, newState);
    const oldStore = this.get();
    this.storedState = parsedState;
    this.dependencies.trigger('*', this.get(), oldStore);
    clearRenderQueue();
    return this.get();
  }

  /**
   * @param {Function} callback
   * @returns {Store}
   */
  subscribe(callback) {
    this.dependencies.add('*', callback);
    callback(this.get(), null);
    return this;
  }

  /**
   * @param {Function} subscriber
   */
  unsubscribe(subscriber) {
    this.dependencies.remove('*', subscriber);
  }

  /**
   * @param {Function} action
   * @param {*[]} args
   * @returns {*} Mapped state
   */
  dispatch(action, ...args) {
    const payload = action(this.storedState, ...args);
    // console.log('dispatch', {
    //   action: action.name,
    //   args: args,
    //   payload,
    // });
    // console.log('dispatch', action.name, payload);
    return this.update(payload);
  }

  /**
   * @param {Function} action
   * @param {*[]} args
   * @returns {Function} Store.dispatch
   */
  willDispatch(action, ...args) {
    return (...args2) => this.dispatch(action, ...args, ...args2);
  }

  /**
   * @param {Function} listenerToRender
   * @returns {Listener}
   */
  listener(listenerToRender = e => e) {
    return new Listener(listenerToRender, this);
  }
}
