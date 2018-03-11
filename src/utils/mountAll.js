/**
 * @param {*} el
 */
const mountAll = (el) => {
  // TODO: Shouldn't el always be a component and isn't children undefined?
  if (typeof el.mount === 'function') el.mount();
  if (!el.children || el.children.length === 0) return;
  for (const child of el.children) {
    mountAll(child);
  }
};

export default mountAll;
