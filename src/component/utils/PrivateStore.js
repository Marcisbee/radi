export default class PrivateStore {
  constructor() {
    this.store = {};
  }

  /**
   * setItem
   * @param {string} key
   * @param {*} value
   * @returns {*}
   */
  setItem(key, value) {
    if (typeof this.store[key] === 'undefined') {
      this.createItemWrapper(key);
    }
    this.store[key].value = value;
    this.triggerListeners(key);
    return value;
  }

  /**
   * getItem
   * @param {string} key
   * @returns {*}
   */
  getItem(key) {
    return this.store[key].value;
  }

  /**
   * addListener
   * @param {string} key
   * @param {Listener} listener
   * @returns {Listener}
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
    item.listeners.forEach(listener => listener.handleUpdate(item.value));
  }
}
