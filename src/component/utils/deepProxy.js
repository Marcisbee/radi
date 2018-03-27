export default function deepProxy(target, handler) {
  const preproxy = new WeakMap();

  function makeHandler(path) {
    return {
      set(target, key, value, receiver) {
        if(typeof value === 'object') {
          value = proxify(value, [...path, key]);
        }
        target[key] = value;

        if(handler.set) {
          handler.set(target, [...path, key], value, receiver);
        }
        return true;
      },

      deleteProperty(target, key) {
        if(Reflect.has(target, key)) {
          unproxy(target, key);
          let deleted = Reflect.deleteProperty(target, key);
          if(deleted && handler.deleteProperty) {
            handler.deleteProperty(target, [...path, key]);
          }
          return deleted;
        }
        return false;
      }
    }
  }

  function unproxy(obj, key) {
    if(preproxy.has(obj[key])) {
      // console.log('unproxy',key);
      obj[key] = preproxy.get(obj[key]);
      preproxy.delete(obj[key]);
    }

    for(let k of Object.keys(obj[key])) {
      if(typeof obj[key][k] === 'object') {
        unproxy(obj[key], k);
      }
    }
  }

  function proxify(obj, path) {
    for(let key of Object.keys(obj)) {
      if(typeof obj[key] === 'object') {
        obj[key] = proxify(obj[key], [...path, key]);
      }
    }
    let p = new Proxy(obj, makeHandler(path));
    preproxy.set(p, obj);
    return p;
  }

  return proxify(target, []);
}
