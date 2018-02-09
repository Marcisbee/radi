/** @jsx r **/
const { r, l, component, cond } = require('../../../src/index.js');

const view = function () {
  var name = l(this.name);

  return (
    <div>
      <h4>This is FOO</h4>
    </div>
  )
}

export default component({
  name: 'foo',
  view: view,
})
