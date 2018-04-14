import Component from './component/Component';

/**
 * @param {Component} component
 * @param {string} id
 * @returns {HTMLElement|Node}
 */
const mount = (component, id) => {
  const container = document.createDocumentFragment()
  const slot = typeof id === 'string' ? document.getElementById(id) : id;
  const rendered =
    (component instanceof Component || component.render) ? component.render() : component;

  if (Array.isArray(rendered)) {
    for (var i = 0; i < rendered.length; i++) {
      mount(rendered[i], container)
    }
  } else {
    // Mount to container
    container.appendChild(rendered);
  }

  // Mount to element
  slot.appendChild(container);

  if (typeof component.mount === 'function') component.mount();

  return rendered;
}

export default mount;
