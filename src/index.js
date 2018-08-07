import GLOBALS from './consts/GLOBALS';
import r from './r';
import listen from './listen';
import Component from './component';
import headless from './component/headless';
import generateId from './utils/generateId';
import mount from './mount';
import patch from './r/patch';
import action from './action';
import worker from './action/worker';
import subscribe from './action/subscribe';
import customTag from './r/customTag';
import customAttribute from './r/customAttribute';
import remountActiveComponents from './utils/remountActiveComponents';

const Radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  listen,
  l: listen,
  worker,
  Component,
  component: Component,
  action,
  subscribe,
  customTag,
  customAttribute,
  headless,
  update: patch,
  patch,
  mount,
  freeze: () => {
    GLOBALS.FROZEN_STATE = true;
  },
  unfreeze: () => {
    GLOBALS.FROZEN_STATE = false;
    remountActiveComponents();
  },
};

class Modal extends Radi.Component {
  state() {
    return {
      registry: {},
    };
  }

  register(name, element) {
    if (typeof this.state.registry[name] !== 'undefined') {
      console.warn('[Radi.js] Warn: Modal with name "' + name + '" is already registerd!');
      return;
    }

    return this.setState({
      registry: Object.assign({}, this.state.registry, {
        [name]: {
          status: false,
          element,
        },
      }),
    });
  }

  exists(name) {
    if (typeof this.state.registry[name] === 'undefined') {
      console.warn('[Radi.js] Warn: Modal with name "' + name + '" is not registerd!');
      return false;
    }

    return true;
  }

  open(name) {
    if (!this.exists(name) || this.state.registry[name].status) return;

    return this.setState({
      registry: Object.assign({}, this.state.registry, {
        [name]: {
          status: true,
          element: this.state.registry[name].element,
        },
      }),
    });
  }

  close(name) {
    if (!this.exists(name) || !this.state.registry[name].status) return;

    return this.setState({
      registry: Object.assign({}, this.state.registry, {
        [name]: {
          status: false,
          element: this.state.registry[name].element,
        },
      }),
    });
  }

  closeAll() {
    let keys = Object.keys(this.state.registry);
    let registry = keys.reduce((acc, name) => Object.assign(acc, {
      [name]: {
        status: false,
        element: this.state.registry[name].element,
      },
    }), {});

    return this.setState({
      registry,
    });
  }
}

let $modal = headless('modal', Modal);

Radi.customTag('modal',
  (props, children, buildNode, save) => {
    let name = props.name || 'default';

    $modal.register(name, null);

    if (typeof props.name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
    }

    Radi.mount(listen($modal, 'registry', name)
      .process(v => (
        v.status && r('div',
          { class: 'radi-modal', name },
          r('div', {
            class: 'radi-modal-backdrop',
            onclick: () => $modal.close(name),
          }),
          r('div',
            { class: 'radi-modal-content' },
            ...(children.slice())
          )
        )
      )), document.body);

    return buildNode(null);
  }, (element) => {
    // Destroyed element
  }
);

// Pass Radi instance to plugins
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

if (window) window.Radi = Radi;
// export default Radi;
module.exports = Radi;
