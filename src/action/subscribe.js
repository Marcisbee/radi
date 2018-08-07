/* eslint-disable func-names */

// Descriptor for subscriptions
const subscribe = (container, eventName/* , triggerMount */) =>
  // TODO: Remove event after no longer needed / Currently overrides existing
  // TODO: Do not override existing event - use EventListener
  // TODO: triggerMount should trigger this event on mount too
  function (target, key, descriptor) {
    const name = `on${eventName || key}`;
    const fn = function (...args) {
      return descriptor.value.call(this, ...args);
    };

    container[name] = fn;
    // if (container && container.addEventListener) {
    //   container.addEventListener(name, fn);
    //   self.when('destroy', () => {
    //     container.removeEventListener(name, fn);
    //   });
    // }
    // console.log(target, key, descriptor, container[name], name, fn, fn.radiGlobalEvent);
    return descriptor;
  };
export default subscribe;
