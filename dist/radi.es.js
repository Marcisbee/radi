var GLOBALS = {
  HEADLESS_COMPONENTS: {},
  FROZEN_STATE: false,
  VERSION: '0.3.7',
  ACTIVE_COMPONENTS: {},
  HTML_CACHE: {},
};

/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
// import fuseDom from '../r/utils/fuseDom';

var Listener = function Listener(component, ...path) {
  var assign;

  this.component = component;
  (assign = path, this.key = assign[0]);
  this.childPath = path.slice(1, path.length);
  this.path = path;
  this.value = null;
  this.changeListeners = [];
  this.processValue = value => value;
  this.attatched = true;

  this.component.addListener(this.key, this);
  if (this.component.state) {
    this.handleUpdate(this.component.state[this.key]);
  }
};

Listener.prototype.deattach = function deattach () {
  this.component = null;
  this.attatched = false;
  this.key = null;
  this.childPath = null;
  this.path = null;
  this.value = null;
  this.changeListeners = [];
  this.processValue = () => {};
};

/**
 * @param {*} value
 */
Listener.prototype.handleUpdate = function handleUpdate (value) {
  // Removed for the time beeing, let's see if this works correctly
  // if (this.value instanceof Node) {
  // fuseDom.destroy(this.value);
  // this.value = null;
  // }
  this.value = this.processValue(this.getShallowValue(value), this.value);
  this.changeListeners.forEach(changeListener => changeListener(this.value));
};

/**
 * @param {function(*)} changeListener
 */
Listener.prototype.onValueChange = function onValueChange (changeListener) {
  this.changeListeners.push(changeListener);
  changeListener(this.value);
};

/**
 * @param {function(*): *} processValue
 * @returns {function(*): *}
 */
Listener.prototype.process = function process (processValue) {
  this.processValue = processValue;
  this.handleUpdate(this.value);
  return this;
};

/**
 * @private
 * @param {*} value
 */
Listener.prototype.getShallowValue = function getShallowValue (value) {
  if (typeof value !== 'object' || !this.childPath) { return value; }
  var shallowValue = value;
  /*eslint-disable*/
  for (var pathNestingLevel of this.childPath) {
    if (shallowValue === null
      || !shallowValue[pathNestingLevel]
      && typeof shallowValue[pathNestingLevel] !== 'number') {
      shallowValue = null;
    } else {
      shallowValue = shallowValue[pathNestingLevel];
    }
  }
  return shallowValue;
};

var AttributeListener = function AttributeListener(ref) {
  var attributeKey = ref.attributeKey;
  var listener = ref.listener;
  var element = ref.element;

  this.attributeKey = attributeKey;
  this.listener = listener;
  this.element = element;
  this.attached = false;
  this.handleValueChange = this.handleValueChange.bind(this);
};

/**
 * Attaches attribute listener to given element and starts listening.
 * @returns {AttributeListener}
 */
AttributeListener.prototype.attach = function attach () {
  if (!this.element.attributeListeners) { this.element.attributeListeners = []; }
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
};

/**
 * @param {*} value
 */
AttributeListener.prototype.handleValueChange = function handleValueChange (value) {
  if (this.attributeKey === 'value' || this.attributeKey === 'model') {
    if (/(checkbox|radio)/.test(this.element.getAttribute('type'))) {
      this.element.checked = value;
    } else {
      this.element.value = value;
    }
  } else {
    setAttributes(this.element, { [this.attributeKey]: value });
  }
};

/**
 * @param {Node} newElement
 */
AttributeListener.prototype.updateElement = function updateElement (newElement) {
  this.element = newElement;
  return this.element;
};

AttributeListener.prototype.deattach = function deattach () {
  this.attributeKey = null;
  this.listener.deattach();
  this.listener = null;
  this.element = null;
  this.listenerAsNode = null;
  this.attached = false;
  this.handleValueChange = () => {};
};

var StyleListener = function StyleListener(ref) {
  var styleKey = ref.styleKey;
  var listener = ref.listener;
  var element = ref.element;

  this.styleKey = styleKey;
  this.listener = listener;
  this.element = element;
  this.attached = false;
  this.handleValueChange = this.handleValueChange.bind(this);
};

