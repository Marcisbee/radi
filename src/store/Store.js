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
    const state = this.store.getRawState();

    if (!this.subbed) {
      this.subbed = this.store.subscribe(updater);
    }

    return this.cached = this.map(state);
  }

  /**
   * @returns {*} Cached state
   */
  update() {
    const state = this.store.getRawState();
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
  const isActionStore = (originalState && originalState.isRadiAction);
  let state = isActionStore ? null : originalState;
  const storeEvents = [];
  const dependencies = new Dependencies();
  let storeSchema = null;

  const _store = {

    /**
     * @param {*} schema
     * @returns {*} Stored state
     */
    schema(schema) {
      storeSchema = schema;
      _store.setState(state);
      return _store;
    },

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
     * @returns {*} Stored state
     */
    getRawState() {
      return state;
    },

    /**
     * @param {*} newState
     * @returns {*} Stored state
     */
    setState(newStateRaw) {
      const newState = transform(newStateRaw, storeSchema);

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
      fn(_store.getRawState(), null);
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
     * @param {Function} transformer
     * @param {String} mappedName
     * @returns {*} Mapped state
     */
    map(transformer = (e) => e, mappedName = `Mapped ${name}`) {
      const mappedStore = Store(state, mappedName);
      _store.subscribe(
        (newState, oldState) => {
          mappedStore.setState(transformer(newState, oldState));
        }
      );
      return mappedStore;
    },

    /**
     * @returns {*} Transformed state
     */
    get bind() {
      return {
        value: _store.listener(),
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

  if (isActionStore) {
    _store.on(originalState, (_, newState) => newState);
  }

  return _store;
}

export function transform(value, Instance) {
  if (typeof Instance !== 'function') {
    if (Instance && Instance.constructor === RegExp) {
      // eslint-disable-next-line no-new-wrappers
      return (new String(value).valueOf()).match(Instance);
    }

    if (Instance instanceof Array) {
      const newValue = transform(value, Array);
      const insideInstance = Instance[0];

      if (!insideInstance) return newValue;

      return newValue.map((v) => transform(v, insideInstance));
    }

    if (!!Instance && Instance instanceof Object) {
      const tempValue = {};
      const keys = Object.keys(Instance);

      keys.forEach((key) => {
        tempValue[key] = transform(
          (value || {})[key] || null,
          (Instance || {})[key] || null
        );
      });

      return tempValue;
    }

    if (Number.isNaN(Instance) || Instance === undefined || Instance === null) {
      return value;
    }

    return Instance;
  }

  if (value instanceof Instance) {
    return value;
  }

  if (!value) {
    return new Instance().valueOf();
  }

  return new Instance(value).valueOf();
}

export function Merge(stores, name = 'Unnnamed Map') {
  const storesList = [].concat(stores);
  const states = storesList.map((store) => store.getRawState());
  const mappedStore = Store(states, name);
  storesList.forEach(
    (store, ii) => store.subscribe(
      (state) => {
        states[ii] = state;
        mappedStore.setState(states);
      }
    )
  );
  return mappedStore;
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
