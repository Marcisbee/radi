import { Await } from '../custom/tags';
import { flatten } from '../utils';

/**
 * @typedef {Object} Node
 * @property {string|function} query
 * @property {{}} props
 * @property {*[]} children
 */

/**
 * @param  {*} preQuery
 * @param  {{}} preProps
 * @param  {*[]} preChildren
 * @return {Node}
 */
export function html(preQuery, preProps, ...preChildren) {
  let query = (typeof preQuery === 'number') ? `${preQuery}` : preQuery;
  let props = preProps || {};
  const children = flatten(preChildren);

  if (query instanceof Promise || (query && query.constructor.name === 'LazyPromise')) {
    query = Await;
    props = {
      src: preQuery,
    };
  }

  return {
    query,
    props,
    children,
  };
}
