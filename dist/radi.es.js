var GLOBALS = {
  HEADLESS_COMPONENTS: {},
  FROZEN_STATE: false,
  VERSION: '0.3.12',
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
  this.attached = true;

  this.component.addListener(this.key, this);
  if (this.component.state) {
    this.handleUpdate(this.component.state[this.key]);
  }
};

Listener.prototype.deattach = function deattach () {
  this.component = null;
  this.attached = false;
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
  var newValue = this.processValue(this.getShallowValue(value), this.value);
  if (newValue instanceof Listener && this.value instanceof Listener) {
    this.value.deattach();
  }
  this.value = newValue;
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
      this.element.addEventListener('change', (e) => {
        this.listener.component.setState({
          [this.listener.key]: e.target.checked
        });
      });
    } else {
      this.element.addEventListener('input', (e) => {
        this.listener.component.setState({
          [this.listener.key]: e.target.value
        });
      });
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

    if (key.toLowerCase() === 'html') {
      element.innerHTML = value;
      return;
    }

    // TODO: FuseDom pass event listeners to new element
    if (key.toLowerCase() === 'model') {
      if (/(checkbox|radio)/.test(element.getAttribute('type'))) {
        element.onchange = (e) => {
          value.component[value.key] = e.target.checked;
        };
      } else {
        element.oninput = (e) => {
          value.component[value.key] = e.target.value;
        };
        element.value = value.value;
      }
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
var getElementFromQuery = (query, isSvg) => {
  if (typeof query === 'string' || typeof query === 'number')
    { return query !== 'template'
      ? isSvg || query === 'svg'
        ? document.createElementNS(
            "http://www.w3.org/2000/svg",
            query
          )
        : document.createElement(query)
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
    item.attached
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
    item.listeners.forEach(listener => {
      if (listener.attached) { listener.handleUpdate(item.value); }
    });
  }
};

function getElementAttributes(el) {
	return el.attributes;
}

function fuseAttributes(el, toEl, elAttributes) {
	var toElAttributes = toEl.attributes;

	for (var i = 0, l = toElAttributes.length; i < l; i++) {
		var toElAttr = toElAttributes.item(i);
		var toElAttrNamespaceURI = toElAttr.namespaceURI;
		var elAttr = toElAttrNamespaceURI ?
			elAttributes.getNamedItemNS(toElAttrNamespaceURI, toElAttr.name) :
			elAttributes.getNamedItem(toElAttr.name);

		if (elAttr && elAttr.name === 'style') {
			for (var style of toEl.style) {
				if (el.style[style] !== toEl.style[style]) {
					el.style[style] = toEl.style[style];
				}
			}
			continue;
		}

		if (!elAttr || elAttr.value != toElAttr.value) {
			if (toElAttrNamespaceURI) {
				el.setAttributeNS(toElAttrNamespaceURI, toElAttr.name, toElAttr.value);
			} else {
				el.setAttribute(toElAttr.name, toElAttr.value);
			}
		}
	}

	for (var i$1 = elAttributes.length; i$1;) {
		var elAttr$1 = elAttributes.item(--i$1);
		var elAttrNamespaceURI = elAttr$1.namespaceURI;

		if (elAttrNamespaceURI) {
			if (!toElAttributes.getNamedItemNS(elAttrNamespaceURI, elAttr$1.name)) {
				el.removeAttributeNS(elAttrNamespaceURI, elAttr$1.name);
			}
		} else {
			if (!toElAttributes.getNamedItem(elAttr$1.name)) {
				el.removeAttribute(elAttr$1.name);
			}
		}
	}
}

var destroy = node => {
	if (!(node instanceof Node)) { return; }
	var treeWalker = document.createTreeWalker(
		node,
		NodeFilter.SHOW_ALL,
		el => true,
		false
	);

	var el;
	var bulk = [];
	while((el = treeWalker.nextNode())) {
		if (el.listeners) {
			for (var i = 0; i < el.listeners.length; i++) {
				el.listeners[i].deattach();
			}
		}
		el.listeners = null;
		if (el.attributeListeners) {
			for (var i = 0; i < el.attributeListeners.length; i++) {
				el.attributeListeners[i].deattach();
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
		bulk.push(function() {
			if (el && el.parentNode) {
				el.parentNode.removeChild(el);
			}
		});
	}
	if (node.listeners) {
		for (var i = 0; i < node.listeners.length; i++) {
			node.listeners[i].deattach();
		}
	}
	node.listeners = null;
	if (node.attributeListeners) {
		for (var i = 0; i < node.attributeListeners.length; i++) {
			node.attributeListeners[i].deattach();
		}
	}
	node.attributeListeners = null;
	if (node.styleListeners) {
		for (var i = 0; i < node.styleListeners.length; i++) {
			node.styleListeners[i].deattach();
		}
	}
	node.styleListeners = null;

	node.styleListeners = null;
	if (node.destroy) { node.destroy(); }
	if (node.parentNode) {
		node.parentNode.removeChild(node);
		// node.remove()
	}

	// Removes all dom elements
	for (var i = 0; i < bulk.length; i++) {
		bulk[i]();
	}
	bulk = null;
};

function same (a, b) {
  if (a.id) { return a.id === b.id }
  if (a.isSameNode) { return a.isSameNode(b) }
  if (a.tagName !== b.tagName) { return false }
  if (a.type === 3) { return a.nodeValue === b.nodeValue }
  return false
}

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
			if (!same(toNode, fromNode)) {
			// if (!toNode.isEqualNode(fromNode)) {
				toNode.nodeValue = fromNode.nodeValue;
				destroy(fromNode);
			}
			return toNode;
		}

		if (fromNode.destroy || toNode.destroy
			|| fromNode.__async || toNode.__async
			|| toNode.listeners || fromNode.listeners
			|| nt1 === 3 || nt2 === 3
			|| nt1 === 1 || nt2 === 1) {
			if (!same(toNode, fromNode)) {
			// if (!toNode.isEqualNode(fromNode)) {
				toNode.parentNode.insertBefore(fromNode, toNode);
				destroy(toNode);
			}
			return fromNode;
		}

		// console.dir(fromNode)
		// if (fromNode.listeners) {
			fuseAttributes(toNode, fromNode, getElementAttributes(toNode));
		// }
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

  // Links headless components
  for (var key in GLOBALS.HEADLESS_COMPONENTS) {
    this[key].when('update', () => this.setState());
  }

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
Component.prototype.render = function render (isSvg) {
  if (typeof this.view !== 'function') { return ''; }
  var rendered = this.view();
  if (Array.isArray(rendered)) {
    for (var i = 0; i < rendered.length; i++) {
      if (typeof rendered[i].buildNode === 'function') {
        rendered[i] = rendered[i].buildNode(isSvg);
      }
      rendered[i].destroy = this.destroy.bind(this);
    }
  } else {
    if (typeof rendered.buildNode === 'function') {
      rendered = rendered.buildNode(isSvg);
    }
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
    var oldstate = this.state;

    skipInProductionAndTest(() => oldstate = clone(this.state));

    this.state = Object.assign(oldstate, newState);

    skipInProductionAndTest(() => Object.freeze(this.state));

    if (this.$config.listen) {
      this.$privateStore.setState(newState);
    }
  }

  if (!this.$config.listen && typeof this.view === 'function' && this.html) {
    fuseDom.fuse(this.html, this.view());
  }
  this.trigger('update');
  return newState;
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
 * @param {boolean} isSvg
 * @returns {HTMLElement|Node}
 */
var mount = (component, id, isSvg) => {
  var container = document.createDocumentFragment();
  var slot = typeof id === 'string' ? document.getElementById(id) : id;
  isSvg = isSvg || slot instanceof SVGElement;
  var rendered =
    (component instanceof Component || component.render) ? component.render(isSvg) : component;

  if (Array.isArray(rendered)) {
    for (var i = 0; i < rendered.length; i++) {
      mount(rendered[i], container, isSvg);
    }
  } else {
    // Mount to container
    appendChild(container, isSvg)(rendered);
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
 * @param {boolean} isSvg
 * @returns {function(*)}
 */
var appendChild = (element, isSvg) => child => {
  if (!child && typeof child !== 'number') {
    // Needs to render every child, even empty ones to preserve dom hierarchy
    child = '';
  }

  if (typeof child.buildNode === 'function') {
    appendChild(element, isSvg)(child.buildNode(isSvg));
    return;
  }

  if (child instanceof Component) {
    mount(child, element, isSvg);
    return;
  }

  if (child instanceof Listener) {
    appendListenerToElement(child, element);
    return;
  }

  if (Array.isArray(child)) {
    appendChildren(element, child, isSvg);
    return;
  }

  // Handles lazy loading components
  if (typeof child === 'function') {
    var executed = child();
    if (executed instanceof Promise) {
      var placeholder = document.createElement('section');
      placeholder.__async = true;
      var el = element.appendChild(placeholder);
      el.__async = true;
      executed.then(local => {
        if (local.default && local.default.isComponent) {
          /* eslint-disable */
          appendChild(el, isSvg)(new local.default());
          /* eslint-enable */
        } else
        if (typeof local.default === 'function') {
          var lazy = local.default();
          lazy.then(item => {
            if (item.default && item.default.isComponent) {
              /* eslint-disable */
              appendChild(el, isSvg)(new item.default());
              /* eslint-enable */
            }
          });
        } else {
          appendChild(el, isSvg)(local.default);
        }
      }).catch(console.warn);
    } else {
      appendChild(element, isSvg)(executed);
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
 * @param {boolean} isSvg
 */
var appendChildren = (element, children, isSvg) => {
  children.forEach(appendChild(element, isSvg));
};

var htmlCache = {};
var svgCache = {};

var memoizeHTML = query => htmlCache[query]
  || (htmlCache[query] = getElementFromQuery(query, false));
var memoizeSVG = query => svgCache[query]
  || (svgCache[query] = getElementFromQuery(query, true));

/**
 * @param {boolean} isSvg
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
var buildNode = (isSvg, Query, props, ...children) => {
  if (typeof Query === 'function' && Query.isComponent) {
    return new Query(children).setProps(props || {});
  }

  if (typeof Query === 'function') {
    var propsWithChildren = props || {};
    propsWithChildren.children = children;
    return Query(propsWithChildren);
  }

  var copyIsSvg = isSvg || Query === 'svg';

  var element = (copyIsSvg ? memoizeSVG(Query) : memoizeHTML(Query))
    .cloneNode(false);

  if (props !== null) { setAttributes(element, props); }
  appendChildren(element, children, copyIsSvg);

  return element;
};

var buildNode$1 = {
  html: (...args) => buildNode(false, ...args),
  svg: (...args) => buildNode(true, ...args),
};

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
var r = (Query, props, ...children) => ({
  buildNode: isSvg =>
    buildNode$1[isSvg ? 'svg' : 'html'](Query, props, ...children),
});

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

function createWorker(fn) {
  var fire = () => {};

  var blob = new Blob([`self.onmessage = function(e) {
    self.postMessage((${fn.toString()})(e.data));
  }`], { type: 'text/javascript' });

  var url = window.URL.createObjectURL(blob);
  var myWorker = new Worker(url);

  myWorker.onmessage = e => { fire(e.data, null); };
  myWorker.onerror = e => { fire(null, e.data); };

  return arg => new Promise((resolve, reject) => {
    fire = (data, err) => !err ? resolve(data) : reject(data);
    myWorker.postMessage(arg);
  })
}

// Descriptor for worker
function worker(target, key, descriptor) {
  var act = descriptor.value;

  var promisedWorker = createWorker(act);

  descriptor.value = function (...args) {
    promisedWorker(...args).then(newState => {
      this.setState.call(this, newState);
    });
  };
  return descriptor;
}

// Descriptor for actions
function action(target, key, descriptor) {
  var act = descriptor.value;
  descriptor.value = function (...args) {
    return this.setState.call(this, act.call(this, ...args));
  };
  return descriptor;
}

// Descriptor for subscriptions
function subscribe(container, eventName, triggerMount) {
  // TODO: Remove event after no longer needed / Currently overrides existing
  // TODO: Do not override existing event - use EventListener
  // TODO: triggerMount should trigger this event on mount too
  return function (target, key, descriptor) {
    var name = 'on' + (eventName || key);
    var fn = function (...args) {
      return descriptor.value.call(this, ...args);
    };

    container[name] = fn;
    // if (container && container.addEventListener) {
    //   container.addEventListener(name, fn);
    //   self.when('destroy', () => {
    //     container.removeEventListener(name, fn);
    //   });
    // }
    // console.log(target, key, descriptor, container[name], name, fn, fn.radiGlobalEvent);
    return descriptor;
  }
}

var Radi = {
  version: GLOBALS.VERSION,
  activeComponents: GLOBALS.ACTIVE_COMPONENTS,
  r,
  listen,
  l: listen,
  worker,
  component: Component,
  Component,
  action,
  subscribe,
  headless: (key, comp) => {
    // TODO: Validate component and key
    var name = '$'.concat(key);
    var mountedComponent = new comp();
    mountedComponent.mount();
    Component.prototype[name] = mountedComponent;
    return GLOBALS.HEADLESS_COMPONENTS[name] = mountedComponent;
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
