import GLOBALS from '../consts/GLOBALS';

const register = (Component) => {
  const component = new Component();
  const { name } = component;

  if (!name) {
    console.warn('[Radi.js] Warn: Cannot register component without name');
    return;
  }

  if (typeof GLOBALS.REGISTERED[name] !== 'undefined') {
    console.warn(`[Radi.js] Warn: Component with name '${name}' being replaced`);
  }

  GLOBALS.REGISTERED[name] = component;
};

export default register;
