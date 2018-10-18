import { flatten } from '../utils';

/**
 * @typedef {Object} Node
 * @property {*} type
 * @property {Object} props
 * @property {*[]} children
 */

/**
 * @param  {*} preType
 * @param  {Object} preProps
 * @param  {*[]} preChildren
 * @return {Node}
 */
export function html(preType, preProps, ...preChildren) {
  let type = (typeof preType === 'number') ? `${preType}` : preType;
  let props = preProps || {};
  const children = flatten(preChildren);

  if (type instanceof Promise || (type && type.constructor.name === 'LazyPromise')) {
    type = 'await';
    props = {
      src: preType,
    };
  }

  return {
    type,
    props,
    children,
  };
}
