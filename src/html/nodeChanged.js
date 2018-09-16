
/**
 * @param  {Node} node1
 * @param  {Node} node2
 * @return {boolean}
 */
export function nodeChanged(node1, node2) {
  if (node1 === undefined || node2 === undefined) return false;
  if (typeof node1 !== typeof node2) return true;
  if ((typeof node1 === 'string' || typeof node1 === 'number')
    && node1 !== node2) return true;
  if (node1.type !== node2.type) return true;
  if (node1.props) return true;

  return false;
}
