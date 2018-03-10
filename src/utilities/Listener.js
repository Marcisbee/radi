import clone from './clone';

export default class Listener {
  constructor(radiInstance, key, childPath) {
    this.radiInstance = radiInstance;
    this.key = key;
    this.childPath = childPath;
    this.value = null;
    this.changeListener = null;

    this.radiInstance.addListener(key, this);
    this.handleUpdate(this.radiInstance[this.key]);
  }

  handleUpdate(value) {
    this.value = this.getShallowValue(value);
    if (this.changeListener) {
      this.changeListener(value);
    }
  }

  onValueChange(changeListener) {
    this.changeListener = changeListener;
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
