import Watcher from './Watcher';

export default class PopulateService {
  constructor(radiInstance, to, path) {
    this.radiInstance = radiInstance;
    this.to = to;
    this.path = path;
  }

  populate() {
    if (typeof this.to !== 'object' || !this.to) return false;

    for (let key in this.to) {
      const fullPath = `${this.path}.${key}`;
      const isMixin = this.radiInstance.isMixin(fullPath);
      if (this.shouldPopulateKey(key)) {
        if (typeof this.to[key] === 'object') {
          this.populate(this.to[key], fullPath);
        }
        this.initWatcherForKey(key);
        this.emitEventForKey(key);
        continue;
      }

      if (isMixin) {
        this.initWatcherForKey(key);
      }
    }

    return this.ensurePath();
  }

  shouldPopulateKey(key) {
    return (
      this.to.hasOwnProperty(key) &&
      !Object.getOwnPropertyDescriptor(this.to, key).set
    );
  }

  initWatcherForKey(key) {
    new Watcher(
      this.radiInstance,
      this.to,
      key,
      this.path.concat('.').concat(key)
    ).watch();
  }

  emitEventForKey(key) {
    this.radiInstance.$eventService.emit(`${this.path}.${key}`, this.to[key]);
  }

  ensurePath() {
    if (typeof this.to.__path === 'undefined') {
      Object.defineProperty(this.to, '__path', { value: this.path });
    }
    return this.to;
  }
}
