var GLOBALS = {
  HEADLESS_COMPONENTS: {},
  FROZEN_STATE: false,
  VERSION: '0.4.2',
  // TODO: Collect active components
  ACTIVE_COMPONENTS: {},
  CUSTOM_ATTRIBUTES: {},
  CUSTOM_TAGS: {},
};

/**
 * @param {*[]} list
 * @returns {*[]}
 */
var flatten = function flatten(list) {
  return list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
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

/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
// import fuseDom from '../r/utils/fuseDom';

var Listener = function Listener(component, ...path) {
  var assign;

  this.component = component;
  (assign = path, this.key = assign[0]);
  this.path = path.slice(1, path.length);
  this.depth = 0;
  this.attached = true;
  this.processValue = value => value;
  this.changeListener = () => {};
  this.addedListeners = [];
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
    // fuseDom.destroy(this.value);
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

Listener.prototype.extractListeners = function extractListeners (value) {
  // if (this.value instanceof Listener && value instanceof Listener) {
  // console.log('middle')
  // } else
  if (value instanceof Listener) {
    // if (this.value instanceof Listener) {
    // this.value.processValue = value.processValue;
    // // this.value = value;
    // this.handleUpdate(value.getValue(value.component.state[value.key]));
    // console.log(value, value.getValue(value.component.state[value.key]));
    // value.deattach();
    // }
    // value.component.addListener(value.key, value, value.depth);
    // value.handleUpdate = () => {
    // console.log('inner handler')
    // }
    var tempListener = {
      depth: value.depth,
      attached: true,
      processValue: value => value,
      handleUpdate: () => {
        if (this.component) {
          this.handleUpdate(this.getValue(this.component.state[this.key]));
        }
        tempListener.attached = false;
      },
      changeListener: () => {},
    };
    this.addedListeners.push(tempListener);
    value.component.addListener(value.key, tempListener, value.depth);
    // value.init()
    // value.handleUpdate = () => {
    // console.log('inner handler')
    // }
    // value.onValueChange((v) => {
    // this.handleUpdate(this.getValue(this.component.state[this.key]));
    // console.log('me got changed', v)
    // });
    var newValue = value.processValue(
      value.getValue(value.component.state[value.key])
    );
    value.deattach();
    return this.extractListeners(newValue);
  }
  return value;

  // return this.processValue(this.getValue(value));
};

/**
 * @param {*} value
 */
Listener.prototype.handleUpdate = function handleUpdate (value) {
  var newValue = this.processValue(this.getValue(value));
  // if (this.value instanceof Listener && newValue instanceof Listener) {
  // this.value.processValue = newValue.processValue;
  // // this.value = newValue;
  // this.value.handleUpdate(newValue.component.state[newValue.key]);
  // console.log(newValue, newValue.getValue(newValue.component.state[newValue.key]));
  // newValue.deattach();
  // } else
  if (newValue instanceof Listener) {
    // if (this.value instanceof Listener) {
    // this.value.processValue = newValue.processValue;
    // // this.value = newValue;
    // this.value.handleUpdate(newValue.component.state[newValue.key]);
    // console.log(newValue, newValue.getValue(newValue.component.state[newValue.key]));
    // newValue.deattach();
    // } else {
    for (var i = 0; i < this.addedListeners.length; i++) {
      this.addedListeners[i].attached = false;
    }
    this.addedListeners = [];
    this.value = this.extractListeners(newValue);
    this.changeListener(this.value);
    // }
    // // console.log(this.value.processValue('P'), newValue.processValue('A'));
    // // console.log(this.extractListeners(newValue));
    // // newValue.handleUpdate(newValue.component.state[newValue.key]);
    // // this.value = newValue;
    // // this.value.processValue = newValue.processValue;
    // this.value = this.extractListeners(newValue);
    // this.changeListener(this.value);
    // // this.value.processValue = newValue.processValue;
    // // // this.value = newValue;
    // // this.value.handleUpdate(newValue.component.state[newValue.key]);
    // // console.log(newValue, newValue.getValue(newValue.component.state[newValue.key]));
    // // newValue.deattach();
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
    if (source === null
      || (!source[this.path[i]]
      && typeof source[this.path[i]] !== 'number')) {
      source = null;
    } else {
      source = source[this.path[i]];
    }
    i += 1;
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
  this.changeListener = () => {};
  this.processValue = () => {};
};

var onMountEvent = document.createEvent('Event');
onMountEvent.initEvent('mount', true, true);

var onLoadEvent = document.createEvent('Event');
onLoadEvent.initEvent('load', true, true);

/**
 * Append dom node to dom tree (after - (true) should append after 'to' element
 * or (false) inside it)
 * @param {HTMLElement} node
 * @param {HTMLElement} to
 * @param {Boolean} after
 * @returns {HTMLElement}
 */
var append = (node, to, after) => {
  if (typeof node.dispatchEvent === 'function') {
    node.dispatchEvent(onLoadEvent);
  }

  if (after && to) {
    if (to.parentNode) {
      to.parentNode.insertBefore(node, to);
      if (typeof node.dispatchEvent === 'function') {
        node.dispatchEvent(onMountEvent);
      }
      // if (!to.nextSibling) {
      //   to.parentNode.appendChild(node);
      // } else {
      //   to.parentNode.insertBefore(node, to.nextSibling || to);
      // }
    }
    return node;
  }

  to.appendChild(node);

  if (typeof node.dispatchEvent === 'function') {
    node.dispatchEvent(onMountEvent);
  }

  return node;
};

var getLast = (child) => {
  if (child.$redirect && child.$redirect[child.$redirect.length - 1]) {
    return getLast(child.$redirect[child.$redirect.length - 1]);
  }

  // if (child.children && child.children.length > 0) {
  //   return child.children;
  // }

  return child;
};

/**
 * @param {Structure} child
 */
var mountChildren = (child, isSvg, depth) => {
  if ( depth === void 0 ) depth = 0;

  if (!child) { return; }

  if (child.$redirect && child.$redirect.length > 0) {
    mountChildren(getLast(child), isSvg, depth + 1);
  } else if (child.children && child.children.length > 0) {
    if (child.html && child.html.length === 1) {
      mount(child.children,
        child.html[0],
        child.html[0].nodeType !== 1,
        child.$isSvg,
        child.$depth);
    } else {
      mount(child.children,
        child.$pointer,
        true,
        child.$isSvg,
        child.$depth);
    }
  }
};

/**
 * @param {string} value
 * @returns {HTMLElement}
 */
var textNode = value => (
  document.createTextNode(
    (typeof value === 'object'
    ? JSON.stringify(value)
    : value)
  )
);

// import Component from './component/Component';

/**
 * Appends structure[] to dom node
 * @param {*} component
 * @param {string} id
 * @param {boolean} isSvg
 * @param {number} depth
 * @returns {HTMLElement|Node}
 */
var mount = (raw, parent, after, isSvg, depth) => {
  if ( after === void 0 ) after = false;
  if ( isSvg === void 0 ) isSvg = false;
  if ( depth === void 0 ) depth = 0;

  parent = typeof parent === 'string' ? document.getElementById(parent) : parent;
  var nodes = flatten([raw]).map(filterNode);

  // console.log(1, 'MOUNT')

  var loop = function ( i ) {
    var nn = nodes[i];

    // console.log(2, nodes[i])
    if (nn instanceof Node) {
      append(nn, parent, after);
    } else
    if (nn && typeof nn.render === 'function') {
      // nn.$pointer = text('[pointer]');
      nn.$pointer = textNode('');
      append(nn.$pointer, parent, after);

      nodes[i].render(rendered => {
        // console.log(3, rendered)

        // Abort! Pointer was destroyed
        if (nn.$pointer === false) { return false; }

        for (var n = 0; n < rendered.length; n++) {
          if (nn.$pointer) {
            append(rendered[n], nn.$pointer, true);
          } else {
            append(rendered[n], parent, after);
          }
        }

        mountChildren(nn, nn.$isSvg, depth + 1);
      }, nn, depth, isSvg);
    }

    // if (!nn.html) {
    //   nn.$pointer = text('[pointer]');
    //   append(nn.$pointer, parent, after);
    // }
  };

  for (var i = 0; i < nodes.length; i++) loop( i );

  return nodes;
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
 * @param {*[]} raw
 * @param {HTMLElement} parent
 * @param {string} raw
 * @returns {HTMLElement}
 */
var explode = (raw, parent, next, depth, isSvg) => {
  if ( depth === void 0 ) depth = 0;

  var nodes = flatten([raw]).map(filterNode);
  // console.log('EXPLODE', nodes)

  // console.log('explode', {parent, nodes})

  for (var i = 0; i < nodes.length; i++) {
    if ((nodes[i] instanceof Structure || nodes[i].isStructure) && !nodes[i].html) {
      // let pp = depth === 0 ? parent : nodes[i];
      // let pp = parent;
      // console.log('EXPLODE 1', parent.$depth, depth, parent.$redirect, nodes[i].$redirect)
      if (parent.children.length <= 0) {
        if (!parent.$redirect) {
          parent.$redirect = [nodes[i]];
        } else {
          parent.$redirect.push(nodes[i]);
        }
      }

      if (!parent.$redirect && nodes[i].children) {
        parent.children = parent.children.concat(nodes[i].children);
      }

      if (typeof nodes[i].render === 'function') {
        nodes[i].render(v => {
          // if (parent.children.length <= 0) {
          //   if (!parent.$redirect) {
          //     parent.$redirect = [nodes[n]];
          //   } else {
          //     parent.$redirect.push(nodes[n]);
          //   }
          // }
          // console.log('EXPLODE 2', nodes[n], v, parent.$depth, nodes[n].$depth)
          next(v);
          // nodes[n].mount();
        }, nodes[i], depth + 1, isSvg);
      }
    }
  }

  return;
};

/**
 * @param {*} value
 * @return {*}
 */
var parseValue = value =>
  typeof value === 'number' && !Number.isNaN(value) ? `${value}px` : value;

/* eslint-disable no-continue */

/**
 * @param {Structure} structure
 * @param {object} styles
 * @param {object} oldStyles
 * @returns {object}
 */
var setStyles = (structure, styles, oldStyles) => {
  if ( styles === void 0 ) styles = {};
  if ( oldStyles === void 0 ) oldStyles = {};

  if (!structure.html || !structure.html[0]) { return styles; }
  var element = structure.html[0];

  // Handle Listeners
  if (styles instanceof Listener) {
    if (typeof structure.$styleListeners.general !== 'undefined') {
      return element.style;
    }
    structure.$styleListeners.general = styles;
    structure.$styleListeners.general.applyDepth(structure.depth).init();

    structure.$styleListeners.general.onValueChange(value => {
      setStyles(structure, value, {});
    });

    return element.style;
  }

  if (typeof styles === 'string') {
    element.style = styles;
    return element.style;
  }

  var toRemove = Object.keys(oldStyles)
    .filter(key => typeof styles[key] === 'undefined');

  var loop = function ( style ) {
    if (styles.hasOwnProperty(style)) {
      // Skip if styles are the same
      if (typeof oldStyles !== 'undefined' && oldStyles[style] === styles[style]) { return; }

      // Need to remove falsy style
      if (!styles[style] && typeof styles[style] !== 'number') {
        element.style[style] = null;
        return;
      }

      // Handle Listeners
      if (styles[style] instanceof Listener) {
        if (typeof structure.$styleListeners[style] !== 'undefined') { return; }
        structure.$styleListeners[style] = styles[style];
        structure.$styleListeners[style].applyDepth(structure.depth).init();

        structure.$styleListeners[style].onValueChange(value => {
          setStyles(structure, {
            [style]: value,
          }, {});
        });

        styles[style] = structure.$styleListeners[style].value;
        return;
      }

      element.style[style] = parseValue(styles[style]);
    }
  };

  for (var style in styles) loop( style );

  for (var i = 0; i < toRemove.length; i++) {
    element.style[toRemove[i]] = null;
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

/* eslint-disable no-continue */
// import AttributeListener from './utils/AttributeListener';

/**
 * @param {Structure} structure
 * @param {object} propsSource
 * @param {object} oldPropsSource
 */
var setAttributes = (structure, propsSource, oldPropsSource) => {
  if ( propsSource === void 0 ) propsSource = {};
  if ( oldPropsSource === void 0 ) oldPropsSource = {};

  var props = propsSource || {};
  var oldProps = oldPropsSource || {};

  if (!structure.html || !structure.html[0]) { return structure; }
  var element = structure.html[0];

  if (!(element instanceof Node && element.nodeType !== 3)) { return structure; }

  var toRemove = Object.keys(oldProps)
    .filter(key => typeof props[key] === 'undefined');

  var loop = function ( prop ) {
    if (props.hasOwnProperty(prop)) {
      // Skip if proprs are the same
      if (typeof oldProps !== 'undefined' && oldProps[prop] === props[prop]) { return; }

      if (prop === 'checked') {
        element.checked = props[prop];
      }

      // Need to remove falsy attribute
      if (!props[prop] && typeof props[prop] !== 'number' && typeof props[prop] !== 'string') {
        element.removeAttribute(prop);
        return;
      }

      // Handle Listeners
      if (props[prop] instanceof Listener) {
        if (typeof structure.$attrListeners[prop] !== 'undefined') { return; }
        structure.$attrListeners[prop] = props[prop];
        props[prop].applyDepth(structure.depth).init();

        if (prop.toLowerCase() === 'model' || prop.toLowerCase() === 'checked') {
          if (element.getAttribute('type') === 'radio') {
            element.addEventListener('input', (e) => {
              structure.$attrListeners[prop].updateValue(
                (e.target.checked && e.target.value)
                || e.target.checked
              );
            }, false);
            structure.$attrListeners[prop].onValueChange(value => {
              setAttributes(structure, {
                checked: element.value === value && Boolean(value),
              }, {});
            });
          } else
          if (element.getAttribute('type') === 'checkbox') {
            element.addEventListener('input', (e) => {
              structure.$attrListeners[prop].updateValue(
                Boolean(e.target.checked)
              );
            }, false);
            structure.$attrListeners[prop].onValueChange(value => {
              setAttributes(structure, {
                checked: Boolean(value),
              }, {});
            });
          } else {
            element.addEventListener('input', (e) => {
              structure.$attrListeners[prop].updateValue(e.target.value);
            }, false);
          }
        }

        if (!/(checkbox|radio)/.test(element.getAttribute('type'))) {
          structure.$attrListeners[prop].onValueChange(value => {
            setAttributes(structure, {
              [prop]: value,
            }, {});
          });
        }

        // structure.setProps(Object.assign(structure.data.props, {
        //   [prop]: props[prop].value,
        // }));
        props[prop] = structure.$attrListeners[prop].value;
        return;
      }

      if (prop === 'value' || prop === 'model') {
        element.value = props[prop];
      }

      if (typeof GLOBALS.CUSTOM_ATTRIBUTES[prop] !== 'undefined') {
        var ref = GLOBALS.CUSTOM_ATTRIBUTES[prop];
        var allowedTags = ref.allowedTags;

        if (!allowedTags || (
          allowedTags
            && allowedTags.length > 0
            && allowedTags.indexOf(element.localName) >= 0
        )) {
          if (typeof GLOBALS.CUSTOM_ATTRIBUTES[prop].caller === 'function') {
            GLOBALS.CUSTOM_ATTRIBUTES[prop].caller(element, props[prop]);
          }
          if (!GLOBALS.CUSTOM_ATTRIBUTES[prop].addToElement) { return; }
        }
      }


      if (prop.toLowerCase() === 'style') {
        if (typeof props[prop] === 'object') {
          setStyles(structure, props[prop], (oldProps && oldProps.style) || {});
          // props[prop] = structure.setStyles(props[prop], (oldProps && oldProps.style) || {});
        } else {
          element.style = props[prop];
        }
        return;
      }

      if (prop.toLowerCase() === 'class' || prop.toLowerCase() === 'classname') {
        element.setAttribute('class', parseClass(props[prop]));
        return;
      }

      if (prop.toLowerCase() === 'loadfocus') {
        element.addEventListener('mount', () => {
          element.focus();
        }, false);
        return;
      }

      if (prop.toLowerCase() === 'html') {
        element.innerHTML = props[prop];
        return;
      }

      // Handles events 'on<event>'
      if (prop.substring(0, 2).toLowerCase() === 'on' && typeof props[prop] === 'function') {
        var fn = props[prop];
        if (prop.substring(0, 8).toLowerCase() === 'onsubmit') {
          element[prop] = (e) => {
            if (props.prevent) {
              e.preventDefault();
            }

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
                    if (structure && structure.el && structure.el.value) {
                      structure.el.value = val;
                    }
                  },
                  reset(val) {
                    if (structure && structure.el && structure.el.value) {
                      structure.el.value = val;
                      structure.el.defaultValue = val;
                    }
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

            return fn(e, data);
          };
        } else {
          element[prop] = (e, ...args) => fn(e, ...args);
        }
        return;
      }

      element.setAttribute(prop, props[prop]);
    }
  };

  for (var prop in props) loop( prop );

  for (var i = 0; i < toRemove.length; i++) {
    element.removeAttribute(toRemove[i]);
  }

  structure.props = props;

  return structure;
};

/* eslint-disable no-restricted-syntax */

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @param {number} depth
 */
var Structure = function Structure(query, props, children, depth) {
  if ( props === void 0 ) props = {};
  if ( depth === void 0 ) depth = 0;

  this.query = query;
  this.props = Boolean !== props ? props : {};
  if (isComponent(query) || query instanceof Component) {
    this.$compChildren = flatten(children || []).map(filterNode);
    this.children = [];
  } else {
    this.children = flatten(children || []).map(filterNode);
    this.$compChildren = [];
  }
  this.html = null;
  this.$attrListeners = [];
  this.$styleListeners = [];
  this.$pointer = null;
  this.$component = null;
  this.$listener = null;
  this.$redirect = null;
  this.$destroyed = false;
  this.$isSvg = query === 'svg';
  this.$depth = depth;
};

Structure.prototype.mount = function mount () {
  this.$destroyed = false;

  if (this.$component instanceof Component) {
    this.$component.mount();
  }

  if (typeof this.onMount === 'function') {
    this.onMount();
  }
};

Structure.prototype.destroy = function destroy (childrenToo) {
    if ( childrenToo === void 0 ) childrenToo = true;

  if (this.$destroyed) { return false; }

  for (var l in this.$styleListeners) {
    if (this.$styleListeners[l]
      && typeof this.$styleListeners[l].deattach === 'function') {
      this.$styleListeners[l].deattach();
    }
  }

  for (var l$1 in this.$attrListeners) {
    if (this.$attrListeners[l$1]
      && typeof this.$attrListeners[l$1].deattach === 'function') {
      this.$attrListeners[l$1].deattach();
    }
  }

  if (this.$redirect) {
    for (var i = 0; i < this.$redirect.length; i++) {
      if (typeof this.$redirect[i].destroy === 'function') {
        this.$redirect[i].destroy();
      }
    }
  }

  if (childrenToo && this.children) {
    for (var i$1 = 0; i$1 < this.children.length; i$1++) {
      if (typeof this.children[i$1].destroy === 'function') {
        this.children[i$1].destroy();
      }
    }
  }

  if (this.html) {
    var items = this.html;
    var loop = function ( i ) {
      if (items[i].parentNode) {
        var destroyHTML = () => items[i].parentNode.removeChild(items[i]);
        if (typeof items[i].beforedestroy === 'function') {
          items[i].beforedestroy(destroyHTML);
        } else {
          destroyHTML();
        }
      }
    };

      for (var i$2 = 0; i$2 < this.html.length; i$2++) loop( i$2 );
  }

  if (this.$component instanceof Component) {
    this.$component.destroy();
  }

  if (this.$listener instanceof Listener) {
    this.$listener.deattach();
  }

  if (this.$pointer && this.$pointer.parentNode) {
    this.$pointer.parentNode.removeChild(this.$pointer);
  }

  if (typeof this.onDestroy === 'function') {
    this.onDestroy();
  }

  this.$pointer = null;
  this.$redirect = null;
  this.$component = null;
  this.render = () => {};
  this.html = null;
  this.$destroyed = true;
  return true;
};

Structure.prototype.render = function render (next, parent, depth, isSvg) {
    if ( depth === void 0 ) depth = 0;
    if ( isSvg === void 0 ) isSvg = false;

  // console.log('RENDER', isSvg, parent, parent && parent.$isSvg)
  this.$depth = Math.max(this.$depth, depth);
  this.$isSvg = isSvg || (parent && parent.$isSvg) || this.query === 'svg';

  if (this.query === '#text') {
    this.html = [textNode(this.props)];
    return next(this.html);
  }

  if (typeof this.query === 'string' || typeof this.query === 'number') {
    this.html = [getElementFromQuery(this.query, this.$isSvg)];

    setAttributes(this, this.props, {});

    return next(this.html);
  }

  if (this.query instanceof Listener) {
    if (!this.$listener) {
      this.$listener = this.query.applyDepth(this.$depth).init();
      this.mount();
    }
    return this.query.onValueChange(v => {
      if (this.html) {
        var tempParent = this.html[0];

        if (this.$pointer) {
          this.$redirect = patch(this.$redirect, v, this.$pointer,
            true, this.$isSvg, this.$depth + 1);
        } else {
          this.$redirect = patch(this.$redirect, v, tempParent,
            true, this.$isSvg, this.$depth + 1);
        }

        // let a = {
        // $redirect: [],
        // children: [],
        // };
        //
        // explode(v, a, output => {
        // // this.html = output;
        // if (this.$pointer) {
        //   this.$redirect = patch(this.$redirect, a.$redirect,
        // this.$pointer, true, this.$isSvg, this.$depth + 1);
        // } else {
        //   this.$redirect = patch(this.$redirect, a.$redirect,
        // tempParent, true, this.$isSvg, this.$depth + 1);
        // }
        // // next(output);
        // }, this.$depth + 1, this.$isSvg);
      } else {
        explode(v, parent || this, output => {
          // console.warn('change HTML', this.html)
          this.html = output;
          next(output);
        }, this.$depth + 1, this.$isSvg);
      }
    });
  }

  if (this.query instanceof Promise
    || this.query.constructor.name === 'LazyPromise') {
    return this.query.then(v => {
      var normalisedValue = v.default || v;
      explode(normalisedValue, parent || this, output => {
        this.html = output;
        next(output);
      }, this.$depth, this.$isSvg);
    });
  }

  if (this.query instanceof Component
    && typeof this.query.render === 'function') {
    this.$component = this.query;
    return explode(this.$component.render(), parent || this, v => {
      this.html = v;
      next(v);
      this.mount();
    }, this.$depth, this.$isSvg);
  }

  if (isComponent(this.query)) {
    if (!this.$component) {
      this.$component =
        new this.query(this.$compChildren).setProps(this.props); // eslint-disable-line
    }
    if (typeof this.$component.render === 'function') {
      explode(this.$component.render(), parent || this, v => {
        this.html = v;
        next(v);
      }, this.$depth, this.$isSvg);
      this.mount();
    }
    return null;
  }

  if (typeof this.query === 'function') {
    return explode(this.query(this.props), parent || this, v => {
      this.html = v;
      next(v);
    }, this.$depth, this.$isSvg);
  }

  return next(textNode(this.query));
};

Structure.prototype.isStructure = function isStructure () {
  return true;
};

/* eslint-disable no-restricted-syntax */

// const hasRedirect = item => (
//   item && item.$redirect
// );

var patch = (rawfirst, rawsecond, parent,
  after, isSvg, depth) => {
  if ( after === void 0 ) after = false;
  if ( isSvg === void 0 ) isSvg = false;
  if ( depth === void 0 ) depth = 0;

  var first = flatten([rawfirst]);
  var second = flatten([rawsecond]).map(filterNode);

  var length = Math.max(first.length, second.length);

  var loop = function ( i ) {
    // debugger
    // const nn = i;
    // first[i] = first[i].$redirect || first[i];
    if (typeof first[i] === 'undefined') {
      // mount
      mount(second[i], parent, after, isSvg, depth);
      return;
    }

    if (typeof second[i] === 'undefined') {
      // remove
      if (typeof first[i].destroy === 'function') {
        first[i].destroy();
      }
      return;
    }

    second[i].$depth = depth;

    if ((first[i] instanceof Structure || first[i].isStructure)
      && (second[i] instanceof Structure || second[i].isStructure)
      && first[i] !== second[i]) {
      // if (second[i].$redirect2) {
      //   second[i] = patch(
      //     // first[i].$redirect || first[i],
      //     hasRedirect(first[i]) || first[i],
      //     second[i].$redirect[second[i].$redirect.length - 1] || second[i],
      //     parent,
      //     after,
      //     isSvg,
      //     depth
      //   );
      //   continue;
      // }

      if (first[i].html
        && first[i].query === '#text'
        && second[i].query === '#text') {
        for (var n = 0; n < first[i].html.length; n++) {
          if (first[i].props !== second[i].props) {
            first[i].html[n].textContent = first[i].props = second[i].props;
          }
        }

        second[i].html = first[i].html;
        first[i].html = null;

        if (first[i].$pointer) {
          if (second[i].$pointer && second[i].$pointer.parentNode) {
            second[i].$pointer.parentNode.removeChild(second[i].$pointer);
          }
          second[i].$pointer = first[i].$pointer;
          first[i].$pointer = null;
        }

        first[i].destroy();
        return;
      }


      if (first[i].html
        && typeof first[i].query === 'string'
        && typeof second[i].query === 'string'
        && first[i].query === second[i].query) {
        // for (var n = 0; n < first[i].html.length; n++) {
        //   if (first[i].props !== second[i].props) {
        //     // first[i].html[n].textContent = second[i].props;
        //   }
        // }

        second[i].html = first[i].html;
        first[i].html = null;

        if (first[i].$pointer) {
          if (second[i].$pointer && second[i].$pointer.parentNode) {
            second[i].$pointer.parentNode.removeChild(second[i].$pointer);
          }
          second[i].$pointer = first[i].$pointer;
          first[i].$pointer = null;
        }

        setAttributes(second[i], second[i].props, first[i].props);
        // mountChildren(second[i], second[i].$isSvg, second[i].$depth + 1);

        if (second[i].html[0]
            && second[i].children
            && second[i].children.length > 0) {
          second[i].children = patch(first[i].children,
            second[i].children,
            second[i].html[0],
            false,
            second[i].$isSvg,
            second[i].$depth + 1);
        }
        first[i].destroy();

        return;
      }

      // maybe merge
      var n1 = first[i];
      var n2 = second[i];

      // n2.$pointer = textNode('[pointer2]');
      n2.$pointer = textNode('');
      append(n2.$pointer, parent, after);

      n2.render(rendered => {
        if (n1.$pointer) {
          if (n2.$pointer && n2.$pointer.parentNode) {
            n2.$pointer.parentNode.removeChild(n2.$pointer);
          }
          n2.$pointer = n1.$pointer;
          n1.$pointer = null;
        }

        for (var n = 0; n < rendered.length; n++) {
          if ((n1.html && !n1.html[i]) || !n1.html) {
            append(rendered[n], n2.$pointer, true);
          } else {
            append(rendered[n], n1.html[i], true);
          }
        }

        mountChildren(n2, isSvg, depth + 1);

        n1.destroy(false);
      }, n2, depth, isSvg);
    }
  };

  for (var i = 0; i < length; i++) loop( i );

  return second;
};

/* eslint-disable guard-for-in */

var capitalise = lower => lower.charAt(0).toUpperCase() + lower.substr(1);

var Component = function Component(children, props) {
  this.addNonEnumerableProperties({
    $id: generateId(),
    $name: this.constructor.name,
    $config: (typeof this.config === 'function') ? this.config() : {
      listen: true,
    },
    __$events: {},
    __$privateStore: new PrivateStore(),
  });

  // TODO: Remove this! Deprecated!
  if (typeof this.on !== 'function'
    || (typeof this.on === 'function' && typeof this.on() === 'object')) {
    throw new Error('[Radi.js] Using `on.eventName()` is deprecated. Please use `onEventName()`.');
  }

  this.children = [];

  // Links headless components
  for (var key in GLOBALS.HEADLESS_COMPONENTS) {
    if (this[key] && typeof this[key].on === 'function') {
      this[key].on('update', () => this.setState());
    }
  }

  this.state = typeof this.state === 'function'
    ? this.state()
    : (this.state || {});

  skipInProductionAndTest(() => Object.freeze(this.state));

  if (children) { this.setChildren(children); }
  if (props) { this.setProps(props); }
};

/**
 * @returns {HTMLElement}
 */
Component.prototype.render = function render () {
  if (typeof this.view !== 'function') { return null; }
  return this.html = this.view();
};

/**
 * @param {object} props
 * @returns {Component}
 */
Component.prototype.setProps = function setProps (props) {
  var newState = {};
  // Self is needed cause of compilation
  var self = this;

  var loop = function ( key ) {
    if (typeof props[key] === 'function' && key.substr(0, 2) === 'on') {
      self.on(key.substring(2, key.length), props[key]);
    } else
    if (props[key] instanceof Listener) {
      newState[key] = props[key].init().value;
      props[key].changeListener = (value => {
        self.setState({
          [key]: value,
        });
      });
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
    if (typeof this.children[i].on === 'function') {
      this.children[i].on('update', () => this.setState());
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
  this.__$privateStore.addListener(key, listener, depth);
};

Component.prototype.mount = function mount () {
  this.trigger('mount');
};

Component.prototype.destroy = function destroy () {
  // if (this.html) {
  // for (var i = 0; i < this.html.length; i++) {
  //   if (this.html[i].parentNode) {
  //     this.html[i].parentNode.removeChild(this.html[i]);
  //   }
  // }
  // }
  this.html = null;
  this.trigger('destroy');
  this.__$privateStore.removeListeners();
};

// TODO: Remove this! Deprecated!
Component.prototype.when = function when () {
  throw new Error('[Radi.js] Using `.when(\'Event\')` is deprecated. Use `.on(\'Event\')` instead.');
};

/**
 * @param {string} key
 * @param {function} fn
 * @returns {function}
 */
Component.prototype.on = function on (key, fn) {
  if (typeof this.__$events[key] === 'undefined') { this.__$events[key] = []; }
  this.__$events[key].push(fn);
  return fn;
};

/**
 * @param {string} key
 * @param {*} value
 */
Component.prototype.trigger = function trigger (key, ...args) {
  var event = this[`on${capitalise(key)}`];

  if (typeof event === 'function') {
    event.call(this, ...args);
  }

  if (typeof this.__$events[key] !== 'undefined') {
    for (var i in this.__$events[key]) {
      this.__$events[key][i].call(this, ...args);
    }
  }
};

/**
 * @param {object} newState
 * @param {string} actionName
 */
Component.prototype.setState = function setState (newState, actionName) {
  if (typeof newState === 'object') {
    var oldstate = this.state;

    skipInProductionAndTest(() => oldstate = clone(this.state));

    this.state = Object.assign(oldstate, newState);

    skipInProductionAndTest(() => Object.freeze(this.state));

    if (this.$config.listen) {
      this.__$privateStore.setState(newState);
    }
  }

  if (!this.$config.listen && typeof this.view === 'function' && this.html) {
    this.html = patch(this.html, this.view());
  }

  if (typeof actionName === 'string' && typeof this[actionName] === 'function') {
    this.trigger(`after${capitalise(actionName)}`, newState);
  }

  // if (typeof newState === 'object') {
  // let oldstate = this.state;
  //
  // skipInProductionAndTest(() => oldstate = clone(this.state));
  //
  // this.state = Object.assign(oldstate, newState);
  //
  // skipInProductionAndTest(() => Object.freeze(this.state));
  //
  // if (this.$config.listen) {
  //   this.__$privateStore.setState(newState);
  // }
  // }
  //
  // if (!this.$config.listen && typeof this.view === 'function' && this.html) {
  // fuseDom.fuse(this.html, this.view());
  // }
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
 * @param {*} value
 * @returns {Boolean}
 */
var isComponent = value => {
  if (value) {
    if (value.prototype instanceof Component) {
      return true;
    }

    if (value.isComponent) {
      return true;
    }
  }

  return false;
};

/**
 * @param {function} value
 * @returns {object}
 */
var filterNode = value => {

  if (Array.isArray(value)) {
    return value.map(filterNode);
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return r('#text', value);
  }

  if (!value || typeof value === 'boolean') {
    return r('#text', '');
  }

  if (value instanceof Listener) {
    return r(value);
  }

  if (isComponent(value) || value instanceof Component) {
    return r(value);
  }

  if (typeof value === 'function') {
    return r(value);
  }

  if (value instanceof Promise || value.constructor.name === 'LazyPromise') {
    return r(value);
  }

  return value;
};

// import Component from '../component/Component';

/**
 * @param {*} query
 * @param {object} props
 * @param {...*} children
 * @returns {object}
 */
var r = (query, props, ...children) => {
  if (typeof GLOBALS.CUSTOM_TAGS[query] !== 'undefined') {
    return GLOBALS.CUSTOM_TAGS[query].onmount(
      props || {},
      (children && flatten([children]).map(filterNode)) || [],
      filterNode,
      v => (GLOBALS.CUSTOM_TAGS[query].saved = v)
    ) || null;
  }

  if (query === 'await') {
    var output = null;

    if (props.src && props.src instanceof Promise) {
      props.src.then(v => {
        var nomalizedData = filterNode(
          typeof props.transform === 'function'
            ? props.transform(v)
            : v
        );

        if (output) {
          output = patch(output, nomalizedData, output.html[0].parentNode);
        } else {
          output = nomalizedData;
        }
      }).catch(error => {
        var placerror = filterNode(
          typeof props.error === 'function'
            ? props.error(error)
            : props.error
        );

        if (output) {
          output = patch(output, placerror, output.html[0].parentNode);
        } else {
          output = placerror;
        }
      });
    }

    if (!output) {
      output = filterNode(props.placeholder);
    }

    return output;
  }

  if (query === 'template') {
    // return flatten([children]).map(filterNode);
    return new Structure('section', props, flatten([children]).map(filterNode));
  }

  return new Structure(query, props, flatten([children]).map(filterNode));
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

var headless = (key, Comp) => {
  // TODO: Validate component and key
  var name = '$'.concat(key);
  var mountedComponent = new Comp();
  mountedComponent.mount();
  Component.prototype[name] = mountedComponent;
  return GLOBALS.HEADLESS_COMPONENTS[name] = mountedComponent;
};

// Decorator for actions
var action = (target, key, descriptor) => {
  var fn = descriptor.value;
  return {
    configurable: true,
    value(...args) {
      return this.setState.call(this, fn.call(this, ...args), key);
    },
  };
};

/* eslint-disable func-names */

var createWorker = fn => {
  var fire = () => {};

  var blob = new window.Blob([`self.onmessage = function(e) {
    self.postMessage((${fn.toString()})(e.data));
  }`], { type: 'text/javascript' });

  var url = window.URL.createObjectURL(blob);
  var myWorker = new window.Worker(url);

  myWorker.onmessage = e => { fire(e.data, null); };
  myWorker.onerror = e => { fire(null, e.data); };

  return arg => new Promise((resolve, reject) => {
    fire = (data, err) => !err ? resolve(data) : reject(data);
    myWorker.postMessage(arg);
  });
};

// Descriptor for worker
var worker = (target, key, descriptor) => {
  var act = descriptor.value;

  var promisedWorker = createWorker(act);

  descriptor.value = function (...args) {
    promisedWorker(...args).then(newState => {
      this.setState.call(this, newState);
    });
  };
  return descriptor;
};

// Descriptor for subscriptions
var subscribe = (container, eventName/* , triggerMount */) =>
  (target, key, descriptor) => {
    var fn = descriptor.value;
    var boundFn = () => {};

    if (typeof fn !== 'function') {
      throw new Error(`@subscribe decorator can only be applied to methods not: ${typeof fn}`);
    }

    // In IE11 calling Object.defineProperty has a side-effect of evaluating the
    // getter for the property which is being replaced. This causes infinite
    // recursion and an "Out of stack space" error.
    var definingProperty = false;

    container[eventName] = (...args) => boundFn(...args);

    return {
      configurable: true,
      get() {
        if (definingProperty || this === target.prototype || this.hasOwnProperty(key)
          || typeof fn !== 'function') {
          return fn;
        }

        boundFn = fn.bind(this);

        definingProperty = true;
        Object.defineProperty(this, key, {
          configurable: true,
          get() {
            return boundFn;
          },
          set(value) {
            fn = value;
            delete this[key];
          },
        });
        definingProperty = false;
        return boundFn;
      },
      set(value) {
        fn = value;
      },
    };
  };

/**
 * @param {string} tagName
 * @param {function} onmount
 * @param {function} ondestroy
 * @returns {object}
 */
var customTag = (tagName, onmount, ondestroy) => GLOBALS.CUSTOM_TAGS[tagName] = {
  name: tagName,
  onmount: onmount || (() => {}),
  ondestroy: ondestroy || (() => {}),
  saved: null,
};

/**
 * @param {string} attributeName
 * @param {function} caller
 * @param {object} object
 * @returns {object}
 */
var customAttribute = (attributeName, caller, ref) => {
  if ( ref === void 0 ) ref = {};
  var allowedTags = ref.allowedTags;
  var addToElement = ref.addToElement;

  return GLOBALS.CUSTOM_ATTRIBUTES[attributeName] = {
  name: attributeName,
  caller,
  allowedTags: allowedTags || null,
  addToElement,
};
};

var remountActiveComponents = () => {
  Object.values(GLOBALS.ACTIVE_COMPONENTS).forEach(component => {
    if (typeof component.onMount === 'function') {
      component.onMount(component);
    }
  });
};

var animate = (target, type, opts, done) => {
  var direct = opts[type];
  if (typeof direct !== 'function') {
    console.warn(`[Radi.js] Animation \`${type}\` for node \`${target.nodeName.toLowerCase}\` should be function`);
    return;
  }

  return direct(target, done);
};

customAttribute('animation', (el, props) => {
  animate(el, 'in', props, () => {});
  el.beforedestroy = done => animate(el, 'out', props, done);
});

/* eslint-disable consistent-return */

var Modal = (function (Component$$1) {
  function Modal () {
    Component$$1.apply(this, arguments);
  }

  if ( Component$$1 ) Modal.__proto__ = Component$$1;
  Modal.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Modal.prototype.constructor = Modal;

  Modal.prototype.state = function state () {
    return {
      registry: {},
    };
  };

  Modal.prototype.register = function register (name, element) {
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
    }, 'register');
  };

  Modal.prototype.exists = function exists (name) {
    if (typeof this.state.registry[name] === 'undefined') {
      console.warn(`[Radi.js] Warn: Modal with name "${name}" is not registerd!`);
      return false;
    }

    return true;
  };

  Modal.prototype.open = function open (name) {
    if (!this.exists(name) || this.state.registry[name].status) { return; }

    return this.setState({
      registry: Object.assign({}, this.state.registry, {
        [name]: {
          status: true,
          element: this.state.registry[name].element,
        },
      }),
    }, 'open');
  };

  Modal.prototype.close = function close (name) {
    if (!this.exists(name) || !this.state.registry[name].status) { return; }

    return this.setState({
      registry: Object.assign({}, this.state.registry, {
        [name]: {
          status: false,
          element: this.state.registry[name].element,
        },
      }),
    }, 'close');
  };

  Modal.prototype.closeAll = function closeAll () {
    var keys = Object.keys(this.state.registry);
    var registry = keys.reduce((acc, name) => Object.assign(acc, {
      [name]: {
        status: false,
        element: this.state.registry[name].element,
      },
    }), {});

    return this.setState({
      registry,
    }, 'closeAll');
  };

  return Modal;
}(Component));

var $modal = headless('modal', Modal);

customTag('modal',
  (props, children, buildNode) => {
    var name = props.name || 'default';

    $modal.register(name, null);

    if (typeof props.name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
    }

    var mounted = mount(listen($modal, 'registry', name)
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

    var treeSitter = buildNode(null);

    treeSitter.onDestroy = () => {
      for (var i = 0; i < mounted.length; i++) {
        if (typeof mounted[i].destroy === 'function') { mounted[i].destroy(); }
      }
    };

    return treeSitter;
  }, () => {
    // Destroyed `element`
  }
);

var extract = form => {
  var data = {};
  var inputs = form.elements || [];
  for (var input of inputs) {
    if ((input.name !== ''
      && (input.type !== 'radio' && input.type !== 'checkbox'))
      || input.checked) {
      data[input.name] = input.value;
    }
  }

  return data;
};

var findButton = elements => {
  var button = null;
  for (var input of elements) {
    if (input.submitButton) { button = input; }
  }

  return button;
};

function validate(_radi) {

  var Errors = (function (superclass) {
    function Errors () {
      superclass.apply(this, arguments);
    }

    if ( superclass ) Errors.__proto__ = superclass;
    Errors.prototype = Object.create( superclass && superclass.prototype );
    Errors.prototype.constructor = Errors;

    Errors.prototype.state = function state () {
      return {

      }
    };

    Errors.prototype.add = function add (name, errors) {
      var newState = this.setState({
        [name]: errors,
      });
      this.trigger('update:' + name, errors);
      return newState;
    };

    Errors.prototype.remove = function remove (name) {
      return this.add(name, []);
    };

    return Errors;
  }(_radi.Component));

  var $errors = _radi.headless('errors', Errors);

  _radi.customTag('errors',
    (props, children, buildNode, save) => {
    var output = buildNode(null);

    $errors.on('update:' + props.name, err => {
      var nomalizedData;

      if (!err || err.length <= 0) {
        nomalizedData = buildNode(null);
      } else {
        nomalizedData = buildNode(props.onrender(err || []));
      }

      output = _radi.patch(output, nomalizedData, output.html[0].parentNode)[0];
    });

    return output;
  }, () => {});

  _radi.customAttribute('error', (element, value) => {
    element.onerror = errors => $errors.add(value, errors);
    element.onvalid = () => $errors.remove(value);
  }, {
    allowedTags: ['form'],
    addToElement: false,
  });

  _radi.customAttribute('validate-submit', (element, props) => {
    element.submitButton = true;
  }, {
    allowedTags: ['button'],
  });

  _radi.customAttribute('validate', (element, props) => {
    var form = element.form;
    var button = null;

    var doValidation = e => {
      if (!form) { form = element.form; }
      if (form && typeof form.onvalidate === 'function') {
        button = findButton(form.elements);
        var inputs = extract(form);
        var output = form.onvalidate(form);
        var touched = form.touched || [];

        if (output) {
          if (typeof output === 'object') {
            var failed = [];
            for (var input in output) {
              if (output.hasOwnProperty(input)) {
                if (typeof output[input] === 'function') {
                  var validated = output[input](inputs[input]);
                  if (typeof validated === 'string' && touched.indexOf(input) < 0) {
                    failed.push({
                      field: input,
                      reason: null,
                    });
                  } else
                  if (typeof validated === 'string') {
                    failed.push({
                      field: input,
                      reason: validated || null,
                    });
                  }
                }
              }
            }

            if (failed.length > 0) {
              if (button) { button.disabled = true; }
              if (typeof form.onerror === 'function') {
                form.onerror(failed.filter(v => v.reason));
              }
              return;
            }
          }

          if (button) { button.disabled = false; }
          if (form && typeof form.onvalid === 'function') {
            form.onvalid();
          }
          return;
        }
      }

      if (button) { button.disabled = true; }
      if (form && typeof form.onerror === 'function') {
        form.onerror(null);
      }
      return;
    };

    element.addEventListener('change', e => {
      if (form) {
        var name = element.name;
        if (typeof form.touched === 'undefined') {
          form.touched = [];
        }
        if (form.touched.indexOf(name) < 0) {
          form.touched.push(element.name);
          doValidation(e);
        }
      }
    });
    element.addEventListener('input', doValidation);

    return true;
  }, {
    allowedTags: [
      'input',
      'textarea',
      'select',
    ],
  });
}

var Validator = function Validator(value) {
  this.value = value;
  this.rules = [];
};

Validator.prototype.register = function register (ref) {
    var type = ref.type;
    var validate = ref.validate;
    var error = ref.error;

  var nn = this.rules.push({
    type: type,
    validate: value => (value && validate(value)),
    error: error || 'Invalid field',
  });

  this.error = text => {
    this.rules[nn - 1].error = text || error;
    return this;
  };

  return this;
};

Validator.prototype.check = function check (newValue) {
  if (typeof newValue !== 'undefined') {
    this.value = newValue;
  }

  return this.rules.reduce((acc, value) => (
    typeof acc === 'string' ? acc : (!value.validate(this.value) && value.error) || acc
  ), true)
};

Validator.prototype.required = function required () {
  return this.register({
    type: 'required',
    validate: value => value !== '',
    error: 'Field is required',
  })
};

Validator.prototype.min = function min (num) {
  return this.register({
    type: 'min',
    validate: value => value.length >= num,
    error: 'Min char length is ' + num,
  })
};

Validator.prototype.max = function max (num) {
  return this.register({
    type: 'max',
    validate: value => value.length < num,
    error: 'Max char length is ' + num,
  })
};

Validator.prototype.email = function email () {
  return this.register({
    type: 'email',
    validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    error: 'Email is not valid',
  })
};

var Radi = {
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
  Validator,
};

// Pass Radi instance to plugins
Radi.plugin = (fn, ...args) => fn(Radi, ...args);

Radi.plugin(validate);

if (window) { window.Radi = Radi; }
// module.exports = Radi;

export default Radi;
//# sourceMappingURL=radi.es.js.map
