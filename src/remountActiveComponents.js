import GLOBALS from './consts/GLOBALS';

const remountActiveComponents = () => {
  for (let component of GLOBALS.ACTIVE_COMPONENTS) {
    if (typeof component.onMount === 'function') {
      component.onMount(component);
    }
  }
};

export default remountActiveComponents;
