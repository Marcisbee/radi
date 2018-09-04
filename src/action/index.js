// Decorator for actions
const action = (target, key, descriptor) => {
  const fn = descriptor.value;
  return {
    configurable: true,
    value(...args) {
      return this.setState.call(this, fn.call(this, ...args), key);
    },
  };
};

export default action;
