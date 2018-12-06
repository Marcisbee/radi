import { customAttribute } from '../../html/customAttribute';

export const animate = (target, type, opts, done) => {
  const direct = opts[type];
  if (typeof direct !== 'function') {
    console.warn(`[Radi.js] Animation \`${type}\` for node \`${target.nodeName.toLowerCase}\` should be function`);
    return null;
  }

  return direct(target, done);
};

customAttribute('animation', (el, value) => {
  animate(el, 'in', value, () => {});
  el.beforedestroy = done => animate(el, 'out', value, done);
});
