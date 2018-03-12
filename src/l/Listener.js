import clone from '../utils/clone';

export default class Listener {
  /**
   * @param {Component} component
   * @param {...string} path
   */
  constructor(component, ...path) {
    this.component = component;
    this.key = path[path.length - 1];
    this.childPath = path.slice(0, path.length - 1);
    this.value = null;
    this.changeListeners = [];

    this.component.addListener(this.key, this);
    this.handleUpdate(this.component[this.key]);
  }

  /**
   * @param {*} value
   */
  handleUpdate(value) {
    this.value =
      this.childPath.length !== 0 ? this.getShallowValue(value) : value;
    for (const changeListener of this.changeListeners) {
      changeListener(value);
    }
  }

  /**
   * @param {function(*)} changeListener
   */
  onValueChange(changeListener) {
    this.changeListeners.push(changeListener);
    changeListener(this.value);
  }

  /**
   * @private
   * @param {*} value
   */
  getShallowValue(value) {
    const cloned = clone(value);
    let shallowValue = cloned;
    for (const pathNestingLevel of this.childPath) {
      shallowValue = shallowValue[pathNestingLevel];
    }
    return shallowValue;
  }
}
