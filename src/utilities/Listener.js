import clone from './clone';

export default class Listener {
  constructor(radiInstance, key, childPath) {
    this.radiInstance = radiInstance;
    this.key = key;
    this.childPath = childPath;
    this.value = null;
    this.changeListeners = [];

    this.radiInstance.addListener(key, this);
    this.handleUpdate(this.radiInstance[this.key]);
  }

  handleUpdate(value) {
    this.value = this.getShallowValue(value);
    for (let changeListener of this.changeListeners) {
      changeListener(value);
    }
  }

  onValueChange(changeListener) {
    this.changeListeners.push(changeListener);
    changeListener(this.value);
  }

  getShallowValue(value) {
    const cloned = clone(value);
    if (!this.childPath) return cloned;
    const pathNesting = this.childPath.split('.');
    let shallowValue = cloned;
    for (let pathNestingLevel of pathNesting) {
      shallowValue = shallowValue[pathNestingLevel];
    }
    return shallowValue;
  }
}
