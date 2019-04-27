import GLOBALS from '../consts/GLOBALS';
import { events } from './Store';
import { Effect } from './Effect';

/**
 * @param {String} name
 * @returns {Action} Action
 */
export function Action(name) {
  GLOBALS.CURRENT_ACTION += 1;
  const actionEvents = [];
  const id = GLOBALS.CURRENT_ACTION;
  events[id] = [];

  const caller = (...args) => {
    // console.log(`Called action ${name}`, args);
    events[id].forEach((fn) => {
      fn(...args);
    });

    actionEvents.forEach(fn => {
      fn(...args);
    });
  };

  Object.defineProperties(caller, {
    isRadiAction: {
      value: true,
    },
    name: {
      value: name,
    },
    id: {
      value: id,
    },
    effect: {
      value(fn) {
        return Effect(name)
          .use(fn);
      },
    },
    subscribe: {
      value(fn) {
        actionEvents.push(fn);
        return () => {
          const index = actionEvents.indexOf(fn);
          if (index >= 0) {
            actionEvents.splice(index, 1);
          }
        };
      },
    },
  });

  return caller;
}
