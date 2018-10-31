import { errorsStore } from '../attributes';
import { customTag, html } from '../../html';

customTag('errors',
  function Errors({name, onrender = (e) => (e)}) {
    if (typeof name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <errors> tag needs to have `name` attribute!');
    }
    if (typeof onrender !== 'function') {
      console.warn('[Radi.js] Warn: Every <errors> tag needs to have `onrender` attribute!');
    }

    return errorsStore(state => html(() =>
      state[name] && onrender(state[name])
    ))
  }
);
