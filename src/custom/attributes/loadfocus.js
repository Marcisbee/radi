import { customAttribute } from '../../html/customAttribute';

export const LoadfocusAttribute = customAttribute('loadfocus', (el, props) => {
  el.addEventListener('mount', () => el.focus());
});
