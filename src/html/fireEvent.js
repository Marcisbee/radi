
/**
 * @param  {string} type
 * @param  {HTMLElement} $node
 * @return {HTMLElement}
 */
export function fireEvent(type, $node, $element = $node) {
  const onEvent = document.createEvent('Event');
  onEvent.initEvent(type, false, true);

  if (typeof $element.dispatchEvent === 'function') {
    $element.dispatchEvent(onEvent);
  }

  return $node;
}
