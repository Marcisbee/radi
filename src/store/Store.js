import GLOBALS from '../consts/GLOBALS';

let renderQueue = [];

/**
 * @param {Function} data
 * @returns {Function}
 */
function addToRenderQueue(data) {
  const fn = (data.update && (() => data.update())) || data;
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
    this.dependencies = [];
  }

  /**
   * @param {Function} component
   */
  add(component) {
    this.dependencies = this.dependencies.filter(c => {
      if (GLOBALS.CURRENT_COMPONENT
        && (
          c === GLOBALS.CURRENT_COMPONENT.query
          || c.query === GLOBALS.CURRENT_COMPONENT.query
        )) return true;
      if (c.pointer instanceof Node) {
        if (c.mounted) return true;
        return c.pointer.isConnected;
      }
      return true;
    });

    if (this.dependencies.indexOf(component) < 0) {
      // console.log('addDependency', component, this.dependencies)
      this.dependencies.push(component);
    }
  }

  /**
   * @param {Function} component
   */
  remove(component) {
    const index = this.dependencies.indexOf(component);
    if (index >= 0) {
      // console.log('removeDependency', component)
      this.dependencies.splice(index, 1);
    }
  }

  /**
   * @param {Function} component
   */
  component(component) {
    if (component) {
      this.add(component);

      component.__onDestroy = () => {
        this.remove(component);
      };
    }
    return component;
  }

  /**
   * @param {*} newState
   * @param {*} oldState
   */
  trigger(newState, oldState) {
    this.dependencies.forEach(fn => (
      addToRenderQueue(fn)(newState, oldState)
    ));
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
    this.update = this.update.bind(this);
    this.store = store;
  }

  /**
   * @param {Function} updater
   * @returns {*} Cached state
   */
  link(updater) {
    if (!this.subbed) {
      this.subbed = this.store.subscribe(updater);
    }
    return this.subbed;
  }

  /**
   * @param {Function} updater
   * @returns {*} Cached state
   */
  getValue(updater) {
    const state = this.store.getState();

    if (!this.subbed) {
      this.subbed = this.store.subscribe(updater);
    }

    return this.cached = this.map(state);
  }

  /**
   * @returns {*} Cached state
   */
  update() {
    const state = this.store.getState();
    return this.cached = this.map(state);
  }
}

let storeListMiddleware = noop;
const storeList = [];

function addStoreToList(store) {
  const index = storeList.push(store) - 1;
  store.id = index;

  storeListMiddleware(storeList);

  return index;
}

export const events = {};

/**
 * @param {*} originalState
 * @param {String} name
 * @returns {Store} Store
 */
export function Store(originalState = null, name = 'unnamed') {
  let state = originalState;
  const storeEvents = [];
  const dependencies = new Dependencies();

  const _store = {

    /**
     * @param {Action} action
     * @param {Function} reducer
     * @returns {*} Stored state
     */
    on(action, reducer = (s) => s) {
      events[action.id].push((...args) => {
        const newState = reducer(state, ...args);

        return _store.setState(newState);
      });
      return _store;
    },

    /**
     * @returns {*} Stored state
     */
    get state() {
      return _store.getState();
    },

    /**
     * @returns {*} Stored state
     */
    getState() {
      if (GLOBALS.CURRENT_COMPONENT) {
        dependencies.component(GLOBALS.CURRENT_COMPONENT);
      }

      return state;
    },

    /**
     * @param {*} newState
     * @returns {*} Stored state
     */
    setState(newState) {
      // Timeout render queue
      setTimeout(() => {
        dependencies.trigger(newState, state);
        clearRenderQueue();
      });

      storeEvents.forEach((fn) => {
        fn(newState, state);
      });

      return (state = newState);
    },

    /**
     * @param {Function} fn
     * @returns {Function} Unsubscribe
     */
    subscribe(fn) {
      dependencies.add(fn);
      fn(_store.getState(), null);
      storeEvents.push(fn);
      return () => {
        const index = storeEvents.indexOf(fn);
        if (index >= 0) {
          dependencies.remove(fn);
          storeEvents.splice(index, 1);
        }
      };
    },

    /**
     * @returns {*} Transformed state
     */
    get bind() {
      return {
        value: _store.getState(),
        onInput: (e) => _store.setState(e.target.value),
      };
    },

    /**
     * @param {Function} listenerToRender
     * @returns {Listener}
     */
    listener(listenerToRender = e => e) {
      return new Listener(listenerToRender, _store);
    },
  };

  if (name !== false) {
    addStoreToList(_store);
  }

  return _store;
}

export function StoreMiddleware(
  stores = noop,
  // dispatch = noop,
  // freeze = noop,
  // resume = noop,
) {
  // @TODO: Add middleware to:
  // - freeze updates
  // - resume updates
  storeListMiddleware = stores;
  // storeDispatchMiddleware = dispatch;
  storeListMiddleware(storeList);
}
