import GLOBALS from '../consts/GLOBALS';
import { events } from './Store';
import { Action } from './Action';

/**
 * @param {String} name
 * @param {Function} effect
 * @returns {Effect} Effect
 */
export function Effect(name, effect) {
  GLOBALS.CURRENT_ACTIION += 1;
  const effectEvents = [];
  const id = GLOBALS.CURRENT_ACTIION;
  let status = 'idle';

  events[id] = [];

  const done = Action(`${name} done`);
  const fail = Action(`${name} fail`);

  const caller = (...args) => {
    status = 'loading';
    // console.log(`Called effect ${name}`, args);
    events[id].forEach((fn) => {
      fn(...args);
    });

    effectEvents.forEach(fn => {
      fn({ params: args });
    });

    effect(...args)
      .then((result) => {
        status = 'done';
        // console.log('DONE', result);
        const output = { result, params: args };
        done(output);
        effectEvents.forEach((fn) => fn(output));
      })
      .catch((error) => {
        status = 'fail';
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
