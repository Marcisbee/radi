var GLOBALS = {
  VERSION: '0.5.0',
  CUSTOM_ATTRIBUTES: {},
  CUSTOM_TAGS: {},
  SERVICES: {},
};

/**
 * @param {string} str
 * @returns {string}
 */
function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}

/**
 * @param {*[]} list
 * @returns {*[]}
 */
function ensureArray(list) {
  if (arguments.length === 0) { return []; }
  if (arguments.length === 1) {
    if (list === undefined || list === null) { return []; }
    if (Array.isArray(list)) { return list; }
  }
  return Array.prototype.slice.call(arguments);
}

/**
 * @param {*[]} list
 * @returns {*[]}
 */
function flatten(list) {
  return list.reduce(function (a, b) { return a.concat(Array.isArray(b) ? flatten(b) : b); }, []);
}

var Component = function Component(fn, name) {
  this.self = fn;
  this.name = name || fn.name;
  this.__$events = {};
};

/**
 * Just so there is always onMount event
 * @return {*}
 */
Component.prototype.onMount = function onMount () {

};

/**
 * @param{string} event
 * @param{Function} fn
 * @return {Function}
 */
Component.prototype.on = function on (event, fn) {
  var e = this.__$events;
  var name = "on" + (capitalise(event));
  if (!e[name]) { e[name] = []; }
  e[name].push(fn);
  return fn;
};

/**
 * @param{string} event
 * @param{*[]} args
 */
Component.prototype.trigger = function trigger (event) {
    var ref, ref$1;

    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
  var name = "on" + (capitalise(event));

  (this.__$events[name] || [])
    .map(function (e) { return e.apply(void 0, args); });

  if (typeof this[name] === 'function') {
    (ref = this)[name].apply(ref, args);
  }

  if (typeof this.self[name] === 'function') {
    (ref$1 = this.self)[name].apply(ref$1, args);
  }
};

/**
 * @param  {string}   key
 * @param  {Function} fn
 * @param  {*[]}   args
 * @return {Function}
 */
function service(key, fn) {
  var args = [], len = arguments.length - 2;
  while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

  if (typeof key !== 'string') {
    throw new Error('[Radi.js] Service first argument has to be string');
  }

  if (typeof fn !== 'function') {
    throw new Error('[Radi.js] Service second argument has to be function');
  }

  var name = '$'.concat(key);
  var Comp = new Component(fn, key);
  var mounted = fn.call.apply(fn, [ Comp ].concat( args ));

  Comp.trigger('mount');
  Component.prototype[name] = mounted;

  return GLOBALS.SERVICES[name] = mounted;
}

/**
 * @param  {HTMLElement} node
 */
function destroyTree$$1(node) {
  fireEvent('destroy', node);

  if (node.nodeType === 1) {
    var curChild = node.firstChild;
    while (curChild) {
      destroyTree$$1(curChild);
      curChild = curChild.nextSibling;
    }
  }
}

/**
 * @param  {string} type
 * @param  {HTMLElement} $node
 * @return {HTMLElement}
 */
function fireEvent(type, $node) {
  var onEvent = document.createEvent('Event');
  onEvent.initEvent(type, true, true);

  if (typeof $node.dispatchEvent === 'function') {
    $node._eventFired = true;
    $node.dispatchEvent(onEvent);
  }

  return $node;
}

/**
 * @param  {HTMLElement} newNode
 * @param  {HTMLElement} $reference
 * @param  {HTMLElement} $parent
 * @return {HTMLElement}
 */
function insertAfter(newNode, $reference, $parent) {
  if (!$parent) { $parent = $reference.parentNode; }

  if (newNode instanceof Node) {
    if ($reference === null || $reference === undefined) {
      return $parent.insertBefore(newNode, $reference);
    }

    if ($reference instanceof Node) {
      return $parent.insertBefore(newNode, $reference.nextSibling);
    }
  }

  return newNode;
}

/**
 * @param  {Node} node1
 * @param  {Node} node2
 * @return {boolean}
 */
function nodeChanged(node1, node2) {
  if (node1 === undefined || node2 === undefined) { return false; }
  if (typeof node1 !== typeof node2) { return true; }
  if ((typeof node1 === 'string' || typeof node1 === 'number')
    && node1 !== node2) { return true; }
  if (node1.type !== node2.type) { return true; }
  if (node1.props) { return true; }

  return false;
}

function autoUpdate(value, fn) {
  if (typeof value === 'function' && value.__radiStateUpdater) {
    return value(fn);
  }
  return fn(value);
}

function setBooleanProp($target, name, value) {
  if (value) {
    $target.setAttribute(name, value);
    $target[name] = true;
  } else {
    $target[name] = false;
  }
}

