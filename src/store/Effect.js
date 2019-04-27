import GLOBALS from '../consts/GLOBALS';
import { events, Store } from './Store';
import { Action } from './Action';

/**
 * @param {String} name
 * @param {Function} effect
 * @returns {Effect} Effect
 */
export function Effect(name) {
  GLOBALS.CURRENT_ACTION += 1;
  const effectEvents = [];
  const id = GLOBALS.CURRENT_ACTION;
  let status = 'idle';
  const setStatus = (newStatus) => {
    status = newStatus;
  };
  let effect = (e) => Promise.resolve(e);

  events[id] = [];

  const done = Action(`${name} done`);
  const fail = Action(`${name} fail`);

  const caller = (...args) => {
    setStatus('loading');
    // console.log(`Called effect ${name}`, args);
    events[id].forEach((fn) => {
      fn(...args);
    });

    effectEvents.forEach(fn => {
      fn({ params: args });
    });

    effect(...args)
      .then((result) => {
        setStatus('done');
        // console.log('DONE', result);
        const output = { result, params: args };
        done(output);
        effectEvents.forEach((fn) => fn(output));
      })
      .catch((error) => {
        setStatus('fail');
        // console.log('FAIL', error);
        const output = { error, params: args };
        fail(output);
        effectEvents.forEach((fn) => fn(output));
      });
  };

  Object.defineProperties(caller, {
    name: {
      value: name,
    },
    id: {
      value: id,
    },
    use: {
      value(fn) {
        effect = fn;
        return caller;
      },
    },
    done: {
      value: done,
    },
    fail: {
      value: fail,
    },
    status: {
      get() {
        return status;
      },
    },
    statusChange: {
      get() {
        return Store(status)
          .on(caller, () => status)
          .on(done, () => status)
          .on(fail, () => status);
      },
    },
    subscribe: {
      value(fn) {
        effectEvents.push(fn);
        return () => {
          const index = effectEvents.indexOf(fn);
          if (index >= 0) {
            effectEvents.splice(index, 1);
          }
        };
      },
    },
  });

  return caller;
}
