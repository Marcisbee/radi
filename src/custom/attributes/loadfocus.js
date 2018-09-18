import { customAttribute } from '../../html/customAttribute';

customAttribute('loadfocus', (el) => {
  el.addEventListener('mount', () => el.focus());
});
