const extract = form => {
  const data = {};
  const inputs = form.elements || [];
  for (const input of inputs) {
    if ((input.name !== ''
      && (input.type !== 'radio' && input.type !== 'checkbox'))
      || input.checked) {
      data[input.name] = input.value;
    }
  }

  return data;
};

const findButton = elements => {
  let button = null
  for (const input of elements) {
    if (input.submitButton) button = input;
  }

  return button;
}

export default function validate(_radi) {

  class Errors extends _radi.Component {
    state() {
      return {

      }
    }

    add(name, errors) {
      let newState = this.setState({
        [name]: errors,
      });
      this.trigger('update:' + name, errors);
      return newState;
    }

    remove(name) {
      return this.add(name, []);
    }
  }

  let $errors = _radi.headless('errors', Errors)

  _radi.customTag('errors',
    (props, children, buildNode, save) => {
    let output = buildNode(null);

    $errors.on('update:' + props.name, err => {
      let nomalizedData;

      if (!err || err.length <= 0) {
        nomalizedData = buildNode(null);
      } else {
        nomalizedData = buildNode(props.onrender(err || []));
      }

      output = _radi.patch(output, nomalizedData, output.html[0].parentNode)[0];
    })

    return output;
  }, () => {});

  _radi.customAttribute('error', (element, value) => {
    element.onerror = errors => $errors.add(value, errors)
    element.onvalid = () => $errors.remove(value)
  }, {
    allowedTags: ['form'],
    addToElement: false,
  });

  _radi.customAttribute('validate-submit', (element, props) => {
    element.submitButton = true;
  }, {
    allowedTags: ['button'],
  });

  _radi.customAttribute('validate', (element, props) => {
    let form = element.form;
    let button = null;

    const doValidation = e => {
      if (!form) form = element.form;
      if (form && typeof form.onvalidate === 'function') {
        button = findButton(form.elements);
        let inputs = extract(form);
        let output = form.onvalidate(form);
        let touched = form.touched || [];

        if (output) {
          if (typeof output === 'object') {
            let failed = [];
            for (var input in output) {
              if (output.hasOwnProperty(input)) {
                if (typeof output[input] === 'function') {
                  let validated = output[input](inputs[input]);
                  if (typeof validated === 'string' && touched.indexOf(input) < 0) {
                    failed.push({
                      field: input,
                      reason: null,
                    });
                  } else
                  if (typeof validated === 'string') {
                    failed.push({
                      field: input,
                      reason: validated || null,
                    });
                  }
                }
              }
            }

            if (failed.length > 0) {
              if (button) button.disabled = true;
              if (typeof form.onerror === 'function') {
                form.onerror(failed.filter(v => v.reason));
              }
              return;
            }
          }

          if (button) button.disabled = false;
          if (form && typeof form.onvalid === 'function') {
            form.onvalid();
          }
          return;
        }
      }

      if (button) button.disabled = true;
      if (form && typeof form.onerror === 'function') {
        form.onerror(null);
      }
      return;
    };

    element.addEventListener('change', e => {
      if (form) {
        let name = element.name;
        if (typeof form.touched === 'undefined') {
          form.touched = [];
        }
        if (form.touched.indexOf(name) < 0) {
          form.touched.push(element.name);
          doValidation(e);
        }
      }
    });
    element.addEventListener('input', doValidation);

    return true;
  }, {
    allowedTags: [
      'input',
      'textarea',
      'select',
    ],
  })
}
