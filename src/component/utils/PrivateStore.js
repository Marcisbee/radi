import Component from '../Component'

export default class PrivateStore {
  constructor() {
    this.store = {};
  }

  /**
   * @param {string} key
   * @param {Listener} listener
   */
  addListener(key, listener) {
    if (typeof this.store[key] === 'undefined') {
      this.createItemWrapper(key);
    }
    this.store[key].listeners.push(listener);
    listener.handleUpdate(this.store[key].value);

    return listener;
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
      listeners: [],
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
      item.listeners.forEach(listener => listener.handleUpdate(item.value));
    }
  }
}
