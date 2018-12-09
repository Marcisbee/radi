
/**
 * @param  {string} type
 * @param  {HTMLElement} $node
 * @return {HTMLElement}
 */
export function fireEvent(type, $node, $element = $node) {
  const onEvent = document.createEvent('Event');
  onEvent.initEvent(type, false, true);

  if (typeof $node.dispatchEvent === 'function') {
    $node.dispatchEvent(onEvent, $element);
  }

  return $node;
}
