(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  const GLOBALS = {
    MIX: {},
    HEADLESS_COMPONENTS: {},
    FROZEN_STATE: false,
    VERSION: '0.2.10',
    ACTIVE_COMPONENTS: {},
    HTML_CACHE: {},
  };

  class Listener {
    /**
     * @param {Component} component
     * @param {...string} path
     */
    constructor(component, ...path) {
      this.component = component;
      [this.key] = path;
      this.childPath = path.slice(1, path.length);
      this.value = null;
      this.changeListeners = [];
      this.processValue = value => value;

      this.component.addListener(this.key, this);
      this.handleUpdate(this.component[this.key]);
    }

    /**
     * @param {*} value
     */
    handleUpdate(value) {
      this.value = this.processValue(this.getShallowValue(value), this.value);
      this.changeListeners.forEach(changeListener => changeListener(this.value));
    }

    /**
     * @param {function(*)} changeListener
     */
    onValueChange(changeListener) {
      this.changeListeners.push(changeListener);
      changeListener(this.value);
    }

    /**
     * @param {function(*): *} processValue
     * @returns {function(*): *}
     */
    process(processValue) {
      this.processValue = processValue;
      this.handleUpdate(this.value);
      return this;
    }

    /**
     * @private
     * @param {*} value
     */
    getShallowValue(value) {
      if (typeof value !== 'object' || !this.childPath) return value;
      let shallowValue = value;
      /*eslint-disable*/
      for (const pathNestingLevel of this.childPath) {
        if (shallowValue === null
          || !shallowValue[pathNestingLevel]
          && typeof shallowValue[pathNestingLevel] !== 'number') {
          shallowValue = null;
        } else {
          shallowValue = shallowValue[pathNestingLevel];
        }
      }
      return shallowValue;
    }
  }

  class AttributeListener {
    /**
     * @param {object} options
     * @param {string} options.attributeKey
     * @param {Listener} options.listener
     * @param {Node} options.element
     */
    constructor({ attributeKey, listener, element }) {
      this.attributeKey = attributeKey;
      this.listener = listener;
      this.element = element;
      this.attached = false;
      this.handleValueChange = this.handleValueChange.bind(this);
    }

    /**
     * Attaches attribute listener to given element and starts listening.
     * @returns {AttributeListener}
     */
    attach() {
      if (!this.element.attributeListeners) this.element.attributeListeners = [];
      this.element.attributeListeners.push(this);
      this.listener.onValueChange(this.handleValueChange);
      this.attached = true;

      if (this.attributeKey === 'model') {
        if (/(checkbox|radio)/.test(this.element.getAttribute('type'))) {
          this.element.onchange = (e) => {
            this.listener.component[this.listener.key] = e.target.checked;
          };
        } else {
          this.element.oninput = (e) => {
            this.listener.component[this.listener.key] = e.target.value;
          };
        }
      }
      return this;
    }

    /**
     * @param {*} value
     */
    handleValueChange(value) {
      if (this.attributeKey === 'value' || this.attributeKey === 'model') {
        if (/(checkbox|radio)/.test(this.element.getAttribute('type'))) {
          this.element.checked = value;
        } else {
          this.element.value = value;
        }
      } else {
        setAttributes(this.element, { [this.attributeKey]: value });
      }
    }

    /**
     * @param {Node} newElement
     */
    updateElement(newElement) {
      this.element = newElement;
      return this.element;
    }
  }

  class StyleListener {
    /**
     * @param {object} options
     * @param {string} options.styleKey
     * @param {Listener} options.listener
     * @param {Node} options.element
     */
    constructor({ styleKey, listener, element }) {
      this.styleKey = styleKey;
      this.listener = listener;
      this.element = element;
      this.attached = false;
      this.handleValueChange = this.handleValueChange.bind(this);
    }

    /**
     * Attaches style listener to given element and starts listening.
     * @returns {StyleListener}
     */
    attach() {
      if (!this.element.styleListeners) this.element.styleListeners = [];
      this.element.styleListeners.push(this);
      this.listener.onValueChange(this.handleValueChange);
      this.attached = true;
      return this;
    }

    /**
     * @param {*} value
     */
    handleValueChange(value) {
      setStyle(this.element, this.styleKey, value);
    }

    /**
     * @param {Node} newElement
     */
    updateElement(newElement) {
      this.element = newElement;
      return this.element;
    }
  }

  /**
   * @param {*} value
   * @return {*}
   */
  const parseValue = value =>
    typeof value === 'number' && !Number.isNaN(value) ? `${value}px` : value;

  /* eslint-disable no-param-reassign */

  /**
   * @param {HTMLElement} element
   * @param {string} property
   * @param {string} value
   * @returns {*}
   */
  const setStyle = (element, property, value) => {
    if (typeof value === 'undefined') return undefined;

    if (value instanceof Listener) {
      new StyleListener({
        styleKey: property,
        listener: value,
        element,
      }).attach();
      return element[property];
    }

    return element.style[property] = parseValue(value);
  };

  /**
   * @param {HTMLElement} element
   * @param {string|object|Listener} styles
   * @returns {CSSStyleDeclaration}
   */
  const setStyles = (element, styles) => {
    if (typeof styles === 'string') {
      element.style = styles;
    }

    if (typeof styles !== 'object' || Array.isArray(styles)) {
      return element.style;
    }

    if (styles instanceof Listener) {
      new AttributeListener({
        attributeKey: 'style',
        listener: styles,
        element,
      }).attach();
      return element.style;
    }

    for (const property in styles) {
      setStyle(element, property, styles[property]);
    }

    return element.style;
  };

  /**
   * @param {*} value
   * @return {*}
   */
  const parseClass = value => {
    if (Array.isArray(value)) {
      return value.filter(item => item).join(' ')
    }
    return value;
  };

  /* eslint-disable guard-for-in */

  /**
   * @param {HTMLElement} element
   * @param {object} attributes
   */
  const setAttributes = (element, attributes) => {
    for (const key in attributes) {
      const value = attributes[key];

      if (typeof value === 'undefined') continue;

      if (!value && typeof value !== 'number') {
        // Need to remove falsy attribute
        element.removeAttribute(key);
        continue;
      }

      if (key.toLowerCase() === 'style') {
        setStyles(element, value);
        continue;
      }

      if (value instanceof Listener) {
        new AttributeListener({
          attributeKey: key,
          listener: value,
          element,
        }).attach();
        continue;
      }

      if (key.toLowerCase() === 'class' || key.toLowerCase() === 'classname') {
        element.setAttribute('class', parseClass(value));
        continue;
      }

      // Handles events 'on<event>'
      if (key.substring(0, 2).toLowerCase() === 'on') {
        if (key.substring(0, 8).toLowerCase() === 'onsubmit') {
          element[key] = (e) => {
            const data = [];
            const inputs = e.target.elements || [];
            for (const input of inputs) {
              if (input.name !== '') {
                const item = {
                  name: input.name,
                  el: input,
                  type: input.type,
                  default: input.defaultValue,
                  value: input.value,
                  set(val) {
                    this.el.value = val;
                  },
                  reset(val) {
                    this.el.value = val;
                    this.el.defaultValue = val;
                  },
                };
                data.push(item);
                Object.defineProperty(data, item.name, {
                  value: item,
                });
              }
            }

            return value(e, data);
          };
        } else {
          element[key] = value;
        }
        continue;
      }

      element.setAttribute(key, value);
    }
  };

  /**
   * @param {*} query
   * @returns {Node}
   */
  const getElementFromQuery = query => {
    if (typeof query === 'string') return document.createElement(query);
    console.warn(
      '[Radi.js] Warn: Creating a JSX element whose query is not of type string, automatically converting query to string.'
    );
    return document.createElement(query.toString());
  };

  /**
   * @param {*} obj
   * @returns {*}
   */
  const clone = obj => {
    if (typeof obj !== 'object') return obj;
    if (obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(clone);

    /*eslint-disable*/
    // Reverted as currently throws some errors
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = clone(obj[key]);
      }
    }
    /* eslint-enable */

    return cloned;
  };

  /**
   * UUID v4 generator
   * https://gist.github.com/jcxplorer/823878
   * @returns {string}
   */
  const generateId = () => {
    let uuid = '';
    for (let i = 0; i < 32; i++) {
      const random = (Math.random() * 16) | 0; // eslint-disable-line

      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += '-';
      }
      uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16); // eslint-disable-line
    }
    return uuid;
  };

  class Renderer {
    /**
     * @param {Component} component
     */
    constructor(component) {
      this.component = component;
      this.html = document.createDocumentFragment();
      this.node = {};
    }

    /**
     * @returns {HTMLElement}
     */
    render() {
      this.html.appendChild(this.node = this.component.$view);
      this.html.destroy = this.node.destroy = () => this.component.destroy();
      return this.html;
    }

    /**
     * @returns {HTMLElement}
     */
    destroyHtml() {
      if (this.node.childNodes) {
        this.node.childNodes.forEach(childNode => {
          this.node.removeChild(childNode);
        });
      }

      if (this.html.childNodes) {
        this.html.childNodes.forEach(childNode => {
          this.html.removeChild(childNode);
        });
      }

      this.html = document.createDocumentFragment();
      this.node = {};

      return this.node;
    }
  }

  function deepProxy(target, handler) {
    const preproxy = new WeakMap();

    function makeHandler(path) {
      return {
        set(target, key, value, receiver) {
          if(typeof value === 'object' && value !== null) {
            value = proxify(value, [...path, key]);
          }
          target[key] = value;

          if(handler.set) {
            handler.set(target, [...path, key], value, receiver);
          }
          return true;
        },

        deleteProperty(target, key) {
          if(Reflect.has(target, key)) {
            unproxy(target, key);
            let deleted = Reflect.deleteProperty(target, key);
            if(deleted && handler.deleteProperty) {
              handler.deleteProperty(target, [...path, key]);
            }
            return deleted;
          }
          return false;
        }
      }
    }

    function unproxy(obj, key) {
      if(preproxy.has(obj[key])) {
        obj[key] = preproxy.get(obj[key]);
        preproxy.delete(obj[key]);
      }

      for(let k of Object.keys(obj[key])) {
        if(typeof obj[key][k] === 'object' && obj[key] !== null) {
          unproxy(obj[key], k);
        }
      }
    }

    function proxify(obj, path) {
      for(let key of Object.keys(obj)) {
        if(typeof obj[key] === 'object' && obj[key] !== null) {
          obj[key] = proxify(obj[key], [...path, key]);
        }
      }
      let p = new Proxy(obj, makeHandler(path));
      preproxy.set(p, obj);
      return p;
    }

    return proxify(target, []);
  }

  class PrivateStore {
    constructor() {
      this.store = {};
    }

    /**
     * setItem
     * @param {string} key
     * @param {*} value
     * @returns {*}
     */
    setItem(key, value) {
      if (typeof this.store[key] === 'undefined') {
        this.createItemWrapper(key);
      }
      if (key !== 'children'
        && value
        && typeof value === 'object'
        && !(value instanceof Component)) {
        value = deepProxy(value, {
          set: (target, path, val, receiver) => {
            this.triggerListeners(key);
          },
          deleteProperty: (target, path) => {
            this.triggerListeners(key);
          }
        });
      }
      this.store[key].value = value;
      this.triggerListeners(key);
      return value;
    }

    /**
     * getItem
     * @param {string} key
     * @returns {*}
     */
    getItem(key) {
      return this.store[key].value;
    }

    /**
     * addListener
     * @param {string} key
     * @param {Listener} listener
     * @returns {Listener}
     */
    addListener(key, listener) {
      if (typeof this.store[key] === 'undefined') {
        this.createItemWrapper(key);
      }
      this.store[key].listeners.push(listener);
      listener.handleUpdate(this.store[key].value);
      return listener;
    }

    /**
     * createItemWrapper
     * @private
     * @param {string} key
     * @returns {object}
     */
    createItemWrapper(key) {
      return this.store[key] = {
        listeners: [],
        value: null,
      };
    }

    /**
     * triggerListeners
     * @private
     * @param {string} key
     */
    triggerListeners(key) {
      const item = this.store[key];
      item.listeners.forEach(listener => listener.handleUpdate(item.value));
    }
  }

  /* eslint-disable guard-for-in */

  class Component {
    /**
     * @param {object} o
     * @param {string} [o.name]
     * @param {object} [o.mixins]
     * @param {object} [o.state]
     * @param {object} [o.props]
     * @param {object} [o.actions]
     * @param {function(Component): (HTMLElement|Component)} view
     * @param {Node[]|*[]} [children]
     */
    constructor(o, children) {
      this.name = o.name;

      this.addNonEnumerableProperties(Object.assign({
        $id: generateId(),
        $mixins: o.mixins || {},
        $state: clone(o.state || {}),
        $props: clone(o.props || {}),
        $actions: o.actions || {},
        // Variables like state and props are actually stored here so that we can
        // have custom setters
        $privateStore: new PrivateStore(),
      }));

      this.addCustomField('children', []);
      if (children) this.setChildren(children);

      this.copyObjToInstance(this.$mixins);
      this.copyObjToInstance(this.$state);
      this.copyObjToInstance(this.$props);
      // Appends headless components
      this.copyObjToInstance(GLOBALS.HEADLESS_COMPONENTS);
      // The bind on this.handleAction is necessary
      this.copyObjToInstance(this.$actions, this.handleAction.bind(this));

      this.addNonEnumerableProperties({
        $view: o.view ? o.view(this) : () => () => null,
        $renderer: new Renderer(this),
      });

      this.$view.unmount = this.unmount.bind(this);
      this.$view.mount = this.mount.bind(this);
    }

    /**
     * @private
     * @param {object} obj
     * @param {function(*): *} [handleItem=item => item]
     */
    copyObjToInstance(obj, handleItem = item => item) {
      for (const key in obj) {
        if (typeof this[key] !== 'undefined') {
          throw new Error(`[Radi.js] Error: Trying to write for reserved variable \`${key}\``);
        }
        this.addCustomField(key, handleItem(obj[key]));
      }
    }

    /**
     * @private
     * @param {function(*): *} action
     * @returns {function(...*): *}
     */
    handleAction(action) {
      return (...args) => {
        if (GLOBALS.FROZEN_STATE) return null;
        return action.call(this, ...args);
      };
    }

    /**
     * @param {object} props
     * @returns {Component}
     */
    setProps(props) {
      for (const key in props) {
        this.$props[key] = props[key];
        if (typeof this.$props[key] === 'undefined') {
          console.warn(`[Radi.js] Warn: Creating a prop \`${key}\` that is not defined in component`);
          this.addCustomField(key, props[key]);
          continue;
        }
        this[key] = props[key];
      }
      return this;
    }

    /**
     * @param {Node[]|*[]} children
     */
    setChildren(children) {
      this.children = children;
      return this;
    }

    /**
     * @private
     * @param {object} obj
     */
    addNonEnumerableProperties(obj) {
      for (const key in obj) {
        if (typeof this[key] !== 'undefined') continue;
        Object.defineProperty(this, key, {
          value: obj[key],
        });
      }
    }

    /**
     * @private
     * @param {string} key
     * @param {*} value
     * @returns {*}
     */
    addCustomField(key, value) {
      Object.defineProperty(this, key, {
        get: () => this.$privateStore.getItem(key),
        set: val => this.$privateStore.setItem(key, val),
        enumerable: true,
      });
      this[key] = value;
    }

    /**
     * @param {string} key
     * @param {Listener} listener
     */
    addListener(key, listener) {
      this.$privateStore.addListener(key, listener);
    }

    /**
     * @param {string} key
     * @returns {boolean}
     */
    isMixin(key) {
      return typeof this.$mixins[key] !== 'undefined';
    }

    mount() {
      if (typeof this.$actions.onMount === 'function') {
        this.$actions.onMount.call(this, this);
      }
      GLOBALS.ACTIVE_COMPONENTS[this.$id] = this;
    }

    unmount() {
      if (typeof this.$actions.onDestroy === 'function') {
        this.$actions.onDestroy.call(this, this);
      }
      delete GLOBALS.ACTIVE_COMPONENTS[this.$id];
    }

    /**
     * @returns {HTMLElement}
     */
    render() {
      this.mount();
      return this.$renderer.render();
    }

    /**
     * @returns {HTMLElement}
     */
    destroy() {
      this.unmount();
      return this.$renderer.destroyHtml();
    }

    /**
     * @returns {boolean}
     */
    static isComponent() {
      return true;
    }
  }

  /**
   * @param {*} value
   * @returns {*[]}
   */
  const ensureArray = value => {
    if (Array.isArray(value)) return value;
    return [value];
  };

  /**
   * @param {*} oldNode - Node to be swapped
   * @returns {Node}
   */
  const swapNode = oldNode => {

    const newNode = oldNode;

    oldNode = newNode.cloneNode(true);

    // TODO: Need to destroy all childs of oldNode with smth like .destroy();
    oldNode.remove();

    return newNode;
  };

  /**
   * @param {*} value - Value of the listener
   * @returns {Node[]}
   */
  const listenerToNode = value => {
    if (value instanceof DocumentFragment) {
      return Array.from(value.childNodes).map(childNode => swapNode(childNode));
    }

    const element = document.createDocumentFragment();
    appendChildren(element, ensureArray(value));
    return listenerToNode(element);
  };

  class ElementListener {
    /**
     * @param {object} options
     * @param {Listener} options.listener
     * @param {Node} options.element
     */
    constructor({ listener, element }) {
      this.listener = listener;
      this.element = element;
      this.listenerAsNode = [];
      this.attached = false;
      this.handleValueChange = this.handleValueChange.bind(this);
    }

    /**
     * Attaches listener to given element and starts listening.
     * @returns {ElementListener}
     */
    attach() {
      if (!this.element.listeners) this.element.listeners = [];
      this.element.listeners.push(this);
      this.listener.onValueChange(this.handleValueChange);
      this.attached = true;
      return this;
    }

    /**
     * @param {*} value
     */
    handleValueChange(value) {
      const newNode = listenerToNode(value);
      /* eslint-disable */
      for (const node of newNode) {
        // If listenerAsNode[0] is undefined we're dealing with a fragment so we
        // can just append
        if (!this.listenerAsNode[0]) {
          this.element.appendChild(node);
          continue;
        }
        // TODO: Finish dom transformer and swap it with Node replacement
        this.element.insertBefore(node, this.listenerAsNode[0]);
      }

      for (const node of this.listenerAsNode) {
        var treeWalker = document.createTreeWalker(
          node,
          NodeFilter.SHOW_ELEMENT,
          el => el && typeof el.destroy === 'function',
          false);

        var el;
        while((el = treeWalker.nextNode())) {
          el.destroy();
        }

        node.remove();
      }

      this.listenerAsNode = newNode;
      /* eslint-enable */
    }

    /**
     * @param {Node} newElement
     */
    updateElement(newElement) {
      this.element = newElement;
      return this.element;
    }
  }

  /**
   * @param {Listener} listener
   * @param {HTMLElement} element
   * @returns {ElementListener}
   */
  const appendListenerToElement = (listener, element) =>
    new ElementListener({
      listener,
      element,
    }).attach();

  /* eslint-disable no-param-reassign */

  /**
   * @param {HTMLElement} element
   * @returns {function(*)}
   */
  const appendChild = element => child => {
    if (!child && typeof child !== 'number') {
      // Needs to render every child, even empty ones to preserve dom hierarchy
      child = '';
    }

    if (child instanceof Component) {
      element.appendChild(child.render());
      return;
    }

    if (child instanceof Listener) {
      appendListenerToElement(child, element);
      return;
    }

    if (Array.isArray(child)) {
      appendChildren(element, child);
      return;
    }

    // Handles lazy loading components
    if (typeof child === 'function') {
      const placeholder = document.createElement('div');
      const el = element.appendChild(placeholder);
      child().then(local => {
        if (typeof local.default === 'function'
          && local.default.isComponent
          && local.default.isComponent()) {
          /*eslint-disable*/
          appendChild(el)(new local.default());
          /* eslint-enable */
        } else {
          appendChild(el)(local.default);
        }
      }).catch(console.warn);
      return;
    }

    if (child instanceof Node) {
      element.appendChild(child);
      return;
    }

    element.appendChild(document.createTextNode(child));
  };

  /**
   * @param {HTMLElement} element
   * @param {*[]} children
   */
  const appendChildren = (element, children) => {
    children.forEach(appendChild(element));
  };

  /**
   * @param {*} query
   * @param {object} props
   * @param {...*} children
   * @returns {(HTMLElement|Component)}
   */
  const r = (Query, props, ...children) => {
    if (typeof Query.isComponent === 'function' && Query.isComponent()) {
      return new Query(children).setProps(props || {});
    }

    if (typeof Query === 'function') {
      const propsWithChildren = props || {};
      propsWithChildren.children = children;
      return Query(propsWithChildren);
    }

    const element = getElementFromQuery(Query);

    if (props !== null) setAttributes(element, props);
    appendChildren(element, children);

    return element;
  };

  /**
   * The listen function is used for dynamically binding a component property
   * to the DOM. Also commonly imported as 'l'.
   * @param {Component} component
   * @param {...string} path
   * @returns {Listener}
   */
  const listen = (component, ...path) =>
    new Listener(component, ...path);

  /**
   * @param {object} o
   * @returns {function}
   */
  const component = o => class {
    /**
     * @returns {Component}
     */
    constructor(children) {
      return new Component(o, children);
    }

    /**
     * @returns {boolean}
     */
    static isComponent() {
      return true;
    }
  };

  /**
   * @param {Component} component
   * @param {string} id
   * @returns {HTMLElement|Node}
   */
  const mount = (component, id) => {
    const container = typeof id === 'string' ? document.getElementById(id) : id;
    const rendered =
      component instanceof Component ? component.render() : component;
    container.appendChild(rendered);
    return rendered;
  };

  const remountActiveComponents = () => {
    Object.values(GLOBALS.ACTIVE_COMPONENTS).forEach(component => {
      if (typeof component.onMount === 'function') {
        component.onMount(component);
      }
    });
  };

  const _radi = {
    version: GLOBALS.VERSION,
    activeComponents: GLOBALS.ACTIVE_COMPONENTS,
    r,
    listen,
    l: listen,
    component,
    headless: (key, comp) => {
      // TODO: Validate component and key
      const mountedComponent = new comp();
      mountedComponent.mount();
      return GLOBALS.HEADLESS_COMPONENTS['$'.concat(key)] = mountedComponent;
    },
    mount,
    freeze: () => {
      GLOBALS.FROZEN_STATE = true;
    },
    unfreeze: () => {
      GLOBALS.FROZEN_STATE = false;
      remountActiveComponents();
    },
  };

  // Pass Radi instance to plugins
  _radi.plugin = (fn, ...args) => fn(_radi, ...args);

  if (window) window.$Radi = _radi;

  module.exports = _radi;

})));
//# sourceMappingURL=radi.js.map
