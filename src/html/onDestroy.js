import GLOBALS from '../consts/GLOBALS';

/**
 * @param  {Function} fn
 * @return {Function}
 */
export function onDestroy(fn) {
  const component = GLOBALS.CURRENT_COMPONENT;

  if (component && component.source) {
    component.source.onDestroy = fn;
  }

  return fn;
}
