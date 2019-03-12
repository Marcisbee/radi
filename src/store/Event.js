import { Action } from './Action';

/**
 * @param {String} name
 * @param {EventDispatcher} target
 * @returns {Event} Event
 */
export function Event(name, target = window) {
  const eventNames = [];
  const action = Action(name);

  function handler(...args) {
    return action(...args);
  }

  Object.defineProperties(action, {
    on: {
      value(nameChunks) {
        nameChunks
          .split(' ')
          .forEach((eventName) => {
            target.addEventListener(eventName, handler, false);
            eventNames.push(eventName);
          });
        return action;
      },
    },
    off: {
      value(nameChunks) {
        nameChunks
          .split(' ')
          .forEach((eventName) => {
            const index = eventNames.indexOf(eventName);
            if (index >= 0) {
              target.removeEventListener(eventName, handler, false);
              eventNames.splice(eventName);
            }
          });
        return action;
      },
    },
  });

  return action;
}
