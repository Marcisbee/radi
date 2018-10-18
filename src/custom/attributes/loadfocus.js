import { customAttribute } from '../../html/customAttribute';

customAttribute('loadfocus', (el) => {
  el.addEventListener('mount', () =>
    setTimeout(() => el.focus(), 0)
  );
});
