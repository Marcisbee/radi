/* eslint-disable consistent-return */
/* eslint-disable no-console */

import Component from '../component/Component';
import headless from '../component/headless';
import customTag from '../r/customTag';
import mount from '../mount';
import listen from '../listen';
import r from '../r';

class Modal extends Component {
  state() {
    return {
      registry: {},
    };
  }

  register(name, element) {
    if (typeof this.state.registry[name] !== 'undefined') {
      console.warn(`[Radi.js] Warn: Modal with name "${name}" is already registerd!`);
      return;
    }

    this.setState({
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
      console.warn(`[Radi.js] Warn: Modal with name "${name}" is not registerd!`);
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
    const keys = Object.keys(this.state.registry);
    const registry = keys.reduce((acc, name) => Object.assign(acc, {
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

const $modal = headless('modal', Modal);

customTag('modal',
  (props, children, buildNode) => {
    const name = props.name || 'default';

    $modal.register(name, null);

    if (typeof props.name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
    }

    mount(listen($modal, 'registry', name)
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
  }, () => {
    // Destroyed `element`
  }
);
