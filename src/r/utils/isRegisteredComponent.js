import GLOBALS from '../../consts/GLOBALS';

/**
 * @param {string} id
 * @returns {boolean}
 */
const isRegisteredComponent = (id) => {
  if (typeof id !== 'string') return false;
  return typeof GLOBALS.REGISTERED[id] !== 'undefined';
};

export default isRegisteredComponent;
