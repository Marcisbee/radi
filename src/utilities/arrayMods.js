export const arrayMods = (v, s) => {
  if (!Array.isArray(v) || v.__radi) return false;
  return Object.defineProperties(v, {
    __radi: { value: true },
    reverse: { value: s.bind("reverse") },
    push: { value: s.bind("push") },
    splice: { value: s.bind("splice") },
    pop: { value: s.bind("pop") },
    shift: { value: s.bind("shift") }
  });
};
