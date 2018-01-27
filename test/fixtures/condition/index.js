module.exports = function ({ r, l, condition, mount, component }) {
  var act_up = null;

  global.child = component({
    view: function () {
    	return r('span', 'Showing')
    }
  });

  const app = component({
    view: function () {
      return r('div',
        condition(
          l(!this.show),
          r('strong', new child())
        ),
        condition(
          l(this.show),
          r('strong', 'Not showing')
        ),
      );
    },
    state: {
      show: false
    },
    actions: {
      onMount() {
      	this.show = true
      	this.show = false
      }
    }
  });

  mount(new app(), 'app');

  return testapp.innerHTML;
};
