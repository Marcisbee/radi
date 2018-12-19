import { customAttribute } from '../../html/customAttribute';

/** Example usage:
  const fade = {
    in: (el) => el.animate({
      opacity: [0, 1],
      transform: ['scale(0.5)', 'scale(1)'],
    }, {
      duration: 200,
      iterations: 1
    }),

    out: (el, done) => el.animate({
      opacity: [1, 0],
      transform: ['scale(1)', 'scale(0.5)'],
    }, {
      duration: 200,
      iterations: 1
    }).onfinish = done,
  };


  <div animation={fade}></div>
 */

export const animate = (target, type, opts, done) => {
  const direct = opts[type];
  if (typeof direct !== 'function') {
    console.warn(`[Radi.js] Animation \`${type}\` for node \`${target.nodeName.toLowerCase}\` should be function`);
    return null;
  }

  return direct(target, done);
};

customAttribute('animation', (el, value) => {
  el.addEventListener('mount', () => {
    animate(el, 'in', value, () => {});
  });
  el.beforedestroy = done => animate(el, 'out', value, done);
});
