module.exports = function ({ r, mount, component }) {

  global.targetSize = 31;

  global.dot = component({
    view: function () {
      var size = l(this.size + 'px');
      return r('div.dot',
        {
          style: {
            position: 'absolute',
            font: 'normal 15px sans-serif',
            textAlign: 'center',
            cursor: 'pointer',
            width: size,
            height: size,
            left: l(this.x + 'px'),
            top: l(this.y + 'px'),
            borderRadius: l((this.size / 2) + 'px'),
            lineHeight: size,
            background: l(this.hover ? '#ff0' : '#61dafb')
          }
        },
        l(this.hover ? '*' + this.text + '*' : this.text)
      );
    },
    props: {
      x: Number,
      y: Number,
      size: Number,
      text: String,
    },
    state: {
      hover: false
    }
  });

  global.triangle = component({
    view: function () {
      return r('div',
        new dot().props({
          x: this.x - (targetSize / 2),
          y: this.y - (targetSize / 2),
          size: targetSize,
          text: l(this.seconds),
        })
      );
    },
    props: {
      x: Number,
      y: Number,
      s: Number,
      seconds: Number
    }
  });

  const app = component({
    state: {
      elapsed: 0,
      scale: 1,
      seconds: 0,
      start: null
    },
    view: function () {
      return r('div',
        {
          style: {
            position: 'absolute',
            transformOrigin: '0 0',
            left: '50%',
            top: '50%',
            width: '10px',
            height: '10px',
            background: '#eee',
            transform: l('scaleX(' + (this.scale / 2.1) + ') scaleY(0.7) translateZ(0.1px)')
          }
        },
        new triangle().props({
          x: 0,
          y: 0,
          s: 1000,
          seconds: l(this.seconds)
        })
      );
    },
    actions: {
      onMount() {
        this.start = Date.now();
      },
    }
  });

  mount(new app(), 'app');

  return testapp.innerHTML;
};
