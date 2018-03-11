import GLOBALS from '../consts/GLOBALS';
import clone from './clone';
import generateId from './generateId';
import Renderer from './Renderer';

export default class Component {
  constructor(o) {
    this.o = {
      name: o.name
    };

    this.addNonEnumerableProperties({
      $mixins: o.$mixins || {},
      $id: generateId(),
      $name: o.name,
      $state: clone(o.state || {}),
      $props: clone(o.props || {}),
      $actions: o.actions || {},
      // Variables like state and props are actually stored here so that we can
      // have custom setters
      $privateStore: {}
    });

    this.copyDataToInstance();

    this.addNonEnumerableProperties({
      $view: o.view(this),
    });

    this.$view.unmount = this.unmount.bind(this);
    this.$view.mount = this.mount.bind(this);

    this.addNonEnumerableProperties({
      $renderer: new Renderer(this),
    });
  }

  copyDataToInstance() {
    for (let key in this.$mixins) {
      if (typeof this[key] === 'undefined') {
        this.addCustomField(key, this.$mixins[key]);
      }
    }

    for (let key in this.$state) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write state for reserved variable \`${i}\``);
      }
      this.addCustomField(key, this.$state[key]);
    }

    for (let key in this.$props) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write prop for reserved variable \`${i}\``);
      }

      this.addCustomField(key, this.$props[key]);
    }

    for (let key in this.$actions) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write action for reserved variable \`${i}\``);
      }

      this.addCustomField(key, (...args) => {
        if (GLOBALS.FROZEN_STATE) return null;
        return this.$actions[key].apply(this, args);
      });
    }
  }

  setProps(props) {
    for (let key in props) {
      this.o.props[key] = props[key];
      if (typeof this.o.props[key] === 'undefined') {
        console.warn(
          `[Radi.js] Warn: Creating a prop \`${key}\` that is not defined in component`
        );
        this.addCustomField(key, props[key]);
        continue;
      }
      this[key] = props[key];
    }
    return this;
  }

  addNonEnumerableProperties(object) {
    for (let key in object) {
      Object.defineProperty(this, key, {
        value: object[key]
      });
    }
  }

  addCustomField(key, value) {
    this.$privateStore[key] = {
      listeners: [],
      listen: listener => this.$privateStore[key].listeners.push(listener),
      value
    };
    Object.defineProperty(this, key, {
      get: () => this.$privateStore[key].value,
      set: (value) => {
        const item = this.$privateStore[key];
        item.value = value;
        item.listeners.forEach(listener => listener.handleUpdate(value));
      },
      enumerable: true,
      configurable: true
    });
  }

  addListener(key, listener) {
    this.$privateStore[key].listen(listener);
  }

  isMixin(key) {
    return typeof this.$mixins[key] !== 'undefined';
  }

  mount() {
    if (typeof this.$actions.onMount === 'function') {
      this.$actions.onMount(this);
    }
    GLOBALS.ACTIVE_COMPONENTS[this.$id] = this;
  }

  unmount() {
    if (typeof this.$actions.onDestroy === 'function') {
      this.$actions.onDestroy(this);
    }
    delete GLOBALS.ACTIVE_COMPONENT[this.$id];
    return this.$view;
  }

  $render() {
    this.mount();
    return this.$renderer.render();
  }
}
