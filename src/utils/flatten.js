
/**
 * @param {*[]} list
 * @returns {*[]}
 */
export function flatten(list) {
  return list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
}
