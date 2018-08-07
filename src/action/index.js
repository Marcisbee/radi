/* eslint-disable func-names */

const action = (target, key, descriptor) => {
  const act = descriptor.value;
  descriptor.value = function (...args) {
    return this.setState.call(this, act.call(this, ...args));
  };
  return descriptor;
};

export default action;
