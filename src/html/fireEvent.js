
/**
 * @param  {string} type
 * @param  {HTMLElement} $node
 * @return {HTMLElement}
 */
export function fireEvent(type, $node) {
  const onEvent = document.createEvent('Event');
  onEvent.initEvent(type, true, true);

  if ($node && typeof $node.dispatchEvent === 'function') {
    $node._eventFired = true;
    $node.dispatchEvent(onEvent);
  }

  return $node;
}
