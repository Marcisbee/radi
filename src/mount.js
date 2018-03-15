import Component from './component/Component';

/**
 * @param {Component} component
 * @param {string} id
 * @returns {HTMLElement|Node}
 */
const mount = (component, id) => {
  const container = typeof id === 'string' ? document.getElementById(id) : id;
  const rendered =
    component instanceof Component ? component.render() : component;
  container.appendChild(rendered);
  return rendered;
};

export default mount;
