import { isString } from './index';

const mount = (component, id) => {
  const container = isString(id) ? document.getElementById(id) : id;
  const rendered =
    component instanceof Component ? component.__radi().$render() : component;
  container.appendChild(rendered);
  return rendered;
};

export default mount;
