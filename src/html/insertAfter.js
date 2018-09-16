
/**
 * @param  {HTMLElement} newNode
 * @param  {HTMLElement} $reference
 * @param  {HTMLElement} $parent
 * @return {HTMLElement}
 */
export function insertAfter(newNode, $reference, $parent) {
  if (!$parent) $parent = $reference.parentNode;

  if (newNode instanceof Node) {
    if ($reference === null || $reference === undefined) {
      return $parent.insertBefore(newNode, $reference);
    }

    if ($reference instanceof Node) {
      return $parent.insertBefore(newNode, $reference.nextSibling);
    }
  }

  return newNode;
}
