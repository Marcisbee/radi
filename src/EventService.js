import { GLOBALS } from './consts/GLOBALS';

export default class EventService {
  constructor() {
    this.WATCH = {};
  }

  get(path) {
    return this.WATCH[path] || (this.WATCH[path] = []);
  }

  on(path, callback) {
    if (GLOBALS.FROZEN_STATE) return null;
    return this.get(path).push(callback);
  }

  emit(path, value) {
    if (GLOBALS.FROZEN_STATE) return null;
    const list = this.get(path);
    list.forEach(callback => callback(path, value));
  }
}
