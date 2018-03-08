import { getEl } from "../index";
import { isWatchable } from "../index";
import { radiMutate } from "./radiMutate";
import { isString } from "../index";

export const setStyle = (view, arg1, arg2) => {
  const el = getEl(view);

  if (isWatchable(arg2)) {
    let cache = arg2.get();
    el.style[arg1] = cache;

    this.$e.on(arg2.path, (e, v) => {
      if (v === cache) return false;
      radiMutate(
        () => {
          el.style[arg1] = v;
        },
        el.key,
        "style"
      );
      cache = v;
    });
    return;
  }

  if (arg2 !== undefined) {
    return el.style[arg1] = arg2;
  }

  if (isString(arg1)) {
    return el.setAttribute("style", arg1);
  }

  for (let key in arg1) {
    setStyle.call(this, el, key, arg1[key]);
  }
};
