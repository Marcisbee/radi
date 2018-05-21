const mount = require('../../src/mount.js').default;

const main = require('./app');

const app = mount(new main(), 'app');

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    // Before restarting the app, we create a new root element and dispose the old one
    app.destroy();
  });
}
