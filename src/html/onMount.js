import GLOBALS from '../consts/GLOBALS';

/**
 * @param  {Function} fn
 * @return {Function}
 */
export function onMount(fn) {
  const component = GLOBALS.CURRENT_COMPONENT;

  if (component && component.source) {
    component.source.onMount = fn;
  }

  return fn;
}
