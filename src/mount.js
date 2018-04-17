import Component from './component/Component';
import appendChild from './r/appendChild';
import fuseDom from './r/utils/fuseDom';

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
      mount(rendered[i], container);
    }
  } else {
    // Mount to container
    appendChild(container)(rendered);
  }

  // Mount to element
  slot.appendChild(container);

  if (typeof slot.destroy !== 'function') {
    slot.destroy = () => {
      for (var i = 0; i < rendered.length; i++) {
        fuseDom.destroy(rendered[i]);
      }
    }
  }

  if (typeof component.mount === 'function') component.mount();

  return slot;
}

export default mount;
