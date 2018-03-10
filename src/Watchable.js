export default class Watchable {
  constructor(source, prop, parent) {
    this.path = `${source.__path}.${prop}`;
    this.source = source;
    this.prop = prop;
    this.parent = parent;
  }

  get() {
    return this.source[this.prop];
  }

  set(value) {
    const shallowSource = this.getShallowSource();
    return (shallowSource[this.prop] = value);
  }

  getShallowSource() {
    const pathNesting = this.getPathNesting();
    const source = this.parent();
    let shallowSource = source;
    for (let pathNestingLevel of pathNesting) {
      shallowSource = shallowSource[pathNestingLevel];
    }
    return shallowSource;
  }

  getPathNesting() {
    const path = this.path.split('.');
    return path.slice(1, path.length - 1);
  }
}
