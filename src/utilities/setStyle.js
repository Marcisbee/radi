import { getEl } from "../index";
import { isWatchable } from "../index";
import { radiMutate } from "./radiMutate";
import { isString } from "../index";

export const setStyle = (view, arg1, arg2) => {
  var self = this;
  var el = getEl(view);

  if (isWatchable(arg2)) {
    var cache = arg2.get();
    el.style[arg1] = cache;

    // Update bind
    (function(cache, arg1, arg2) {
      self.$e.on(arg2.path, function(e, v) {
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
    })(cache, arg1, arg2);
  } else if (arg2 !== undefined) {
    el.style[arg1] = arg2;
  } else if (isString(arg1)) {
    el.setAttribute("style", arg1);
  } else {
    for (var key in arg1) {
      setStyle.call(this, el, key, arg1[key]);
    }
  }
};
