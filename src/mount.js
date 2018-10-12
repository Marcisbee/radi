import { patch } from './html/patch';

/**
 * @typedef {Object} Mount
 * @property {Object} component
 * @property {Object} node
 * @property {function} destroy
 */

/**
 * @param  {Object} component
 * @param  {HTMLElement} container
 * @return {Mount}
 */
export function mount(component, container) {
  return {
    component: component,
    node: patch(container, component),
    destroy: () => {
      return patch(container, null, component);
    },
  };
};
