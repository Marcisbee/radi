import index from '../pages/index.js'
import foo from '../pages/foo.js'

export default () => ({
  routes: {
    '/': index,
    '/foo': foo,
  },
  // beforeEach(from, to) {
  //   console.log('beforeEach', arguments)
  //   if (from === '/foo') {
  //     return false
  //   } else {
  //     return true
  //   }
  // },
  // afterEach(from, to) {
  //   // After
  // },
})
