import buble from 'rollup-plugin-buble';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  plugins: [
    nodeResolve(),
    buble({
      target: { chrome: 48, firefox: 43, ie: 9 },
      transforms: {
        forOf: false,
      },
      objectAssign: 'Object.assign',
    }),
  ],
};
