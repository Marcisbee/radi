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
    this.childPath = path.slice(1, path.length);
    this.path = path;
    this.value = null;
    this.changeListeners = [];
    this.processValue = value => value;
    this.attatched = true;

    this.component.addListener(this.key, this);
    if (this.component.state) {
      this.handleUpdate(this.component.state[this.key]);
    }
  }

  deattach() {
    this.component = null;
    this.attatched = false;
    this.key = null;
    this.childPath = null;
    this.path = null;
    this.value = null;
    this.changeListeners = [];
    this.processValue = () => {};
  }

  /**
   * @param {*} value
   */
  handleUpdate(value) {
    if (this.value instanceof Node) {
      fuseDom.destroy(this.value);
      this.value = null;
    }
    this.value = this.processValue(this.getShallowValue(value), this.value);
    this.changeListeners.forEach(changeListener => changeListener(this.value));
  }

  /**
   * @param {function(*)} changeListener
   */
  onValueChange(changeListener) {
    this.changeListeners.push(changeListener);
    changeListener(this.value);
  }

  /**
   * @param {function(*): *} processValue
   * @returns {function(*): *}
   */
  process(processValue) {
    this.processValue = processValue;
    this.handleUpdate(this.value);
    return this;
  }

  /**
   * @private
   * @param {*} value
   */
  getShallowValue(value) {
    if (typeof value !== 'object' || !this.childPath) return value;
    let shallowValue = value;
    /*eslint-disable*/
    for (const pathNestingLevel of this.childPath) {
      if (shallowValue === null
        || !shallowValue[pathNestingLevel]
        && typeof shallowValue[pathNestingLevel] !== 'number') {
        shallowValue = null
      } else {
        shallowValue = shallowValue[pathNestingLevel]
      }
    }
    return shallowValue;
  }
}
