import clone from './utilities/clone';
import arrayMods from './utilities/arrayMods';
import PopulateService from './PopulateService';

// TODO: Bring back multiple watcher sets
export default class Watcher {
  constructor(radiInstance, target, prop, path) {
    this.radiInstance = radiInstance;
    this.target = target;
    this.prop = prop;
    this.path = path;
    this.oldVal = target[prop];
    this.prev =
      typeof Object.getOwnPropertyDescriptor(target, prop) !== 'undefined'
        ? Object.getOwnPropertyDescriptor(target, prop).set
        : null;
  }

  watch() {
    const setter = this.getSetter();

    if (Array.isArray(this.oldVal)) arrayMods(this.oldVal, setter);

    if (delete this.target[this.prop]) {
      Object.defineProperty(this.target, this.prop, {
        get: () => {
          return this.oldVal;
        },
        set: setter,
        enumerable: true,
        configurable: true,
      });
    }
  }

  getSetter() {
    const self = this;
    const setter = function (newVal) {
      if (self.oldVal === newVal) return false;

      const originalOldVal = self.oldVal;
      let result = newVal;

      if (Array.isArray(self.oldVal) && this && this.constructor === String) {
        result = Array.prototype[this].apply(self.oldVal, arguments);
      }

      self.oldVal = clone(newVal);

      new PopulateService(self, self.oldVal, self.path).populate();
      console.log(self.path, self.oldVal)
      self.radiInstance.$eventService.emit(self.path, self.oldVal);

      if (typeof self.prev === 'function') self.prev(newVal);

      return result;
    };

    return setter;
  }
}
