export default class Listener {
  /**
   * @param {Component} component
   * @param {...string} path
   */
  constructor(component, ...path) {
    this.component = component;
    [this.key] = path;
    this.childPath = path.slice(1, path.length);
    this.value = null;
    this.changeListeners = [];
    this.processValue = value => value;

    this.component.addListener(this.key, this);
    this.handleUpdate(this.component[this.key]);
  }

  /**
   * @param {*} value
   */
  handleUpdate(value) {
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
