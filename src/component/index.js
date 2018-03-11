import Component from './ComponentClass';

const component = o => class {
  constructor() {
    return new Component(o);
  }
};

export default component;
