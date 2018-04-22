import nodeResolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';

export default {
  plugins: [
    nodeResolve(),
    // TODO: Figure out why errors happen when buble is enabled
    // buble({
    //   transforms: { forOf: false }
    // })
  ]
};
