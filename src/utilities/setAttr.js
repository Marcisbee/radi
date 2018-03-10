import { setStyle } from './setStyle';

export const setAttr = (radiInstance, view, arg1, arg2) => {
  const el = getEl(view);

  if (typeof arg2 === 'undefined') {
    for (const key in arg1) {
      setAttr(radiInstance, el, key, arg1[key]);
    }
    return;
  }

  if (arg1 === 'style') {
    setStyle(radiInstance, el, arg2);
    return;
  }

  if (arg1 === 'model' && isWatchable(arg2)) {
    let cache = arg2.get();
    el.value = cache;

    el.oninput = function () {
      arg2.set(el.value);
      cache = el.value;
      radiInstance.$eventService.emit(arg2.path, el.value);
    };

    radiInstance.$eventService.on(arg2.path, (path, value) => {
      if (value === cache) return false;
      radiMutate(
        () => {
          el.value = value;
        },
        el.key,
        'attr1',
      );
      cache = value;
    });
    return;
  }

  if (isFunction(arg2)) {
    el[arg1] = (e) => {
      arg2.call(self, e);
    };
    return;
  }

  if (isWatchable(arg2)) {
    const temp = arg2.get();
    if (isFunction(temp)) {
      el[arg1] = (e) => {
        arg2.get().call(self, e);
      };
      return;
    }
    let cache = arg2.get();
    if (cache !== false) {
      if (arg1 === 'html') {
        el.innerHTML = arg2;
        return;
      }
      el.setAttribute(arg1, arg2);
    }

    radiInstance.$eventService.on(arg2.path, (path, value) => {
      if (value === cache) return false;
      radiMutate(
        () => {
          if (value === false) {
            el.removeAttribute(arg1);
            return;
          }

          if (arg1 === 'html') {
            el.innerHTML = v;
            return;
          }

          el.setAttribute(arg1, value);
        },
        el.key,
        'attr2',
      );
      cache = value;
    });
    return;
  }

  if (arg1 === 'html') {
    el.innerHTML = arg2;
    return;
  }
  el.setAttribute(arg1, arg2);
}
