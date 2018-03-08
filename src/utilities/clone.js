export const clone = obj => {
  let i, ret, ret2;
  if (typeof obj === "object") {
    if (obj === null) return obj;
    if (Object.prototype.toString.call(obj) === "[object Array]") {
      let len = obj.length;
      ret = new Array(len);
      for (i = 0; i < len; i++) {
        if (typeof obj[i] === "object") {
          ret[i] = clone(obj[i]);
        } else {
          ret[i] = obj[i];
        }
      }
    } else {
      ret = {};
      for (i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (typeof (obj[i] === "object")) {
            ret[i] = clone(obj[i]);
          } else {
            ret[i] = obj[i];
          }
        }
      }
    }
  } else {
    ret = obj;
  }

  return ret;
};
