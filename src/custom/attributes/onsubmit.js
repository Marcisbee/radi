import { formToJSON } from '../../utils';
import { customAttribute } from '../../html/customAttribute';

customAttribute('onsubmit', (el, fn) => {
  return function(e) {
    if (el.prevent) e.preventDefault();
    fn(e, formToJSON(el.elements || {}));
  }
}, {
  allowedTags: [
    'form',
  ],
  addToElement: true,
});
