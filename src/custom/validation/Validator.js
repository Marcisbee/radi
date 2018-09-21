export class Validator {
  constructor(value) {
    this.value = value;
    this.rules = [];
  }

  register({type, validate, error}) {
    let nn = this.rules.push({
      type: type,
      validate: value => (value && validate(value)),
      error: error || 'Invalid field',
    });

    this.error = text => {
      this.rules[nn - 1].error = text || error;
      return this;
    }

    return this;
  }

  check(newValue) {
    if (typeof newValue !== 'undefined') {
      this.value = newValue;
    }

    return this.rules.reduce((acc, value) => (
      typeof acc === 'string' ? acc : (!value.validate(this.value) && value.error) || acc
    ), true)
  }

  required() {
    return this.register({
      type: 'required',
      validate: value => value !== '',
      error: 'Field is required',
    })
  }

  test(regexp) {
    return this.register({
      type: 'test',
      validate: value => regexp.test(value),
      error: 'Field must be valid',
    })
  }

  equal(equal) {
    return this.register({
      type: 'equal',
      validate: value => value === equal,
      error: 'Field must be equal to ' + equal,
    })
  }

  notEqual(equal) {
    return this.register({
      type: 'notEqual',
      validate: value => value !== equal,
      error: 'Field must not be equal to ' + equal,
    })
  }

  min(num) {
    return this.register({
      type: 'min',
      validate: value => value.length >= num,
      error: 'Min char length is ' + num,
    })
  }

  max(num) {
    return this.register({
      type: 'max',
      validate: value => value.length < num,
      error: 'Max char length is ' + num,
    })
  }

  email() {
    return this.register({
      type: 'email',
      validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      error: 'Email is not valid',
    })
  }
}
