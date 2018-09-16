import { flatten } from '../utils';

/**
 * @typedef {Object} Node
 * @property {*} type
 * @property {Object} props
 * @property {*[]} children
 */

/**
 * @param  {*} type
 * @param  {Object} props
 * @param  {*[]} children
 * @return {Node}
 */
export function html(type, props, ...children) {
  return {
    type: (typeof type === 'number') ? `${type}` : type,
    props: props || {},
    children: flatten(children),
  };
}
