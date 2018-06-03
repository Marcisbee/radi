/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
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
    return this;
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


  clone(target, source) {
    const out = {};

    for (const i in target) {
      out[i] = target[i];
    }
    for (const i in source) {
      out[i] = source[i];
    }

    return out;
  }

  setPartialState(path, value, source) {
    const target = {};
    if (path.length) {
      target[path[0]] =
        path.length > 1
          ? this.setPartialState(path.slice(1), value, source[path[0]])
          : value;
      return this.clone(source, target);
    }
    return value;
  }

  /**
   * Updates state value
   * @param {*} value
   */
  updateValue(value) {
    const source = this.component.state[this.key];
    return this.component.setState({
      [this.key]: this.setPartialState(this.path, value, source),
    });
  }

  /**
   * @param {*} value
   */
  handleUpdate(value) {
    const newValue = this.processValue(this.getValue(value));
    if (this.value instanceof Listener && newValue instanceof Listener) {
      this.value.processValue = newValue.processValue;
      this.value.handleUpdate(this.value.component.state[this.value.key]);
      newValue.deattach();
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
    this.processValue = () => {};
  }
}
