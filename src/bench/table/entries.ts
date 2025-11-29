export const entries = Object.entries({
  vanilla: () => import("./frameworks/vanilla.tsx"),
  radi: () => import("./frameworks/radi.tsx"),
  // lit: () => import("./frameworks/lit.tsx"),
  preact: () => import("./frameworks/preact.tsx"),
  react: () => import("./frameworks/react.tsx"),
  // marko: () => import("./frameworks/marko.tsx"),
  redom: () => import("./frameworks/redom.tsx"),
});
