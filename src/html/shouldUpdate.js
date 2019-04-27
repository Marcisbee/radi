import GLOBALS from '../consts/GLOBALS';

/**
 * @param  {Function} fn
 * @return {Function}
 */
export function shouldUpdate(fn) {
  const component = GLOBALS.CURRENT_COMPONENT;

  if (component && component.source) {
    component.source.shouldUpdate = fn;
  }

  return fn;
}
