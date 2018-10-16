import { flatten } from './flatten';

/**
 * @param {*[]} list
 * @returns {*[]}
 */
export function ensureArray(list) {
  return flatten([list]);
}
