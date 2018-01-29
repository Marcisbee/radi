module.exports = function ({ r, l, cond, mount, component }) {
  var act_up = null;

  global.child = component({
    view: function () {
    	return r('span', 'Showing')
    }
  });

  const app = component({
    view: function () {
      return r('div',
        cond(
          l(this.show),
          r('strong', 'Not showing')
        ).elseif(
          l(this.show),
          r('strong', 'Not showing')
        ).cond(
          l(this.show),
          r('strong', 'Not showing')
        ).else(
          r('strong', new child())
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
