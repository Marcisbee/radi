export default class PrivateStore {
  constructor() {
    this.store = {};
  }

  /**
   * @param {string} key
   * @param {Listener} listener
   * @param {number} depth
   */
  addListener(key, listener, depth) {
    if (typeof this.store[key] === 'undefined') {
      this.createItemWrapper(key);
    }
    this.store[key].listeners[depth] = (this.store[key].listeners[depth] || []).filter(item => (
      item.attached
    ));
    this.store[key].listeners[depth].push(listener);

    return listener;
  }

  /**
   * Removes all listeners for all keys
   */
  removeListeners() {
    let o = Object.keys(this.store);
    for (var i = 0; i < o.length; i++) {
      this.store[o[i]].listeners = {};
      this.store[o[i]].value = null;
    }
  }

  /**
   * setState
   * @param {*} newState
   * @returns {*}
   */
  setState(newState) {
    // Find and trigger changes for listeners
    for (const key of Object.keys(newState)) {
      if (typeof this.store[key] === 'undefined') {
        this.createItemWrapper(key);
      }
      this.store[key].value = newState[key];

      this.triggerListeners(key);
    }
    return newState;
  }

  /**
   * createItemWrapper
   * @private
   * @param {string} key
   * @returns {object}
   */
  createItemWrapper(key) {
    return this.store[key] = {
      listeners: {},
      value: null,
    };
  }

  /**
   * triggerListeners
   * @private
   * @param {string} key
   */
  triggerListeners(key) {
    const item = this.store[key];
    if (item) {
      let clone = Object.keys(item.listeners)
        .sort()
        .map(key => (
          item.listeners[key].map(listener => listener)
        ));

      for (var i = 0; i < clone.length; i++) {
        for (var n = clone[i].length - 1; n >= 0; n--) {
          if (clone[i][n].attached) clone[i][n].handleUpdate(item.value)
        }
      }
    }
  }
}
