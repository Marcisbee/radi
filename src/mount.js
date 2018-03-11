const mount = (component, id) => {
  const container = typeof id === 'string' ? document.getElementById(id) : id;
  const rendered =
    component instanceof Component ? component.render() : component;
  container.appendChild(rendered);
  return rendered;
};

export default mount;
