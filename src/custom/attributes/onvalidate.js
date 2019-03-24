import { Store, Action } from '../../store';
import { customAttribute } from '../../html/customAttribute';
import { formToJSON } from '../../utils';

const setErrors = Action('Set Errors');

export const errorsStore = Store({}, null)
  .on(setErrors, (state, name, errors) => ({
    ...state,
    [name]: errors,
  }));

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
  const values = formToJSON(elements, ({ touched }, value) => ({ touched, value }));
  const plainValues = Object.keys(values)
    .reduce((acc, key) => ({
      ...acc,
      [key]: extractValue(values[key]),
    }), {});
  const errors = [];

  for (const name in values) {
    const value = values[name];

    if (typeof rules[name] === 'function') {
      const result = rules[name](extractValue(value), plainValues);
      const valid = (
        result
          && typeof result.check === 'function'
          && result.check()
      )
        || result
        || `${name} field is invalid`;

      if (valid !== true) {
        errors.push({
          field: name,
          touched: Boolean(extractTouched(value, elements[name])),
          error: valid,
        });
      }
    }
  }

  update(errors);
}

let formCount = 0;

const ruleMemo = {};

customAttribute('onvalidate', (el, rules) => {
  const formName = el.getAttribute('name') || `defaultForm${formCount++}`;
  let submit;

  if (typeof rules === 'function') {
    ruleMemo[formName] = rules;
  }

  function update(errors) {
    const currentErrors = errorsStore.getRawState()[formName] || [];

    if (JSON.stringify(errors) === JSON.stringify(currentErrors)) return;

    setErrors(formName, errors);
  }

  errorsStore.subscribe(state => {
    if (submit) {
      submit.disabled = state[formName].length > 0;
    }
  });

  const runValidation = e => {
    const rule = ruleMemo[formName];
    if (typeof rule !== 'function') return;
    const validate = rule(e);
    const { elements } = el;
    if (validate && typeof validate === 'object' && elements) {
      for (const element of elements) {
        const { name } = element;

        if (!element.__radiValidate
          && typeof name === 'string'
          && typeof validate[name] === 'function') {
          element.addEventListener('input', () => {
            fullValidate(
              elements,
              validate,
              update
            );
          });
          element.__radiValidate = true;

          element.touched = false;
          const setTouched = ({ target }) => {
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
  };

  el.addEventListener('patch', runValidation);
  el.addEventListener('mount', runValidation, false);
}, {
  allowedTags: [
    'form',
  ],
});
