import { errorsStore } from '../attributes';

export function Errors({ name, onrender = (e) => (e) }) {
  const state = errorsStore.state;

  if (typeof name === 'undefined') {
    console.warn('[Radi.js] Warn: Every <errors> tag needs to have `name` attribute!');
  }
  if (typeof onrender !== 'function') {
    console.warn('[Radi.js] Warn: Every <errors> tag needs to have `onrender` attribute!');
  }

  if (!state[name]) {
    return null;
  }

  return onrender(state[name]);
}
