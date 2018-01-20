module.exports = function ({ r, l, list, mount, component }) {
  var act_up = null;

  const app = component({
    view: function () {
      var lst = list(l(this.list), function (item, i) {
        return r('li.item-' + i,
          [ l(item.id), l(item.text) ]
        );
      });
      return r('ul',
        lst
      );
    },
    state: {
      list: [
        {
          id: 3,
          text: 'Third',
        }
      ]
    },
    actions: {
      onMount() {
        this.list = [
          {
            id: 0,
            text: 'trash',
          },
          {
            id: 1,
            text: 'First',
          },
          {
            id: 2,
            text: 'Second',
          }
        ];
        this.list.push({
          id: 3,
          text: 'Third',
        });
        var x = 0, y = 1;
        this.list.shift();
        this.list.unshift();
        this.list[x] = this.list.splice(y, 1, this.list[x])[0];
        this.list.pop();
        this.list.reverse();
      }
    }
  });

  mount(new app(), 'app');

  return testapp.innerHTML;
};