function removeBooleanProp($target, name) {
  $target.removeAttribute(name);
  $target[name] = false;
}

function isEventProp(name) {
  return /^on/.test(name);
}

function extractEventName(name) {
  return name.slice(2).toLowerCase();
}

function isCustomProp(name) {
  return isEventProp(name);
}

function setProp($target, name, value) {
  if (name === 'style') {
    setStyles($target, value);
  } else if (isCustomProp(name)) {

  } else if (name === 'className') {
    $target.setAttribute('class', value);
  } else if (typeof value === 'boolean') {
    setBooleanProp($target, name, value);
  } else {
    $target.setAttribute(name, value);
  }
}

function removeProp($target, name, value) {
  if (isCustomProp(name)) {

  } else if (name === 'className') {
    $target.removeAttribute('class');
  } else if (typeof value === 'boolean') {
    removeBooleanProp($target, name);
  } else {
    $target.removeAttribute(name);
  }
}

function setStyles($target, styles) {
  Object.keys(styles).forEach(function (name) {
    autoUpdate(styles[name], function (value) {
      $target.style[name] = value;
    });
  });
}

function setProps($target, props) {
  Object.keys(props).forEach(function (name) {
    autoUpdate(props[name], function (value) {
      if (name === 'class' || name === 'className') {
        if (Array.isArray(value)) {
          value = value.filter(function (v) { return v && typeof v !== 'function'; }).join(' ');
        }
      }
      setProp($target, name, value);
    });
  });
}

function updateProp($target, name, newVal, oldVal) {
  if (!newVal) {
    removeProp($target, name, oldVal);
  } else if (!oldVal || newVal !== oldVal) {
    setProp($target, name, newVal);
  }
}

function updateProps($target, newProps, oldProps) {
  if ( oldProps === void 0 ) oldProps = {};

  var props = Object.assign({}, newProps, oldProps);
  Object.keys(props).forEach(function (name) {
    autoUpdate(newProps[name], function (value) {
      updateProp($target, name, value, oldProps[name]);
    });
  });
}

function addEventListeners($target, props) {
  var exceptions = ['mount', 'destroy'];
  Object.keys(props).forEach(function (name) {
    if (isEventProp(name)) {
      $target.addEventListener(
        extractEventName(name),
        function (e) {
          if (exceptions.indexOf(name) >= 0) {
            if ($target === e.target) { props[name](e); }
          } else {
            props[name](e);
          }
        },
        false
      );
    }
  });
}

/**
 * @param  {HTMLElement} $parent
 * @param  {Object|Object[]} newNode
 * @param  {Object|Object[]} oldNode
 * @param  {number} [index=0]
 * @param  {HTMLElement} $pointer
 * @return {Object[]}
 */
function patch($parent, newNode, oldNode, index, $pointer) {
  if ( index === void 0 ) index = 0;

  var $output = $parent && $parent.childNodes[index];
  if ($pointer) {
    index = Array.prototype.indexOf.call($parent.childNodes, $pointer) + 1;
  }

  var normalNewNode = flatten(ensureArray(newNode));
  var normalOldNode = flatten(ensureArray(oldNode));
  var newLength = normalNewNode.length;
  var oldLength = normalOldNode.length;

  var modifier = 0;
  for (var i = 0; i < newLength || i < oldLength; i++) {
    if (normalNewNode[i] instanceof Date) { normalNewNode[i] = normalNewNode[i].toString(); }
    if (normalOldNode[i] === false || normalOldNode[i] === undefined || normalOldNode[i] === null) {
      $output = createElement$$1(normalNewNode[i], $parent);
      if ($pointer) {
        insertAfter($output, $parent.childNodes[((index + i) - 1)], $parent);
      } else {
        $parent.appendChild($output);
      }
      fireEvent('mount', $output);
    } else
    if (normalNewNode[i] === false || normalNewNode[i] === undefined || normalNewNode[i] === null) {
      var $target = $parent.childNodes[index + i + modifier];
      if ($target) {
        $parent.removeChild($target);
        destroyTree$$1($target);
        modifier -= 1;
      }
    } else
    if (nodeChanged(normalNewNode[i], normalOldNode[i])) {
      $parent.replaceChild(
        $output = createElement$$1(normalNewNode[i], $parent),
        $parent.childNodes[index + i]
      );
      fireEvent('mount', $output);
    } else if (typeof normalNewNode[i].type === 'string') {
      var childNew = normalNewNode[i];
      var childOld = normalOldNode[i];
      updateProps(
        $parent.childNodes[index + i],
        childNew.props,
        childOld.props
      );
      var newLength2 = childNew.children.length;
      var oldLength2 = childOld.children.length;
      for (var n = 0; n < newLength2 || n < oldLength2; n++) {
        patch(
          $parent.childNodes[index + i],
          childNew.children[n],
          childOld.children[n],
          n
        );
      }
    }
  }

  return normalNewNode;
}

