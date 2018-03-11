import Component from './ComponentClass';

const component = (o) => {
  return class {
    constructor() {
      return new Component(o);
    }
  };
}

export default component;
