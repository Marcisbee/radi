import { Radi } from "../index";
import { GLOBALS } from "../consts/GLOBALS";
import { clone } from "./clone";

function Component(o) {
  this.o = {
    name: o.name,
    state: clone(o.state),
    props: clone(o.props),
    actions: o.actions,
    view: o.view,
    $view: o.$view,
    $mixins: this.$mixins || {}
  };

  this.__radi = function() {
    return new Radi(this.o);
  };
}

Component.prototype.props = function props(p) {
  for (var k in p) {
    if (typeof this.o.props[k] === "undefined") {
      console.warn(
        "[Radi.js] Warn: Creating a prop `",
        k,
        "` that is not defined in component"
      );
    }
    this.o.props[k] = p[k];
  }
  return this;
};

Component.prototype.$mixins = {};

export { Component };
