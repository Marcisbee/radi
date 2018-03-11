export default class PrivateStore {
  /**
   * @constructor
   */
  constructor() {
    this.store = {};
  }

  /**
   * setItem
   * @param {string} key
   * @param {any} value
   * @return {any}
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
   */
  getItem(key) {
    return this.store[key].value;
  }

  /**
   * addListener
   * @param {string} key
   * @param {Listener} listener
   */
  addListener(key, listener) {
    this.store[key].listeners.push(listener);
  }

  /**
   * createItemWrapper
   * @private
   * @param {string} key
   */
  createItemWrapper(key) {
    this.store[key] = {
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
