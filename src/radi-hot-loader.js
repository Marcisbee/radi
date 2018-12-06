const { mount, destroy, h } = require('./index');

const App = require('./app');

const app = mount(h(App), document.body);

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    // Before restarting the app, we create a new root element and dispose the old one
    destroy(app);
  });
}
