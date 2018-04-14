/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */

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
    this.disabled = false;

    this.component.addListener(this.key, this);
    if (this.component.state) {
      this.handleUpdate(this.component.state[this.key]);
    }
  }

  /**
   * @param {*} value
   * @return {*}
   */
  extract(value) {
    if (value.value instanceof Listener) {
      value.value.disabled = true;
      return this.extract(value.value);
    }
    return value;
  }

  /**
   * @param {*} value
   */
  handleUpdate(value) {
    // TODO: Destroy unnecessary listeners
    this.value = this.processValue(this.getShallowValue(value), this.value);

    if (this.disabled) {
      if (typeof this.disabled === 'function') this.disabled(this.value);
      return this.value;
    }
    if (this.value instanceof Listener) {
      if (this.value.disabled) return this.value;
      this.value = this.extract(this.value);
      this.value.disabled = (value) => {
        this.changeListeners.forEach(changeListener => changeListener(value));
      };
    }

    this.changeListeners.forEach(changeListener => changeListener(this.value));
    return this.value;
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
