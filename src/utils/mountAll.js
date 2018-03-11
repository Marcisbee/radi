const mountAll = (el) => {
  if (typeof el.mount === 'function') el.mount();
  if (!el.children || el.children.length === 0) return;
  for (const child of el.children) {
    mountAll(child);
  }
};

export default mountAll;
