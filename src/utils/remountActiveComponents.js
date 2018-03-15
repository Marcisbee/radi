import GLOBALS from '../consts/GLOBALS';

const remountActiveComponents = () => {
  Object.keys(GLOBALS.ACTIVE_COMPONENTS).forEach(component => {
    if (typeof component.onMount === 'function') {
      component.onMount(component);
    }
  });
};

export default remountActiveComponents;
