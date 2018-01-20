module.exports = function ({ r, l, mount, component }) {
  const app = component({
    view: function () {
      return r('div',
        'Hello',
        l(' ' + this.hello)
      );
    },
    state: {
      hello: 'orld'
    },
    actions: {
      onMount() {
        this.hello = 'W' + this.hello;
      }
    }
  });

  mount(new app(), 'app');

  return testapp.innerHTML;
};
