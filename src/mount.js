import {
  fireEvent,
  render,
  evaluate,
} from './html';
import { flatten } from './utils';

/**
 * @param  {*} node
 * @param  {HTMLElement} container
 * @returns {{nodes: Structure[], dom: HTMLElement[]}}
 */
export function mount(node, container) {
  const nodes = flatten([evaluate(node)]);
  const dom = render(nodes, container);

  dom.forEach((item) => {
    container.appendChild(item);
    fireEvent('mount', item);
  });

  return {
    nodes,
    dom,
  };
}
