import { errorsStore } from '../attributes';
import { customTag } from '../../html';

customTag('errors',
  function Errors({name, onrender}) {
    if (typeof name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <errors> tag needs to have `name` attribute!');
    }
    if (typeof onrender === 'function') {
      console.warn('[Radi.js] Warn: Every <errors> tag needs to have `onrender` attribute!');
    }

    return errorsStore(state => (
      state[name] && onrender(state[name])
    ))
  }
);
