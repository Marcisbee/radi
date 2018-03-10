import Radi from '../Radi';
import GLOBALS from '../consts/GLOBALS';
import clone from './clone';
import ViewParser from './ViewParser';

export default class Component {
  constructor(o) {
    this.o = {
      name: o.name,
      state: clone(o.state),
      props: clone(o.props),
      actions: o.actions,
      view: o.view,
      $mixins: this.$mixins || {},
    };

//    const parsedView = new ViewParser(this.o.view).parse();
    this.o.$view = this.o.view;

    this.$mixins = {};
  }

  __radi() {
    return new Radi(this.o);
  }

  props(propsUpdates) {
    for (let key in propsUpdates) {
      if (typeof this.o.props[key] === 'undefined') {
        console.warn(
          '[Radi.js] Warn: Creating a prop `',
          key,
          '` that is not defined in component'
        );
      }
      this.o.props[key] = propsUpdates[key];
    }
    return this;
  }
}
