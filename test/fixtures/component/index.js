module.exports = function ({ r, mount, component }) {
  const app = component({
    view: (state, actions) => {
      return r('div', state.hello);
    },
    state: {
      hello: 'Hello World'
    },
    actions: {
      //
    }
  });

  mount(app, 'app');

  return testapp.innerHTML;
};
