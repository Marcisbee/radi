import GLOBALS from '../consts/GLOBALS';
import clone from './clone';

export default class Component {
  constructor(o) {
    this.o = {
      name: o.name
    };

    this.__path = 'this';

    this.linkNum = 0;

    const state = clone(o.state || {});
    const props = clone(o.props || {});
    const mixins = o.$mixins || {};

    this.addNonEnumerableProperties({
      $mixins: mixins,
      $id: GLOBALS.IDS++,
      $name: o.name,
      $state: state,
      $props: props,
      $actions: o.actions || {},
      $html: document.createDocumentFragment(),
      $parent: null,
      // Variables like state and props are actually stored here so that we can
      // have custom setters
      privateStore: {}
    });

    for (let key in this.$mixins) {
      if (typeof this[key] === 'undefined') {
        this.addCustomField(key, this.$mixins[key]);
      }
    }

    for (let key in state) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write state for reserved variable \`${i}\``);
      }
      this.addCustomField(key, state[key]);
    }

    for (let key in props) {
      if (typeof this[key] !== 'undefined') {
        throw new Error(`[Radi.js] Error: Trying to write prop for reserved variable \`${i}\``);
      }

      this.addCustomField(key, props[key]);
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

    this.addNonEnumerableProperties({
      $view: o.view(this),
    });

    this.$html.appendChild(this.$view);
    this.$html.destroy = () => this.destroyHtml();

    this.$view.unmount = this.unmount.bind(this);
    this.$view.mount = this.mount.bind(this);
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

  addNonEnumerableProperties(object) {
    for (let key in object) {
      Object.defineProperty(this, key, {
        value: object[key]
      });
    }
  }

  addCustomField(key, value) {
    this.privateStore[key] = {
      listeners: [],
      listen: listener => this.privateStore[key].listeners.push(listener),
      value
    };
    Object.defineProperty(this, key, {
      get: () => this.privateStore[key].value,
      set: (value) => {
        const item = this.privateStore[key];
        item.value = value;
        item.listeners.forEach(listener => listener.handleUpdate(value));
      },
      enumerable: true,
      configurable: true
    });
  }

  addListener(key, listener) {
    this.privateStore[key].listen(listener);
  }

  destroyHtml() {
    const oldRootElem = this.$link.parentElement;
    const newRootElem = oldRootElem.cloneNode(false);
    oldRootElem.parentNode.insertBefore(newRootElem, oldRootElem);
    this.unmount();
    oldRootElem.parentNode.removeChild(oldRootElem);
  }

  isMixin(key) {
    return typeof this.$mixins[key] !== 'undefined';
  }

  mount() {
    if (typeof this.$actions.onMount === 'function') {
      this.$actions.onMount(this);
    }
    GLOBALS.ACTIVE_COMPONENTS.push(this);
  }

  unmount() {
    if (typeof this.$actions.onDestroy === 'function') {
      this.$actions.onDestroy(this);
    }

    for (let i = 0; i < GLOBALS.ACTIVE_COMPONENTS.length; i++) {
      if (GLOBALS.ACTIVE_COMPONENTS[i].$id === this.$id) {
        GLOBALS.ACTIVE_COMPONENTS.splice(i, 1);
        break;
      }
    }

    return this.$view;
  }

  $render() {
    this.mount();
    return this.$html;
  }
}
