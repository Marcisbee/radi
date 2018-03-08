export const mountAll = el => {
  if (typeof el.mount === "function") el.mount();
  if (el.children && el.children.length > 0) {
    for (var i = 0; i < el.children.length; i++) {
      mountAll(el.children[i]);
    }
  }
};
