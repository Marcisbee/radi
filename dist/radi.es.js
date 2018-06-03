var GLOBALS = {
  HEADLESS_COMPONENTS: {},
  FROZEN_STATE: false,
  VERSION: '0.3.19',
  ACTIVE_COMPONENTS: {},
  HTML_CACHE: {},
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
		bulk.push((el => {
			if (el && el.destroy) { el.destroy(); }
			if (el && el.parentNode) {
				el.parentNode.removeChild(el);
			}
		}).bind(null, el));
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

		if (toNode.isPointer || fromNode.isPointer || toNode.destroy || fromNode.destroy) {
			toNode.parentNode.insertBefore(fromNode, toNode);
			destroy(toNode);
			return fromNode;
		}

		if (nt1 === nt2 && (nt1 === 3 || nt2 === 8)) {
			if (toNode.nodeValue !== fromNode.nodeValue) {
				toNode.nodeValue = fromNode.nodeValue;
				destroy(fromNode);
			}
			return toNode;
		}

		// if (nt1 === 1 || nt2 === 1) {
		// 	toNode.replaceWith(fromNode);
		// 	destroy(toNode);
		// 	return fromNode;
		// }
		if ((nt1 === 1 || nt2 === 1)
			&& (toNode.tagName !== fromNode.tagName)
			|| (toNode.__async || fromNode.__async)
			|| (toNode.listeners && toNode.listeners.length || fromNode.listeners && fromNode.listeners.length)) {
			if (toNode.parentNode) {
				toNode.parentNode.insertBefore(fromNode, toNode);
				destroy(toNode);
				return fromNode;
			} else {
				toNode.replaceWith(fromNode);
				destroy(toNode);
				return fromNode;
			}
		}

		fuseAttributes(toNode, fromNode, getElementAttributes(toNode));
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

/* eslint-disable no-param-reassign */

var Listener = function Listener(component, ...path) {
  var assign;

  this.component = component;
  (assign = path, this.key = assign[0]);
  this.path = path.slice(1, path.length);
  this.depth = 0;
  this.attached = true;
  this.processValue = value => value;
  this.changeListener = () => {};
};

/**
 * Applies values and events to listener
 */
Listener.prototype.init = function init () {
  this.value = this.getValue(this.component.state[this.key]);
  this.component.addListener(this.key, this, this.depth);
  this.handleUpdate(this.component.state[this.key]);
  return this;
};

/**
 * Removes last active value with destroying listeners and
 * @param {*} value
 */
Listener.prototype.unlink = function unlink () {
  if (this.value instanceof Node) {
    // Destroy this Node
    fuseDom.destroy(this.value);
  } else
  if (this.value instanceof Listener) {
    // Deattach this Listener
    this.value.deattach();
  }
};


Listener.prototype.clone = function clone (target, source) {
  var out = {};

  for (var i in target) {
    out[i] = target[i];
  }
  for (var i$1 in source) {
    out[i$1] = source[i$1];
  }

  return out;
};

Listener.prototype.setPartialState = function setPartialState (path, value, source) {
  var target = {};
  if (path.length) {
    target[path[0]] =
      path.length > 1
        ? this.setPartialState(path.slice(1), value, source[path[0]])
        : value;
    return this.clone(source, target);
  }
  return value;
};

/**
 * Updates state value
 * @param {*} value
 */
Listener.prototype.updateValue = function updateValue (value) {
  var source = this.component.state[this.key];
  return this.component.setState({
    [this.key]: this.setPartialState(this.path, value, source),
  });
};

/**
 * @param {*} value
 */
Listener.prototype.handleUpdate = function handleUpdate (value) {
  var newValue = this.processValue(this.getValue(value));
  if (this.value instanceof Listener && newValue instanceof Listener) {
    this.value.processValue = newValue.processValue;
    this.value.handleUpdate(this.value.component.state[this.value.key]);
    newValue.deattach();
  } else {
    this.unlink();
    this.value = newValue;
    this.changeListener(this.value);
  }
};

/**
 * @param {*} source
 * @returns {*}
 */
Listener.prototype.getValue = function getValue (source) {
  var i = 0;
  while (i < this.path.length) {
    source = source[this.path[i++]];
  }
  return source;
};

/**
 * @param {number} depth
 * @returns {Listener}
 */
Listener.prototype.applyDepth = function applyDepth (depth) {
  this.depth = depth;
  return this;
};

/**
 * @param {function(*)} changeListener
 */
Listener.prototype.onValueChange = function onValueChange (changeListener) {
  this.changeListener = changeListener;
  this.changeListener(this.value);
};

/**
 * @param {function(*): *} processValue
 * @returns {function(*): *}
 */
Listener.prototype.process = function process (processValue) {
  this.processValue = processValue;
  return this;
};

Listener.prototype.deattach = function deattach () {
  this.component = null;
  this.attached = false;
  this.key = null;
  this.childPath = null;
  this.path = null;
  this.unlink();
  this.value = null;
  this.processValue = () => {};
};

var AttributeListener = function AttributeListener(ref) {
  var attributeKey = ref.attributeKey;
  var listener = ref.listener;
  var element = ref.element;
  var depth = ref.depth;

  this.depth = depth + 1;
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
  this.listener.applyDepth(this.depth).init();
  this.listener.onValueChange(this.handleValueChange);
  this.attached = true;

  if (this.attributeKey === 'model') {
    if (/(checkbox|radio)/.test(this.element.getAttribute('type'))) {
      this.element.addEventListener('change', (e) => {
        this.listener.updateValue(e.target.checked);
      });
    } else {
      this.element.addEventListener('input', (e) => {
        this.listener.updateValue(e.target.value);
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

AttributeListener.prototype.deattach = function deattach () {
  this.attributeKey = null;
  this.listener.deattach();
  this.listener = null;
  this.element = null;
  this.attached = false;
  this.handleValueChange = () => {};
};

var StyleListener = function StyleListener(ref) {
  var styleKey = ref.styleKey;
  var listener = ref.listener;
  var element = ref.element;
  var depth = ref.depth;

  this.depth = depth + 1;
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
  this.listener.applyDepth(this.depth).init();
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
 * @param {number} depth
 * @returns {*}
 */
var setStyle = (element, property, value, depth) => {
  if (typeof value === 'undefined') { return undefined; }

  if (value instanceof Listener) {
    new StyleListener({
      styleKey: property,
      listener: value,
      element,
      depth,
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
 * @param {number} depth
 */
var setAttributes = (element, attributes, depth) => {
  var loop = function ( key ) {
    var value = attributes[key];

    if (typeof value === 'undefined') { return; }

    if (!value && typeof value !== 'number') {
      // Need to remove falsy attribute
      element.removeAttribute(key);
      return;
    }

    if (key.toLowerCase() === 'style') {
      setStyles(element, value, depth);
      return;
    }

    if (value instanceof Listener) {
      new AttributeListener({
        attributeKey: key,
        listener: value,
        element,
        depth,
      }).attach();
      return;
    }

    if (key.toLowerCase() === 'class' || key.toLowerCase() === 'classname') {
      element.setAttribute('class', parseClass(value));
      return;
    }

    if (key.toLowerCase() === 'loadfocus') {
      element.onload = (el) => {
        setTimeout(() => {
          el.focus();
        }, 10);
      };
    }

    if (key.toLowerCase() === 'html') {
      element.innerHTML = value;
      return;
    }

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
            if ((input.name !== ''
              && (input.type !== 'radio' && input.type !== 'checkbox'))
              || input.checked) {
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
              if (!data[item.name]) {
                Object.defineProperty(data, item.name, {
                  value: item,
                });
              }
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
 * @param {number} depth
 */
PrivateStore.prototype.addListener = function addListener (key, listener, depth) {
  if (typeof this.store[key] === 'undefined') {
    this.createItemWrapper(key);
  }
  this.store[key].listeners[depth] = (this.store[key].listeners[depth] || []).filter(item => (
    item.attached
  ));
  this.store[key].listeners[depth].push(listener);

  return listener;
};

/**
 * Removes all listeners for all keys
 */
PrivateStore.prototype.removeListeners = function removeListeners () {
  var o = Object.keys(this.store);
  for (var i = 0; i < o.length; i++) {
    this.store[o[i]].listeners = {};
    this.store[o[i]].value = null;
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
    listeners: {},
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
    var clone = Object.keys(item.listeners)
      .sort()
      .map(key => (
        item.listeners[key].map(listener => listener)
      ));

    for (var i = 0; i < clone.length; i++) {
      for (var n = clone[i].length - 1; n >= 0; n--) {
        if (clone[i][n].attached) { clone[i][n].handleUpdate(item.value); }
      }
    }
  }
};

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
        rendered[i] = rendered[i].buildNode(isSvg, 0);
      }
      rendered[i].destroy = this.destroy.bind(this);
    }
  } else {
    if (typeof rendered.buildNode === 'function') {
      rendered = rendered.buildNode(isSvg, 0);
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
  var newState = {};
  var loop = function ( key ) {
    if (props[key] instanceof Listener) {
      newState[key] = props[key].init().value;
      props[key].changeListener = value => {
        this.setState({
          [key]: value,
        });
      };
    } else {
      newState[key] = props[key];
    }
  };

    for (var key in props) loop( key );
  this.setState(newState);
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
 * @param {number} depth
 */
Component.prototype.addListener = function addListener (key, listener, depth) {
  this.$privateStore.addListener(key, listener, depth);
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
 * @param {number} depth
 * @returns {HTMLElement|Node}
 */
var mount = (component, id, isSvg, depth) => {
  if ( depth === void 0 ) depth = 0;

  var slot = typeof id === 'string' ? document.getElementById(id) : id;
  isSvg = isSvg || slot instanceof SVGElement;
  var rendered =
    (component instanceof Component || component.render) ? component.render(isSvg) : component;

  if (Array.isArray(rendered)) {
    for (var i = 0; i < rendered.length; i++) {
      mount(rendered[i], slot, isSvg, depth);
    }
  } else {
    appendChild(slot, isSvg, depth)(rendered);
  }

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
 * @param {boolean} isSvg
 * @param {number} depth
 * @param {HTMLElement} after - Element after to append
 * @param {function} customAppend
 * @returns {Node[]}
 */
var listenerToNode = (value, isSvg, depth, after, customAppend) => {
  if (value instanceof DocumentFragment) {
    return Array.from(value.childNodes);
  }

  var element = after || document.createDocumentFragment();
  if (after instanceof Node) {
    element.appendChild = customAppend;
  }
  appendChildren(element, ensureArray(value), isSvg, depth);
  return Array.from(element.childNodes);
};

/**
 * @param {HTMLElement} beforeNode
 * @param {HTMLElement} newNode
 * @returns {HTMLElement}
 */
var insertAfter = (beforeNode, newNode) => (
  beforeNode.parentNode && beforeNode.parentNode.insertBefore(newNode, beforeNode.nextSibling)
);

var ElementListener = function ElementListener(ref) {
  var listener = ref.listener;
  var element = ref.element;
  var depth = ref.depth;

  this.depth = depth + 1;
  this.pointer = document.createTextNode('');
  this.pointer.isPointer = true;
  this.pointer.destroy = () => {
    if (this.listenerAsNode && this.listenerAsNode.length) {
      for (var i = 0; i < this.listenerAsNode.length; i++) {
        if (this.listenerAsNode[i]) { fuseDom.destroy(this.listenerAsNode[i]); }
      }
    }
    this.listenerAsNode = null;
    if (this.pointer && this.pointer.remove) { this.pointer.remove(); }
    this.pointer = null;
  };
  this.listener = listener;
  this.element = element.real || element;
  this.listenerAsNode = [];
  this.attached = false;
};

/**
 * Inserts new nodes after pointer.
 * @param {Node} after
 * @param {[*]} value
 * @returns {Node}
 */
ElementListener.prototype.insert = function insert (after, value) {
  for (var i = 0; i < value.length; i++) {
    insertAfter(value[i - 1] || after, value[i]);
  }
};

/**
 * @param {*} value
 */
ElementListener.prototype.handleValueChange = function handleValueChange (value) {
  if (!this.attached || this.listenerAsNode === null) { return false; }
  var newNodeContainer = document.createDocumentFragment();
  listenerToNode(value, this.element instanceof SVGElement, this.depth, this.pointer, element => {
    newNodeContainer.appendChild(element);
    return element;
  });
  var newNode = Array.from(newNodeContainer.childNodes);

  var length = Math.min(newNode.length, this.listenerAsNode.length);

  for (var i = 0; i < length; i++) {
    newNode[i] = fuseDom.fuse(this.listenerAsNode[i], newNode[i]);
  }

  var diff = this.listenerAsNode.length - newNode.length;

  if (diff > 0) {
    for (var n = i; n < i + diff; n++) {
      fuseDom.destroy(this.listenerAsNode[n]);
    }
  } else
  if (diff < 0) {
    this.insert(i > 0 ? newNode[i - 1] : this.pointer, newNode.slice(i, newNode.length));
  }

  this.listenerAsNode = newNode;
};

/**
 * Attaches listener to given element and starts listening.
 * @returns {ElementListener}
 */
ElementListener.prototype.attach = function attach (element) {
    if ( element === void 0 ) element = this.element;

  element.appendChild(this.pointer);
  if (!element.listeners) { element.listeners = []; }
  element.listeners.push(this);
  this.listener.applyDepth(this.depth).init();
  this.attached = true;
  this.listener.onValueChange(value => this.handleValueChange(value));
  return this;
};

/**
 * Deattaches and destroys listeners
 */
ElementListener.prototype.deattach = function deattach () {
  this.listener.deattach();
  this.listener = null;
  this.element = null;
  if (this.listenerAsNode && this.listenerAsNode.length) {
    for (var i = 0; i < this.listenerAsNode.length; i++) {
      if (this.listenerAsNode[i]) { fuseDom.destroy(this.listenerAsNode[i]); }
    }
  }
  this.listenerAsNode = null;
  if (this.pointer && this.pointer.remove) { this.pointer.remove(); }
  this.pointer = null;
  this.attached = false;
  this.handleValueChange = () => {};
};

/**
 * @param {Listener} listener
 * @param {HTMLElement} element
 * @param {number} depth
 * @returns {ElementListener}
 */
var appendListenerToElement = (listener, element, depth) =>
  new ElementListener({
    listener,
    element,
    depth,
  }).attach();

/* eslint-disable no-param-reassign */

/**
 * @param {HTMLElement} element
 * @param {boolean} isSvg
 * @param {number} depth
 * @returns {function(*)}
 */
var appendChild = (element, isSvg, depth) => child => {
  if (!child && typeof child !== 'number') {
    // Needs to render every child, even empty ones to preserve dom hierarchy
    child = '';
  }

  if (typeof child.buildNode === 'function') {
    appendChild(element, isSvg, depth)(child.buildNode(isSvg, depth));
    return;
  }

  if (child instanceof Component) {
    mount(child, element, isSvg, depth);
    return;
  }

  if (child.isComponent) {
    /*eslint-disable*/
    mount(new child(), element, isSvg, depth);
    /* eslint-enable */
    return;
  }

  if (child instanceof Listener) {
    appendListenerToElement(child.applyDepth(depth), element, depth);
    return;
  }

  if (Array.isArray(child)) {
    appendChildren(element, child, isSvg, depth);
    return;
  }

  if (typeof child === 'function') {
    appendChild(element, isSvg, depth)(child());
    return;
  }

  // Handles lazy loading components
  if (child instanceof Promise || child.constructor.name === 'LazyPromise') {
    var placeholder = document.createElement('section');
    placeholder.__async = true;
    var el = element.appendChild(placeholder);
    child.then(data => {
      if (data.default) {
        appendChild(el, isSvg, depth)(data.default);
      } else {
        appendChild(el, isSvg, depth)(data);
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
 * @param {boolean} isSvg
 * @param {number} depth
 */
var appendChildren = (element, children, isSvg, depth) => {
  children.forEach(appendChild(element, isSvg, depth));
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
var buildNode = (isSvg, depth, Query, props, ...children) => {
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

  if (props !== null) { setAttributes(element, props, depth); }
  appendChildren(element, children, copyIsSvg, depth);

  if (element.onload) { element.onload(element); }

  return element;
};

var buildNode$1 = {
  html: depth => (...args) => buildNode(false, depth, ...args),
  svg: depth => (...args) => buildNode(true, depth, ...args),
};

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {(HTMLElement|Component)}
 */
var r = (Query, props, ...children) => ({
  buildNode: (isSvg, depth) =>
    {
      if ( depth === void 0 ) depth = 0;

      return buildNode$1[isSvg ? 'svg' : 'html'](depth)(Query, props, ...children);
  },
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
// export default Radi;
module.exports = Radi;
//# sourceMappingURL=radi.es.js.map
