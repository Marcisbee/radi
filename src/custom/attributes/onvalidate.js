import { formToJSON } from '../../utils';
import { customAttribute } from '../../html/customAttribute';
import { Store } from '../../store';

export const errorsStore = new Store({}, 'errorStore');
const setErrors = (state, name, errors) => ({
  ...state,
  [name]: errors,
});

function extractValue(value) {
  return Array.isArray(value)
    ? value.map((arr) => arr.value)
    : value.value;
}

function extractTouched(value, elements) {
  return Array.isArray(value)
    ? [].reduce.call(elements, (acc, val) => (val.touched && true) || acc, false)
    : value.touched;
}

function fullValidate(elements, rules, update) {
  let values = formToJSON(elements, ({touched}, value) => ({touched, value}));
  let plainValues = Object.keys(values)
    .reduce((acc, key) => ({
      ...acc,
      [key]: extractValue(values[key]),
    }), {});
  let errors = [];

  for (let name in values) {
    const value = values[name];

    if (typeof rules[name] === 'function') {
      const result = rules[name](extractValue(value), plainValues);
      const valid = (
          result
          && typeof result.check === 'function'
          && result.check()
        )
        || result
        || name + ' field is invalid';

      if (valid !== true) errors.push({
        field: name,
        touched: Boolean(extractTouched(value, elements[name])),
        error: valid,
      });
    }
  }

  update(errors);
}

let formCount = 0;

customAttribute('onvalidate', (el, rules) => {
  const formName = el.name || 'defaultForm' + (formCount++);
  let submit;

  function update(errors) {
    errorsStore.dispatch(setErrors, formName, errors);
  }

  errorsStore.subscribe(state => {
    if (submit) {
      submit.disabled = state[formName].length > 0;
    }
  });

  el.addEventListener('mount', e => {
    const validate = rules(e);
    const elements = e.target.elements;
    if (validate && typeof validate === 'object'
      && elements) {

      for (let element of elements) {
        const name = element.name;

        if (!element.__radiValidate
          && typeof name === 'string'
          && typeof validate[name] === 'function') {

          element.addEventListener('input', () => {
            fullValidate(
              elements,
              validate,
              update
            );
          })
          element.__radiValidate = true;

          element.touched = false;
          const setTouched = ({target}) => {
            target.touched = true;
            target.removeEventListener('change', setTouched);
            fullValidate(
              elements,
              validate,
              update
            );
          };
          element.addEventListener('change', setTouched);
        }

        if (element.type === 'submit' && element.disabled === true) {
          submit = element;
        }
      }

      fullValidate(
        elements,
        validate,
        update
      );
    }
  }, false);
}, {
  allowedTags: [
    'form',
  ],
});
