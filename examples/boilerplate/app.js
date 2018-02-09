/** @jsx r **/
const { r, l, component, mount, use } = require('../../src/index.js');
import router from '../../src/radi-router.js'

const _router = use(router)

import routes from './routes'

window.Router = _router( routes() )

const view = function () {
  return (
    <div>
      <a href="#/">Index</a>
      <br/>
      <a href="#/foo">Foo</a>
      <br/>
      <a href="#/error">Error</a>
      <br/>
      <br/>
      {new Router()}
    </div>
  )
}

const main = component({
  name: 'root',
  view: view,
})

module.exports = main
