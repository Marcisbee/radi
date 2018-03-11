const unmountAll = (el) => {
  if (typeof el.unmount === 'function') el.unmount();
  if (!el.children || el.children.length === 0) return;
  for (const child of el.children) {
    unmountAll(child);
  }
};

export default unmountAll;
