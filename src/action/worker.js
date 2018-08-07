/* eslint-disable func-names */

const createWorker = fn => {
  let fire = () => {};

  const blob = new window.Blob([`self.onmessage = function(e) {
    self.postMessage((${fn.toString()})(e.data));
  }`], { type: 'text/javascript' });

  const url = window.URL.createObjectURL(blob);
  const myWorker = new window.Worker(url);

  myWorker.onmessage = e => { fire(e.data, null); };
  myWorker.onerror = e => { fire(null, e.data); };

  return arg => new Promise((resolve, reject) => {
    fire = (data, err) => !err ? resolve(data) : reject(data);
    myWorker.postMessage(arg);
  });
};

// Descriptor for worker
const worker = (target, key, descriptor) => {
  const act = descriptor.value;

  const promisedWorker = createWorker(act);

  descriptor.value = function (...args) {
    promisedWorker(...args).then(newState => {
      this.setState.call(this, newState);
    });
  };
  return descriptor;
};

export default worker;
