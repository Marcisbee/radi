import { EMPTY_NODE, isWatchable } from './index';

export default class Condition {
  constructor(radiInstance, a, e) {
    this.radiInstance = radiInstance;
    this.cases = [{ a, e }];
    this.w = [];
    this.cache = [];
    // TODO: rename: els = elements
    this.els = EMPTY_NODE.cloneNode();

    if (isWatchable(a)) {
      this.w.push(a);
    }
  }

  watch(callback) {
    const radiInstance = this.radiInstance;
    for (let w of this.w) {
      radiInstance.$eventService.on(w.path, (path, value) => {
        callback(value);
      });
    }
  }

  __do() {
    const ret = { id: null };
    for (let i = 0; i < this.cases.length; i++) {
      // c = case, but case is a keyword
      const c = this.cases[i];
      const a = isWatchable(c.a) // eslint-disable-line
        ? c.a.get()
        : c.a;
      if (a) {
        ret.id = i;
        ret.r = c.e;
        break;
      }
    }
    if (typeof ret.r === 'undefined') ret.r = this.els;
    return ret;
  };

  elseif(a, e) {
    this.cases.push({ a, e });
    if (isWatchable(a)) {
      this.w.push(a);
    }
    return this;
  }

  cond(...args) {
    return this.elseif(args);
  }

  else(e) {
    this.els = e;
    return this;
  }
}
