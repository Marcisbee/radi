export const arrayMods = (arr, fn) => {
  if (!Array.isArray(arr) || arr.__radi) return false;
  return Object.defineProperties(arr, {
    __radi: { value: true },
    reverse: { value: fn.bind("reverse") },
    push: { value: fn.bind("push") },
    splice: { value: fn.bind("splice") },
    pop: { value: fn.bind("pop") },
    shift: { value: fn.bind("shift") }
  });
};
