/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
import fuseDom from '../r/utils/fuseDom';

export default class Listener {
  /**
   * @param {Component} component
   * @param {...string} path
   */
  constructor(component, ...path) {
    this.component = component;
    [this.key] = path;
    this.path = path.slice(1, path.length);
    this.depth = 0;
    this.attached = true;
    this.processValue = value => value;
    this.changeListener = () => {};
  }

  /**
   * Applies values and events to listener
   */
  init() {
    this.value = this.getValue(this.component.state[this.key]);
    this.component.addListener(this.key, this, this.depth);
    this.handleUpdate(this.component.state[this.key]);
  }

  /**
   * Removes last active value with destroying listeners and
   * @param {*} value
   */
  unlink() {
    if (this.value instanceof Node) {
      // Destroy this Node
      fuseDom.destroy(this.value);
    } else
    if (this.value instanceof Listener) {
      // Deattach this Listener
      this.value.deattach();
    }
  }

  /**
   * @param {*} value
   */
  handleUpdate(value) {
    const newValue = this.processValue(this.getValue(value));
    if (this.value instanceof Listener) {
      this.value.processValue = newValue.processValue;
      newValue.deattach();
      this.value.handleUpdate(this.value.component.state[this.value.key]);
    } else {
      this.unlink();
      this.value = newValue;
      this.changeListener(this.value);
    }
  }

  /**
   * @param {*} source
   * @returns {*}
   */
  getValue(source) {
    let i = 0;
    while (i < this.path.length) {
      source = source[this.path[i++]];
    }
    return source;
  }

  /**
   * @param {number} depth
   * @returns {Listener}
   */
  applyDepth(depth) {
    this.depth = depth;
    return this;
  }

  /**
   * @param {function(*)} changeListener
   */
  onValueChange(changeListener) {
    this.changeListener = changeListener;
    this.changeListener(this.value);
  }

  /**
   * @param {function(*): *} processValue
   * @returns {function(*): *}
   */
  process(processValue) {
    this.processValue = processValue;
    return this;
  }

  deattach() {
    this.component = null;
    this.attached = false;
    this.key = null;
    this.childPath = null;
    this.path = null;
    this.unlink();
    this.value = null;
    this.changeListeners = [];
    this.processValue = () => {};
  }
}
