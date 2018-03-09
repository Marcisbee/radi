export const createElement = (query, namespace) => {
  return namespace
    ? document.createElementNS(namespace, query)
    : document.createElement(query);
};
