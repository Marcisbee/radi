import { customAttribute } from '../../html/customAttribute';
import { formToJSON } from '../../utils';

customAttribute('onsubmit', (el, fn) => (
  (e) => {
    if (el.prevent) e.preventDefault();
    fn(e, formToJSON(el.elements || {}));
  }
), {
  allowedTags: [
    'form',
  ],
  addToElement: true,
});
