import { errorsStore } from '../attributes';
import { customTag, html } from '../../html';

customTag('errors',
  function Errors({name, onrender = (e) => (e)}) {
    const state = errorsStore.state;

    if (typeof name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <errors> tag needs to have `name` attribute!');
    }
    if (typeof onrender !== 'function') {
      console.warn('[Radi.js] Warn: Every <errors> tag needs to have `onrender` attribute!');
    }

    return html(() => state[name] && onrender(state[name]));
  }
);
