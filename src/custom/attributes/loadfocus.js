import { customAttribute } from '../../html/customAttribute';

customAttribute('loadfocus', (el, props) => {
  el.addEventListener('mount', () => el.focus());
});
