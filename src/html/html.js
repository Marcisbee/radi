import GLOBALS from '../consts/GLOBALS';
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
  let finalType = type;

  if (typeof GLOBALS.CUSTOM_TAGS[type] !== 'undefined') {
    finalType = GLOBALS.CUSTOM_TAGS[type].render;
  }

  return {
    type: (typeof finalType === 'number') ? finalType + '' : finalType,
    props: props || {},
    children: flatten(children),
  };
}
