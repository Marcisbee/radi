export const unmountAll = el => {
  if (typeof el.unmount === "function") el.unmount();
  if (el.children && el.children.length > 0) {
    for (var i = 0; i < el.children.length; i++) {
      unmountAll(el.children[i]);
    }
  }
};
