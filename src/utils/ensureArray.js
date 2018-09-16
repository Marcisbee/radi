
/**
 * @param {*[]} list
 * @returns {*[]}
 */
export function ensureArray(list) {
  if (arguments.length === 0) return [];
  if (arguments.length === 1) {
    if (list === undefined || list === null) return [];
    if (Array.isArray(list)) return list;
  }
  return Array.prototype.slice.call(arguments);
}
