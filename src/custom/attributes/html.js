import { customAttribute } from '../../html/customAttribute';

customAttribute('html', (el, value) => {
  if (el.escape) {
    el.textContent = value;
  } else {
    el.innerHTML = value;
  }
});
