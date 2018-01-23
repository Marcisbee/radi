const { mount } = require('../../src/index.js');

var main = require('./app');

var app = mount(new main(), 'app');

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    // Before restarting the app, we create a new root element and dispose the old one
    app.destroy();
  });
}
