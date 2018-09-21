import GLOBALS from '../consts/GLOBALS';
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

  if (type instanceof Promise) {
    type = 'await';
    props = {
      src: preType,
    };
  }

  if (typeof GLOBALS.CUSTOM_TAGS[type] !== 'undefined') {
    type = GLOBALS.CUSTOM_TAGS[type].render;
  }

  return {
    type,
    props,
    children,
  };
}
