import { customAttribute } from '../../html/customAttribute';

customAttribute('html', (el, value) => {
  const insert = () => {
    if (el.escape) {
      el.textContent = value;
    } else {
      el.innerHTML = value;
    }
  };
  el.addEventListener('mount', insert);
  el.addEventListener('update', insert);
});
