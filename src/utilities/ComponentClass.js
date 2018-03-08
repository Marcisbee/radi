import { Radi } from "../index";
import { GLOBALS } from "../consts/GLOBALS";
import { clone } from "./clone";

export class Component {
  constructor(o) {
    this.o = {
      name: o.name,
      state: clone(o.state),
      props: clone(o.props),
      actions: o.actions,
      view: o.view,
      $view: o.$view,
      $mixins: this.$mixins || {},
    };

    this.$mixins = {};
  }

  __radi() {
    return new Radi(this.o);
  }

  props(propsUpdates) {
    for (let key in propsUpdates) {
      if (typeof this.o.props[key] === "undefined") {
        console.warn(
          "[Radi.js] Warn: Creating a prop `",
          key,
          "` that is not defined in component"
        );
      }
      this.o.props[key] = propsUpdates[key];
    }
    return this;
  }
}