/**
 * @typedef {Object} Mount
 * @property {Object} component
 * @property {Object} node
 * @property {function} destroy
 */

/**
 * @param  {Object} component
 * @param  {HTMLElement} container
 * @return {Mount}
 */
function mount(component, container) {
  return {
    component: component,
    node: patch(container, component),
    destroy: function () {
      return patch(container, null);
    },
  };
}

/**
 * @param  {Object} node
 * @param  {HTMLElement} $parent
 * @return {HTMLElement|null}
 */
function createElement$$1(node, $parent) {
  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(node);
  }

  if (node === undefined || node === false || node === null) {
    return document.createComment('');
  }

  if (Array.isArray(node)) {
    var $pointer = document.createTextNode('');

    $pointer.addEventListener('mount', function () {
      for (var i = 0; i < node.length; i++) {
        mount(node[i], $parent);
      }
    });

    return $pointer;
  }

  if (typeof node === 'function' || typeof node.type === 'function') {
    var fn = node.type || node;

    var lifecycles = new Component(fn);

    var $element = createElement$$1(
      fn.call(lifecycles, Object.assign({}, (node.props || {}),
        {children: node.children || []})),
      $parent
    );

    var $styleRef;

    if ($element && typeof $element.addEventListener === 'function') {
      $element.addEventListener('mount', function () {
        if (typeof lifecycles.style === 'string') {
          $styleRef = document.createElement('style');
          $styleRef.innerHTML = lifecycles.style;
          document.head.appendChild($styleRef);
        }
        lifecycles.trigger('mount', $element, $parent);
      }, {
        passive: true,
        once: true,
      }, false);

      $element.addEventListener('destroy', function () {
        lifecycles.trigger('destroy', $element, $parent);
        if ($styleRef instanceof Node) {
          document.head.removeChild($styleRef);
        }
      }, {
        passive: true,
        once: true,
      }, false);
    }

    return $element;
  }

  if (typeof node === 'object') {
    if (node.type) {
      var $el;
      if (node.type === 'svg' || $parent instanceof SVGElement) {
        $el = document.createElementNS(
          'http://www.w3.org/2000/svg',
          node.type
        );
      } else {
        $el = document.createElement(node.type);
      }
      var $lastEl = null;
      setProps($el, node.props);
      addEventListeners($el, node.props);
      var applyChildren = function ($child) { return function (n) {
        var $n = createElement$$1(n, $child);
        if ($n) {
          if ($lastEl) {
            insertAfter($n, $lastEl, $child);
          } else {
            $child.appendChild.call($el, $n);
            fireEvent('mount', $n);
          }
        }
      }; };
      node.children.map(applyChildren($el));
      return $el;
    }
    return createElement$$1(JSON.stringify(node), $parent);
  }

  console.error('Unhandled node', node);
  return null;
}

/**
 * @param {string} attributeName
 * @param {function} caller
 * @param {Object} object
 * @returns {Object}
 */
function customAttribute(attributeName, caller, ref) {
  if ( ref === void 0 ) ref = {};
  var allowedTags = ref.allowedTags;
  var addToElement = ref.addToElement;

  return GLOBALS.CUSTOM_ATTRIBUTES[attributeName] = {
    name: attributeName,
    caller: caller,
    allowedTags: allowedTags || null,
    addToElement: addToElement,
  };
}

/**
 * @param {string} tagName
 * @param {function} onmount
 * @param {function} ondestroy
 * @returns {object}
 */
function customTag(tagName, onmount, ondestroy) {
  return GLOBALS.CUSTOM_TAGS[tagName] = {
    name: tagName,
    onmount: onmount || (function () {}),
    ondestroy: ondestroy || (function () {}),
    saved: null,
  };
}

/**
 * @typedef {Object} Node
 * @property {*} type
 * @property {Object} props
 * @property {*[]} children
 */

/**
 * @param  {*} type
 * @param  {Object} props
 * @param  {*[]} children
 * @return {Node}
 */
function html(type, props) {
  var children = [], len = arguments.length - 2;
  while ( len-- > 0 ) children[ len ] = arguments[ len + 2 ];

  return {
    type: (typeof type === 'number') ? ("" + type) : type,
    props: props || {},
    children: flatten(children),
  };
}

function setDataInObject(source, path, data) {
  var name = path[0];
  var out = {};
  out[name] = source[name];
  var temp = out;
  var i = 0;
  while (i < path.length - 1) {
    temp = temp[path[i++]];
  }
  temp[path[i]] = data;
  return out;
}

