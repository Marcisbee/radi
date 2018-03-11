import GLOBALS from '../consts/GLOBALS';

const remountActiveComponents = () => {
  for (let key in GLOBALS.ACTIVE_COMPONENTS) {
    const component = GLOBALS.ACTIVE_COMPONENTS[key];
    if (typeof component.onMount === 'function') {
      component.onMount(component);
    }
  }
};

export default remountActiveComponents;
