import Component from './ComponentClass';

const component = (o) => {
  return class {
    constructor() {
      const c = new Component(o)
      return c;
    }
  };
}

export default component;