function mapData(target, store, source, path) {
  if ( path === void 0 ) path = [];

  var out = {};
  if (target && target.$loading) {
    Object.defineProperty(out, '$loading', {
      value: true,
      writable: false,
    });
  }
  if (!source) { source = out; }

  var loop = function ( i ) {
    var name = i;
    if (typeof target[i] === 'function') {
      out[name] = {};
      Object.defineProperty(out[name], '$loading', {
        value: true,
        writable: false,
      });
      target[i](function (data, useUpdate) {
        var payload = setDataInObject(source, path.concat(name), data);
        if (!useUpdate) {
          store.dispatch(function () { return payload; });
        } else {
          store.update(payload);
        }
      });
    } else {
      out[name] = target[name] && typeof target[name] === 'object'
        && !Array.isArray(target[name])
        ? mapData(target[name], store, source, path.concat(name))
        : target[name];
    }
  };

  for (var i in target) loop( i );

  return out;
}

// export class Store {
//
// }

function Store(state) {
  if ( state === void 0 ) state = {};

  var OUT = {};
  var subscriptions = [];
  var subscriptionsStrict = [];
  var latestStore;

  Object.setPrototypeOf(OUT, {
    getInitial: function getInitial() {
      return STORE;
    },
    get: function get() {
      return latestStore;
    },
    update: function update(chunkState, noStrictSubs) {
      var newState = Object.assign({}, latestStore,
        mapData(chunkState, OUT));
      latestStore = newState;
      if (!noStrictSubs) {
        subscriptionsStrict.map(function (s) {
          if (typeof s === 'function') {
            s(newState);
          }
          return false;
        });
      }
      subscriptions.map(function (s) {
        if (typeof s === 'function') {
          s(newState);
        }
        return false;
      });
      return latestStore;
    },
    subscribe: function subscribe(fn, strict) {
      if (strict) {
        subscriptionsStrict.push(fn);
      } else {
        subscriptions.push(fn);
      }
    },
    dispatch: function dispatch(fn) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      var payload = fn.apply(void 0, [ latestStore ].concat( args ));
      // console.log('dispatch', {
      //   action: fn.name,
      //   args: args,
      //   payload,
      // });
      // console.log('dispatch', fn.name, payload);
      return this.update(payload);
    },
    render: function render(fn) {
      if ( fn === void 0 ) fn = function (s) { return JSON.stringify(s); };

      var $parent;
      var $pointer;
      var newTree;
      var oldTree;
      var mounted = false;

      function update(data) {
        newTree = fn(data);
        patch($parent, newTree, oldTree, 0, $pointer);
        oldTree = newTree;
        return data;
      }

      subscriptions.push(function (data) {
        if (mounted) {
          update(data);
        }
        return data;
      });

      function item() {
        this.onMount = function (element, parent) {
          mounted = true;
          $pointer = element;
          $parent = parent || element.parentNode;
          update(latestStore);
        };
        return '';
      }

      return item;
    },
    inject: function inject(update) {
      if (typeof update !== 'function') {
        console.warn('[Radi.js] Store\'s `.inject()` method must not be called on it\'s own. Instead use `{ field: Store.inject }`.');
        return false;
      }
      OUT.subscribe(update, true);
      update(latestStore, true);
      return true;
    },
    out: function out(fn) {
      var lastValue;
      function stateUpdater(update) {
        if (typeof update === 'function') {
          OUT.subscribe(function (s) {
            var newValue = fn(s);
            if (lastValue !== newValue) {
              update(newValue);
            }
          });
          update(lastValue = fn(latestStore), true);
        } else {
          var a = OUT.render(fn);
          return a;
        }
        return lastValue;
      }
      stateUpdater.__radiStateUpdater = true;
      return stateUpdater;
    },
  });

  var STORE = mapData(state, OUT);

  latestStore = STORE;

  return OUT;
}

// import {} from './custom';
// import validate from './custom/validation/validate';
// import { Validator } from './custom/validation/Validator';

var Radi = {
  v: GLOBALS.VERSION,
  version: GLOBALS.VERSION,
  h: html,
  html: html,
  Store: Store,
  customTag: customTag,
  customAttribute: customAttribute,
  patch: patch,
  mount: mount,
  service: service,
  // Validator,
};

// Pass Radi instance to plugins
Radi.plugin = function (fn) {
  var args = [], len = arguments.length - 1;
  while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

  return fn.apply(void 0, [ Radi ].concat( args ));
};

// Radi.plugin(validate);

if (window) { window.Radi = Radi; }

export default Radi;
//# sourceMappingURL=radi.es.js.map
