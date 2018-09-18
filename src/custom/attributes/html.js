import { customAttribute } from '../../html/customAttribute';

customAttribute('html', (el, value) => {
  el.addEventListener('mount', () => {
    if (el.escape) {
      el.textContent = value;
    } else {
      el.innerHTML = value;
    }
  });
});
