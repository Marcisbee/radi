import { getEl, isWatchable, isString } from '../index';
import radiMutate from './radiMutate';

const setStyle = (radiInstance, view, arg1, arg2) => {
  const el = getEl(view);

  if (isWatchable(arg2)) {
    let cache = arg2.get();
    el.style[arg1] = cache;

    radiInstance.$eventService.on(arg2.path, (e, v) => {
      if (v === cache) return false;
      radiMutate(
        () => {
          el.style[arg1] = v;
        },
        el.key,
        'style'
      );
      cache = v;
    });
    return;
  }

  if (arg2 !== undefined) {
    return el.style[arg1] = arg2;
  }

  if (isString(arg1)) {
    return el.setAttribute('style', arg1);
  }

  for (let key in arg1) {
    setStyle(radiInstance, el, key, arg1[key]);
  }
};

export default setStyle;
