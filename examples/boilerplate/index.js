const { mount, r } = require('../../src/index.js');

import main from './app';

var app = mount(new main(), 'app');

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    // Before restarting the app, we create a new root element and dispose the old one
    app.destroy();
  });
}