/**
 * Attaches style listener to given element and starts listening.
 * @returns {StyleListener}
 */
StyleListener.prototype.attach = function attach () {
  if (!this.element.styleListeners) { this.element.styleListeners = []; }
  this.element.styleListeners.push(this);
  this.listener.onValueChange(this.handleValueChange);
  this.attached = true;
  return this;
};

/**
 * @param {*} value
 */
StyleListener.prototype.handleValueChange = function handleValueChange (value) {
  setStyle(this.element, this.styleKey, value);
};

/**
 * @param {Node} newElement
 */
StyleListener.prototype.updateElement = function updateElement (newElement) {
  this.element = newElement;
  return this.element;
};

StyleListener.prototype.deattach = function deattach () {
  this.listener.deattach();
  this.styleKey = null;
  this.listener = null;
  this.element = null;
  this.attached = false;
  this.handleValueChange = null;
};

/**
 * @param {*} value
 * @return {*}
 */
var parseValue = value =>
  typeof value === 'number' && !Number.isNaN(value) ? `${value}px` : value;

/* eslint-disable no-param-reassign */

/**
 * @param {HTMLElement} element
 * @param {string} property
 * @param {string} value
 * @returns {*}
 */
var setStyle = (element, property, value) => {
  if (typeof value === 'undefined') { return undefined; }

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
var setStyles = (element, styles) => {
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

  for (var property in styles) {
    setStyle(element, property, styles[property]);
  }

  return element.style;
};

/**
 * @param {*} value
 * @return {*}
 */
var parseClass = value => {
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
var setAttributes = (element, attributes) => {
  var loop = function ( key ) {
    var value = attributes[key];

    if (typeof value === 'undefined') { return; }

    if (!value && typeof value !== 'number') {
      // Need to remove falsy attribute
      element.removeAttribute(key);
      return;
    }

    if (key.toLowerCase() === 'style') {
      setStyles(element, value);
      return;
    }

    if (value instanceof Listener) {
      new AttributeListener({
        attributeKey: key,
        listener: value,
        element,
      }).attach();
      return;
    }

    if (key.toLowerCase() === 'class' || key.toLowerCase() === 'classname') {
      element.setAttribute('class', parseClass(value));
      return;
    }

    // Handles events 'on<event>'
    if (key.substring(0, 2).toLowerCase() === 'on') {
      if (key.substring(0, 8).toLowerCase() === 'onsubmit') {
        element[key] = (e) => {
          var data = [];
          var inputs = e.target.elements || [];
          for (var input of inputs) {
            if (input.name !== '') {
              var item = {
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
      return;
    }

    element.setAttribute(key, value);
  };

  for (var key in attributes) loop( key );
};

/**
 * @param {*} query
 * @returns {Node}
 */
var getElementFromQuery = query => {
  if (typeof query === 'string') { return query !== 'template'
    ? document.createElement(query)
    : document.createDocumentFragment(); }
  console.warn(
    '[Radi.js] Warn: Creating a JSX element whose query is not of type string, automatically converting query to string.'
  );
  return document.createElement(query.toString());
};

/**
 * UUID v4 generator
 * https://gist.github.com/jcxplorer/823878
 * @returns {string}
 */
var generateId = () => {
  var uuid = '';
  for (var i = 0; i < 32; i++) {
    var random = (Math.random() * 16) | 0; // eslint-disable-line

    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16); // eslint-disable-line
  }
  return uuid;
};

var PrivateStore = function PrivateStore() {
  this.store = {};
};

/**
 * @param {string} key
 * @param {Listener} listener
 */
PrivateStore.prototype.addListener = function addListener (key, listener) {
  if (typeof this.store[key] === 'undefined') {
    this.createItemWrapper(key);
  }
  this.store[key].listeners = this.store[key].listeners.filter(item => (
    item.attatched
  ));
  this.store[key].listeners.push(listener);
  listener.handleUpdate(this.store[key].value);

  return listener;
};

PrivateStore.prototype.removeListeners = function removeListeners () {
  var o = Object.keys(this.store);
  for (var i = 0; i < o.length; i++) {
    this.store[o[i]].listeners = [];
    this.store[o[i]].null = [];
  }
};

/**
 * setState
 * @param {*} newState
 * @returns {*}
 */
PrivateStore.prototype.setState = function setState (newState) {
  // Find and trigger changes for listeners
  for (var key of Object.keys(newState)) {
    if (typeof this.store[key] === 'undefined') {
      this.createItemWrapper(key);
    }
    this.store[key].value = newState[key];

    this.triggerListeners(key);
  }
  return newState;
};

/**
 * createItemWrapper
 * @private
 * @param {string} key
 * @returns {object}
 */
PrivateStore.prototype.createItemWrapper = function createItemWrapper (key) {
  return this.store[key] = {
    listeners: [],
    value: null,
  };
};

/**
 * triggerListeners
 * @private
 * @param {string} key
 */
PrivateStore.prototype.triggerListeners = function triggerListeners (key) {
  var item = this.store[key];
  if (item) {
    item.listeners.forEach(listener => listener.handleUpdate(item.value));
  }
};

var copyAttrs = (newNode, oldNode) => {
  var oldAttrs = oldNode.attributes;
  var newAttrs = newNode.attributes;
  var attrNamespaceURI = null;
  var attrValue = null;
  var fromValue = null;
  var attrName = null;
  var attr = null;

  if (newAttrs) {
    for (var i = newAttrs.length - 1; i >= 0; --i) {
      attr = newAttrs[i];
      attrName = attr.name;
      attrNamespaceURI = attr.namespaceURI;
      attrValue = attr.value;
      // TODO: Change only specific parts of style
      // if (attr.name === 'style') {
      //   for (var item of newNode.style) {
      //     if (oldNode.style[item] !== newNode.style[item]) oldNode.style[item] = newNode.style[item]
      //   }
      //   continue;
      // }
      if (attrNamespaceURI) {
        attrName = attr.localName || attrName;
        fromValue = oldNode.getAttributeNS(attrNamespaceURI, attrName);
        if (fromValue !== attrValue) {
          oldNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
        }
      } else {
        if (!oldNode.hasAttribute(attrName)) {
          oldNode.setAttribute(attrName, attrValue);
        } else {
          fromValue = oldNode.getAttribute(attrName);
          if (fromValue !== attrValue) {
            // apparently values are always cast to strings, ah well
            if (attrValue === 'null' || attrValue === 'undefined') {
              oldNode.removeAttribute(attrName);
            } else {
              oldNode.setAttribute(attrName, attrValue);
            }
          }
        }
      }
    }
  }

  // Remove any extra attributes found on the original DOM element that
  // weren't found on the target element.
  if (oldAttrs) {
    for (var j = oldAttrs.length - 1; j >= 0; --j) {
      attr = oldAttrs[j];
      if (attr.specified !== false) {
        attrName = attr.name;
        attrNamespaceURI = attr.namespaceURI;

        if (attrNamespaceURI) {
          attrName = attr.localName || attrName;
          if (!newNode.hasAttributeNS(attrNamespaceURI, attrName)) {
            oldNode.removeAttributeNS(attrNamespaceURI, attrName);
          }
        } else {
          if (!newNode.hasAttributeNS(null, attrName)) {
            oldNode.removeAttribute(attrName);
          }
        }
      }
    }
  }
};

var destroy = node => {
  if (!(node instanceof Node)) { return; }
  var treeWalker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_ALL,
    el => true,
    false
  );

  var el;
  while((el = treeWalker.nextNode())) {
    if (el.listeners) {
      for (var i = 0; i < el.listeners.length; i++) {
        el.listeners[i].deattach();
      }
    }
    el.listeners = null;
    if (el.attributeListeners) {
      for (var i = 0; i < el.styleListeners.length; i++) {
        el.styleListeners[i].deattach();
      }
    }
    el.attributeListeners = null;
    if (el.styleListeners) {
      for (var i = 0; i < el.styleListeners.length; i++) {
        el.styleListeners[i].deattach();
      }
    }
    el.styleListeners = null;
    if (el.destroy) { el.destroy(); }
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
  if (node.listeners) {
    for (var i = 0; i < node.listeners.length; i++) {
      node.listeners[i].deattach();
    }
  }
  node.listeners = null;
  if (node.attributeListeners) {
    for (var i = 0; i < node.styleListeners.length; i++) {
      node.styleListeners[i].deattach();
    }
  }
  node.attributeListeners = null;
  if (node.styleListeners) {
    for (var i = 0; i < node.styleListeners.length; i++) {
      node.styleListeners[i].deattach();
    }
  }
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
};

/**
 * @param {HTMLElement} newNode
 * @param {HTMLElement} oldNode
 * @returns {ElementListener}
 */
var fuse = (toNode, fromNode, childOnly) => {
  if (Array.isArray(fromNode) || Array.isArray(toNode)) { childOnly = true; }

  if (!childOnly) {
    var nt1 = toNode.nodeType;
    var nt2 = fromNode.nodeType;

    if (nt1 === nt2 && (nt1 === 3 || nt2 === 8)) {
      if (!toNode.isEqualNode(fromNode)) {
        toNode.nodeValue = fromNode.nodeValue;
        destroy(fromNode);
      }
      return toNode;
    }

    if (fromNode.destroy || toNode.destroy || fromNode.__async || fromNode.__async
      || toNode.listeners || fromNode.listeners
      || nt1 === 3 || nt2 === 3) {
      if (!toNode.isEqualNode(fromNode)) {
        toNode.parentNode.insertBefore(fromNode, toNode);
        destroy(toNode);
      }
      return fromNode;
    }

    copyAttrs(fromNode, toNode);
  }

  var a1 = [ ...toNode.childNodes || toNode ];
  var a2 = [ ...fromNode.childNodes || fromNode ];
  var max = Math.max(a1.length, a2.length);

  for (var i = 0; i < max; i++) {
    if (a1[i] && a2[i]) {
      // Fuse
      fuse(a1[i], a2[i]);
    } else
    if (a1[i] && !a2[i]) {
      // Remove
      destroy(a1[i]);
    } else
    if (!a1[i] && a2[i]) {
      // Add
      toNode.appendChild(a2[i]);
    }
  }

  destroy(fromNode);
  return toNode;
};

var FuseDom = function FuseDom () {};

FuseDom.prototype.fuse = function fuse$1 (...args) {
  return fuse(...args);
};
FuseDom.prototype.destroy = function destroy$1 (...args) {
  return destroy(...args);
};

var fuseDom = new FuseDom();

/**
 * @param {*} obj
 * @returns {*}
 */
var clone = obj => {
  if (typeof obj !== 'object') { return obj; }
  if (obj === null) { return obj; }
  if (Array.isArray(obj)) { return obj.map(clone); }

  /*eslint-disable*/
  // Reverted as currently throws some errors
  var cloned = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = clone(obj[key]);
    }
  }
  /* eslint-enable */

  return cloned;
};

var skipInProductionAndTest = fn => {
  if (typeof process === 'undefined'
    || (process.env.NODE_ENV === 'production'
    || process.env.NODE_ENV === 'test')) {
    return false;
  }
  return fn && fn();
};

/* eslint-disable guard-for-in */

var Component = function Component(children, props) {
  this.addNonEnumerableProperties({
    $id: generateId(),
    $name: this.constructor.name,
    $config: (typeof this.config === 'function') ? this.config() : {
      listen: true,
    },
    $events: {},
    $privateStore: new PrivateStore(),
  });

  this.on = (typeof this.on === 'function') ? this.on() : {};
  this.children = [];

  // Appends headless components
  this.copyObjToInstance(GLOBALS.HEADLESS_COMPONENTS, 'head');

  this.state = Object.assign(
    (typeof this.state === 'function') ? this.state() : {},
    props || {}
  );

  skipInProductionAndTest(() => Object.freeze(this.state));

  if (children) { this.setChildren(children); }
};

/**
 * @returns {HTMLElement}
 */
Component.prototype.render = function render () {
  if (typeof this.view !== 'function') { return ''; }
  var rendered = this.view();
  if (Array.isArray(rendered)) {
    for (var i = 0; i < rendered.length; i++) {
      rendered[i].destroy = this.destroy.bind(this);
    }
  } else {
    rendered.destroy = this.destroy.bind(this);
  }
  this.html = rendered;
  return rendered;
};

/**
 * @param {object} props
 * @returns {Component}
 */
Component.prototype.setProps = function setProps (props) {
  this.setState(props);
  return this;
};

/**
 * @param {Node[]|*[]} children
 */
Component.prototype.setChildren = function setChildren (children) {
  this.children = children;
  this.setState();
  for (var i = 0; i < this.children.length; i++) {
    if (typeof this.children[i].when === 'function') {
      this.children[i].when('update', () => this.setState());
    }
  }
  return this;
};

/**
 * @private
 * @param {object} obj
 * @param {string} type
 */
Component.prototype.copyObjToInstance = function copyObjToInstance (obj, type) {
  for (var key in obj) {
    if (typeof this[key] !== 'undefined') {
      throw new Error(`[Radi.js] Error: Trying to write for reserved variable \`${key}\``);
    }
    this[key] = obj[key];
    if (type === 'head') { this[key].when('update', () => this.setState()); }
  }
};

/**
 * @private
 * @param {object} obj
 */
Component.prototype.addNonEnumerableProperties = function addNonEnumerableProperties (obj) {
  for (var key in obj) {
    if (typeof this[key] !== 'undefined') { continue; }
    Object.defineProperty(this, key, {
      value: obj[key],
    });
  }
};

/**
 * @param {string} key
 * @param {Listener} listener
 */
Component.prototype.addListener = function addListener (key, listener) {
  this.$privateStore.addListener(key, listener);
};

Component.prototype.mount = function mount () {
  this.trigger('mount');
};

Component.prototype.destroy = function destroy () {
  this.trigger('destroy');
  // if (this.html && this.html !== ''
  // && typeof this.html.remove === 'function') this.html.remove();
  this.$privateStore.removeListeners();
};

/**
 * @param {string} key
 * @param {function} fn
 */
Component.prototype.when = function when (key, fn) {
  if (typeof this.$events[key] === 'undefined') { this.$events[key] = []; }
  this.$events[key].push(fn);
};

/**
 * @param {string} key
 * @param {*} value
 */
Component.prototype.trigger = function trigger (key, ...args) {
  if (typeof this.on[key] === 'function') {
    this.on[key].call(this, ...args);
  }

  if (typeof this.$events[key] !== 'undefined') {
    for (var i in this.$events[key]) {
      this.$events[key][i].call(this, ...args);
    }
  }
};

/**
 * @param {object} newState
 */
Component.prototype.setState = function setState (newState) {
  if (typeof newState === 'object') {
    var oldstate = clone(this.state);
    this.state = Object.assign(oldstate, newState);

    skipInProductionAndTest(() => Object.freeze(this.state));

    if (this.$config.listen) {
      this.$privateStore.setState(newState);
    }
  } else {
    // console.error('[Radi.js] ERROR: Action did not return object to merge with state');
  }

  if (!this.$config.listen && typeof this.view === 'function' && this.html) {
    fuseDom.fuse(this.html, this.view());
  }
  this.trigger('update');
  return this.state;
};

/**
 * @returns {boolean}
 */
Component.isComponent = function isComponent () {
  return true;
};

/**
 * @param {Component} component
 * @param {string} id
 * @returns {HTMLElement|Node}
 */
var mount = (component, id) => {
  var container = document.createDocumentFragment();
  var slot = typeof id === 'string' ? document.getElementById(id) : id;
  var rendered =
    (component instanceof Component || component.render) ? component.render() : component;

  if (Array.isArray(rendered)) {
    for (var i = 0; i < rendered.length; i++) {
      mount(rendered[i], container);
    }
  } else {
    // Mount to container
    appendChild(container)(rendered);
  }

  // Mount to element
  slot.appendChild(container);

  if (typeof slot.destroy !== 'function') {
    slot.destroy = () => {
      for (var i = 0; i < rendered.length; i++) {
        fuseDom.destroy(rendered[i]);
      }
    };
  }

  if (typeof component.mount === 'function') { component.mount(); }

  return slot;
};

/**
 * @param {*} value
 * @returns {*[]}
 */
var ensureArray = value => {
  if (Array.isArray(value)) { return value; }
  return [value];
};

/**
 * @param {*} value - Value of the listener
 * @returns {Node[]}
 */
var listenerToNode = value => {
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes);
  }

  var element = document.createDocumentFragment();
  appendChildren(element, ensureArray(value));
  return listenerToNode(element);
};

var ElementListener = function ElementListener(ref) {
  var listener = ref.listener;
  var element = ref.element;

  this.listener = listener;
  this.element = element;
  this.listenerAsNode = [];
  this.attached = false;
  this.handleValueChange = this.handleValueChange.bind(this);
};

/**
 * Attaches listener to given element and starts listening.
 * @returns {ElementListener}
 */
ElementListener.prototype.attach = function attach () {
  if (!this.element.listeners) { this.element.listeners = []; }
  this.element.listeners.push(this);
  this.listener.onValueChange(this.handleValueChange);
  this.attached = true;
  return this;
};

/**
 * @param {*} value
 */
ElementListener.prototype.handleValueChange = function handleValueChange (value) {
  var newNode = listenerToNode(value);

  var i = 0;
  for (var node of newNode) {
    if (!this.listenerAsNode[i]) {
      this.listenerAsNode.push(this.element.appendChild(node));
    } else {
      this.listenerAsNode[i] = fuseDom.fuse(this.listenerAsNode[i], node);
    }
    i+=1;
  }

  if (i < this.listenerAsNode.length) {
    var nodesLeft = this.listenerAsNode.splice(i-this.listenerAsNode.length);
    for (var node$1 of nodesLeft) {
      fuseDom.destroy(node$1);
      // node.remove();
    }
  }
};

/**
 * @param {Node} newElement
 */
ElementListener.prototype.updateElement = function updateElement (newElement) {
  this.element = newElement;
  return this.element;
};

ElementListener.prototype.deattach = function deattach () {
  this.listener.deattach();
  this.listener = null;
  this.element = null;
  this.listenerAsNode = null;
  this.attached = false;
  this.handleValueChange = () => {};
};

/**
 * @param {Listener} listener
 * @param {HTMLElement} element
 * @returns {ElementListener}
 */
var appendListenerToElement = (listener, element) =>
  new ElementListener({
    listener,
    element,
  }).attach();

/* eslint-disable no-param-reassign */

/**
 * @param {HTMLElement} element
 * @returns {function(*)}
 */
var appendChild = element => child => {
  if (!child && typeof child !== 'number') {
    // Needs to render every child, even empty ones to preserve dom hierarchy
    child = '';
  }

  if (child instanceof Component) {
    mount(child, element);
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
    var executed = child();
    if (executed instanceof Promise) {
      var placeholder = document.createElement('selection');
      var el = element.appendChild(placeholder);
      el.__async = true;
      executed.then(local => {
        if (local.default && local.default.isComponent) {
          /* eslint-disable */
          appendChild(el)(new local.default());
          /* eslint-enable */
        } else
        if (typeof local.default === 'function') {
          var lazy = local.default();
          lazy.then(item => {
            if (item.default && item.default.isComponent) {
              /* eslint-disable */
              appendChild(el)(new item.default());
              /* eslint-enable */
            }
          });
        } else {
          appendChild(el)(local.default);
        }
      }).catch(console.warn);
    } else {
      appendChild(element)(executed);
    }
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
var appendChildren = (element, children) => {
  children.forEach(appendChild(element));
};

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
var r = (Query, props, ...children) => {
  if (typeof Query === 'function' && Query.isComponent) {
    return new Query(children).setProps(props || {});
  }

  if (typeof Query === 'function') {
    var propsWithChildren = props || {};
    propsWithChildren.children = children;
    return Query(propsWithChildren);
  }

  var element = getElementFromQuery(Query);

  if (props !== null) { setAttributes(element, props); }
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
var listen = (component, ...path) =>
  new Listener(component, ...path);

var remountActiveComponents = () => {
  Object.values(GLOBALS.ACTIVE_COMPONENTS).forEach(component => {
    if (typeof component.onMount === 'function') {
      component.onMount(component);
    }
  });
};

// Descriptor for actions
function action(target, key, descriptor) {
  var act = descriptor.value;
  descriptor.value = function (...args) {
    this.setState.call(this, act.call(this, ...args));
  };
  return descriptor;
}

var Radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  listen,
  l: listen,
  component: Component,
  Component,
  action,
  headless: (key, comp) => {
    // TODO: Validate component and key
    var mountedComponent = new comp();
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
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

if (window) { window.Radi = Radi; }

export default Radi;
//# sourceMappingURL=radi.es.js.map
