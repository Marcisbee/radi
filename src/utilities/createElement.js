export const createElement = (query, ns) => {
  return ns
    ? document.createElementNS(ns, query)
    : document.createElement(query);
};
