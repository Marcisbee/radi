import { set } from './index';

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
    return set(this.path.split('.'), this.parent(), value);
  }
}
