/** @jsx r **/
const { r, l, component, cond } = require('../../../src/index.js');

const state = {
  name: 'Marcis',
  newname: 'John',
}

const actions = {
  onMount() {
    // Do something
  },
  rename(name) {
    this.name = name
  },
}

const view = function () {
  var name = l(this.name);

  return (
    <div>
      <h2>{ l(name) }</h2>
      <label>
        <strong>New name:</strong>
        <input type="text" model={ l(this.newname) }/>
      </label>
      <button onclick={ () => { this.rename(this.newname) } }>Change</button>
    </div>
  )
}

export default component({
  name: 'index',
  view: view,
  state: state,
  actions: actions,
})
