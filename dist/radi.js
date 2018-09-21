(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Radi = factory());
}(this, (function () { 'use strict';

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

  /**
   * Checks that an element has a non-empty `name` and `value` property.
   * @param  {Element} element  the element to check
   * @return {Bool}             true if the element is an input, false if not
   */
  var isValidElement = function (element) { return element.name && (element.value || element.value === ''); };

  /**
   * Checks if an element’s value can be saved (e.g. not an unselected checkbox).
   * @param  {Element} element  the element to check
   * @return {Boolean}          true if the value should be added, false if not
   */
  var isValidValue = function (element) { return (!['checkbox', 'radio'].includes(element.type) || element.checked); };

  /**
   * Checks if an input is a checkbox, because checkboxes allow multiple values.
   * @param  {Element} element  the element to check
   * @return {Boolean}          true if the element is a checkbox, false if not
   */
  var isCheckbox = function (element) { return element.type === 'checkbox'; };

  /**
   * Checks if an input is a `select` with the `multiple` attribute.
   * @param  {Element} element  the element to check
   * @return {Boolean}          true if the element is a multiselect, false if not
   */
  var isMultiSelect = function (element) { return element.options && element.multiple; };

  /**
   * Retrieves the selected options from a multi-select as an array.
   * @param  {HTMLOptionsCollection} options  the options for the select
   * @return {Array}                          an array of selected option values
   */
  var getSelectValues = function (options) { return [].reduce.call(options, function (values, option) { return option.selected
        ? values.concat(option.value)
        : values; }, []); };

  /**
   * Retrieves input data from a form and returns it as a JSON object.
   * @param  {HTMLFormControlsCollection} elements  the form elements
   * @return {Object}                               form data as an object literal
   */
  var formToJSON = function (elements, transform) {
      if ( transform === void 0 ) transform = function (e, v) { return v; };

      return [].reduce.call(elements, function (data, element) {
    // Make sure the element has the required properties and should be added.
      if (isValidElement(element) && isValidValue(element)) {
      /*
       * Some fields allow for more than one value, so we need to check if this
       * is one of those fields and, if so, store the values as an array.
       */
        if (isCheckbox(element)) {
          data[element.name] = (data[element.name] || [])
            .concat(transform(element, element.value));
        } else if (isMultiSelect(element)) {
          data[element.name] = transform(element, getSelectValues(element));
        } else {
          data[element.name] = transform(element, element.value);
        }
      }

      return data;
    }, {});
  };

  var Component = function Component(fn, name) {
    this.self = fn;
    this.name = name || fn.name;
    this.__$events = {};
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
    var mounted = fn.apply(void 0, args);

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
    if (typeof GLOBALS.CUSTOM_ATTRIBUTES[name] !== 'undefined') {
      var ref = GLOBALS.CUSTOM_ATTRIBUTES[name];
      var allowedTags = ref.allowedTags;
      var addToElement = ref.addToElement;
      var caller = ref.caller;

      if (!allowedTags || (
        allowedTags
          && allowedTags.length > 0
          && allowedTags.indexOf($target.localName) >= 0
      )) {
        if (typeof caller === 'function') {
          value = caller($target, value);
        }
        if (!addToElement) { return; }
      }
    }

    if (name === 'style') {
      setStyles($target, value);
    } else if (isCustomProp(name)) {
      addEventListener($target, name, value);
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

  function addEventListener($target, name, value) {
    var exceptions = ['mount', 'destroy'];
    if (isEventProp(name)) {
      $target.addEventListener(
        extractEventName(name),
        function (e) {
          if (exceptions.indexOf(name) >= 0) {
            if ($target === e.target) { value(e); }
          } else {
            value(e);
          }
        },
        false
      );
    }
  }

  function beforeDestroy(node, next) {
    if (typeof node.beforedestroy === 'function') {
      return node.beforedestroy(next);
    }

    return next();
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
    var loop = function ( i ) {
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
          beforeDestroy($target, function () {
            // This is for async node removals
            var $targetScoped = $parent.childNodes[index + i + modifier];
            $parent.removeChild($targetScoped);
            destroyTree$$1($targetScoped);
            modifier -= 1;
          });
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
    };

    for (var i = 0; i < newLength || i < oldLength; i++) loop( i );

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
        return patch(container, null, component);
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

    // console.error('Unhandled node', node);
    return document.createTextNode(("" + node));
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
   * @returns {object}
   */
  function customTag(tagName, render) {
    return GLOBALS.CUSTOM_TAGS[tagName] = {
      name: tagName,
      render: render || (function () {}),
    };
  }

  /**
   * @typedef {Object} Node
   * @property {*} type
   * @property {Object} props
   * @property {*[]} children
   */

  /**
   * @param  {*} preType
   * @param  {Object} preProps
   * @param  {*[]} preChildren
   * @return {Node}
   */
  function html(preType, preProps) {
    var preChildren = [], len = arguments.length - 2;
    while ( len-- > 0 ) preChildren[ len ] = arguments[ len + 2 ];

    var type = (typeof preType === 'number') ? ("" + preType) : preType;
    var props = preProps || {};
    var children = flatten(preChildren);

    if (type instanceof Promise) {
      type = 'await';
      props = {
        src: preType,
      };
    }

    if (typeof GLOBALS.CUSTOM_TAGS[type] !== 'undefined') {
      type = GLOBALS.CUSTOM_TAGS[type].render;
    }

    return {
      type: type,
      props: props,
      children: children,
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
        writable: true,
      });
    }
    if (!source) { source = out; }

    var loop = function ( i ) {
      var name = i;
      if (typeof target[i] === 'function') {
        out[name] = target[i].call(store, function (data, useUpdate, fnName) {
          if ( fnName === void 0 ) fnName = '';

          var payload = setDataInObject(source, path.concat(name), data);
          if (!useUpdate) {
            var f = function () { return payload; };
            Object.defineProperty(f, 'name', { value: fnName, writable: false });
            store.dispatch(f);
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

  function Store(state) {
    if ( state === void 0 ) state = {};

    var subscriptions = [];
    var subscriptionsStrict = [];
    var latestStore;

    function StoreOutput(fn) {
      if ( fn === void 0 ) fn = function (e) { return e; };
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      // Handle rendering inside DOM
      if (this instanceof Component) {
        return StoreHold.render(fn);
      }

      // Handle injection into another store
      if (this && this.name === 'StoreHold' && typeof args[0] === 'function') {
        StoreHold.subscribe(args[0], true);
        fn(latestStore, true);
        return latestStore;
      }

      // Handle dom props and other 3rd party plugins
      var lastValue;
      function stateUpdater(update) {
        if (typeof update === 'function') {
          StoreHold.subscribe(function (s) {
            var newValue = fn(s);
            if (lastValue !== newValue) {
              update(newValue);
            }
          });
          update(lastValue = fn(latestStore), true);
        } else {
          var a = StoreHold.render(fn);
          return a;
        }
        return lastValue;
      }
      stateUpdater.__radiStateUpdater = true;
      return stateUpdater.apply(void 0, args);
    }

    function StoreHold(fn) {
      function stateUpdater() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        return StoreOutput.call.apply(StoreOutput, [ this, fn ].concat( args ));
      }
      stateUpdater.__radiStateUpdater = true;
      return stateUpdater;
    }

    StoreHold.getInitial = function () { return STORE; };
    StoreHold.get = function () { return latestStore; };
    StoreHold.update = function (chunkState, noStrictSubs) {
      var newState = Object.assign({}, latestStore,
        mapData(chunkState, StoreHold));
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
    };
    StoreHold.subscribe = function (fn, strict) {
      if (strict) {
        subscriptionsStrict.push(fn);
      } else {
        subscriptions.push(fn);
      }
      fn(latestStore);
      return StoreHold;
    };
    StoreHold.dispatch = function (fn) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      var payload = fn.apply(void 0, [ latestStore ].concat( args ));
      // console.log('dispatch', {
      //   action: fn.name,
      //   args: args,
      //   payload,
      // });
      // console.log('dispatch', fn.name, payload);
      return StoreHold.update(payload);
    };
    StoreHold.render = function (fn) {
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
    };

    var STORE = mapData(state, StoreHold);

    latestStore = STORE;

    return StoreHold;
  }

  function applyLoading(subject, value) {
    if (typeof subject === 'object') {
      Object.defineProperty(subject, '$loading', {
        value: value,
        writable: true,
      });
    }
    return subject;
  }

  function Fetch(url, map) {
    return function (payload) { return function (update) {
      setTimeout(update, 1000, applyLoading(map({ user: { _key: payload.id } }), false));

      return applyLoading({ $loading: true }, true);
    }; };
  }

  /**
   * @param       {EventTarget} [target=document] [description]
   * @constructor
   */
  function Subscribe(target) {
    if ( target === void 0 ) target = document;

    return {
      on: function (eventHolder, transformer) {
        if ( transformer === void 0 ) transformer = function (e) { return e; };

        var events = eventHolder.trim().split(' ');
        var eventSubscription = null;
        var staticDefaults = null;
        var staticUpdate = null;
        var state = false;

        if (typeof transformer !== 'function') {
          throw new Error(("[Radi.js] Subscription `" + eventHolder + "` must be transformed by function"));
        }

        function updater(defaults) {
          return function (update) {
            state = true;
            staticDefaults = defaults;
            staticUpdate = update;
            events.map(function (event) { return target.addEventListener(event,
              eventSubscription = function () {
                  var args = [], len = arguments.length;
                  while ( len-- ) args[ len ] = arguments[ len ];

                  return update(transformer.apply(void 0, args.concat( [event] )), false, ("Subscribe: " + event));
              }); });
            return defaults;
          };
        }

        updater.stop = function () {
          if (state) {
            events.map(function (event) { return target.removeEventListener(event, eventSubscription); });
          }
          return state = !state;
        };
        updater.start = function () { return (!state && updater(staticDefaults)(staticUpdate)); };

        return updater;
      },
    };
  }

  var animate = function (target, type, opts, done) {
    var direct = opts[type];
    if (typeof direct !== 'function') {
      console.warn(("[Radi.js] Animation `" + type + "` for node `" + (target.nodeName.toLowerCase) + "` should be function"));
      return;
    }

    return direct(target, done);
  };

  customAttribute('animation', function (el, value) {
    animate(el, 'in', value, function () {});
    el.beforedestroy = function (done) { return animate(el, 'out', value, done); };
  });

  customAttribute('html', function (el, value) {
    el.addEventListener('mount', function () {
      if (el.escape) {
        el.textContent = value;
      } else {
        el.innerHTML = value;
      }
    });
  });

  customAttribute('loadfocus', function (el) {
    el.addEventListener('mount', function () { return el.focus(); });
  });

  customAttribute('model', function (el, store) {
    console.log(store, store instanceof Store);
    // el.addEventListener('mount', () => el.focus());
  }, {
    allowedTags: [
      'input',
      'textarea',
      'select' ],
  });

  customAttribute('onsubmit', function (el, fn) {
    return function(e) {
      if (el.prevent) { e.preventDefault(); }
      fn(e, formToJSON(el.elements || {}));
    }
  }, {
    allowedTags: [
      'form' ],
    addToElement: true,
  });

  var errorsStore = new Store({}, 'errorStore');
  var setErrors = function (state, name, errors) {
    var obj;

    return (Object.assign({}, state,
    ( obj = {}, obj[name] = errors, obj)));
  };

  function fullValidate(elements, rules, update) {
    var values = formToJSON(elements, function (ref, value) {
      var touched = ref.touched;

      return ({touched: touched, value: value});
    });
    var plainValues = Object.keys(values)
      .reduce(function (acc, key) {
        var obj;

        return (Object.assign({}, acc,
        ( obj = {}, obj[key] = values[key].value, obj)));
    }, {});
    var errors = [];

    for (var name in values) {
      var value = values[name];

      if (typeof rules[name] === 'function') {
        var result = rules[name](value.value, plainValues);
        var valid = (
            result
            && typeof result.check === 'function'
            && result.check()
          )
          || result
          || name + ' field is invalid';

        if (valid !== true) { errors.push({
          touched: Boolean(value.touched),
          error: valid,
        }); }
      }
    }

    update(errors);
  }

  var formCount = 0;

  customAttribute('onvalidate', function (el, rules) {
    var formName = el.name || 'defaultForm' + (formCount++);
    var submit;

    function update(errors) {
      errorsStore.dispatch(setErrors, formName, errors);
    }

    errorsStore.subscribe(function (state) {
      if (submit) {
        submit.disabled = state[formName].length > 0;
      }
    });

    el.addEventListener('mount', function (e) {
      var validate = rules(e);
      var elements = e.target.elements;
      if (validate && typeof validate === 'object'
        && elements) {

        for (var element of elements) {
          var name = element.name;

          if (!element.__radiValidate
            && typeof name === 'string'
            && typeof validate[name] === 'function') {

            element.addEventListener('input', function () {
              fullValidate(
                elements,
                validate,
                update
              );
            });
            element.__radiValidate = true;

            element.touched = false;
            var setTouched = function (ref) {
              var target = ref.target;

              target.touched = true;
              target.removeEventListener('change', setTouched);
              fullValidate(
                elements,
                validate,
                update
              );
            };
            element.addEventListener('change', setTouched);
          }

          if (element.type === 'submit' && element.disabled === true) {
            submit = element;
          }
        }

        fullValidate(
          elements,
          validate,
          update
        );
      }
    }, false);
  }, {
    allowedTags: [
      'form' ],
  });

  function ensureFn(maybeFn) {
    if (typeof maybeFn === 'function') { return maybeFn; }
    return function (e) { return maybeFn || e; };
  }

  customTag('await',
    function Await(promise) {
      var src = promise.src;
      var awaitStore = new Store({
        status: 'placeholder',
      });

      var update = function (e, status) { return ({status: status}); };

      if (src &&
        (src instanceof Promise || src.constructor.name === 'LazyPromise')
      ) {
        var output = '';
        src
          .then(function (data) {
            output = data;
            awaitStore.dispatch(update, 'transform');
          })
          .catch(function (error) {
            output = error;
            awaitStore.dispatch(update, 'error');
          });

        return awaitStore(function (ref) {
          var status = ref.status;

          return ensureFn(promise[status])(output);
        });
      }

      return null;
    }
  );

  customTag('errors',
    function Errors(ref) {
      var name = ref.name;
      var onrender = ref.onrender;

      if (typeof name === 'undefined') {
        console.warn('[Radi.js] Warn: Every <errors> tag needs to have `name` attribute!');
      }
      if (typeof onrender !== 'function') {
        console.warn('[Radi.js] Warn: Every <errors> tag needs to have `onrender` attribute!');
      }

      return errorsStore(function (state) { return (
        state[name] && onrender(state[name])
      ); })
    }
  );

  var h = html;

  var ModalStore = new Store({});

  var registerModal = function (store, name) {
    var obj;

    return (( obj = {}, obj[name] = false, obj));
  };

  var switchModal = function (store, name, type) {
    var obj;

    return (( obj = {}, obj[name] = type, obj));
  };

  var ModalService = service('modal', function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return {
      open: function (name) { return ModalStore.dispatch(switchModal, name, true); },
      close: function (name) { return ModalStore.dispatch(switchModal, name, false); },
    };
  });

  customTag('modal',
    function Modal(ref) {
      var this$1 = this;
      var name = ref.name; if ( name === void 0 ) name = 'default';
      var children = ref.children;

      if (typeof name === 'undefined') {
        console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
      }

      this.onMount = function (el) { return ModalStore.dispatch(registerModal, name); };

      return h('portal', {},
        ModalStore(function (data) { return (
          data[name] && h('div',
            { class: 'radi-modal', name: name },
            h('div', {
              class: 'radi-modal-backdrop',
              onclick: function () { return this$1.$modal.close(name); },
            }),
            h.apply(void 0, [ 'div',
              { class: 'radi-modal-content' } ].concat( (children.slice()) )
            )
          )
        ); })
      );
    }
  );

  customTag('portal',
    function Portal(data) {
      var $ref;
      var $parent;
      var toRender = data.children || [];

      this.onMount = function ($element) {
        mount(function () {
          this.onMount = function ($el, $p) {
            $ref = $el;
            $parent = $p;
          };

          return function () { return toRender; };
        }, data.on || document.body);
      };

      this.onDestroy = function (el, parent) {
        patch($parent, null, toRender, 0, $ref || el);
      };

      return null;
    }
  );

  var Validator = function Validator(value) {
    this.value = value;
    this.rules = [];
  };

  Validator.prototype.register = function register (ref) {
      var this$1 = this;
      var type = ref.type;
      var validate = ref.validate;
      var error = ref.error;

    var nn = this.rules.push({
      type: type,
      validate: function (value) { return (value && validate(value)); },
      error: error || 'Invalid field',
    });

    this.error = function (text) {
      this$1.rules[nn - 1].error = text || error;
      return this$1;
    };

    return this;
  };

  Validator.prototype.check = function check (newValue) {
      var this$1 = this;

    if (typeof newValue !== 'undefined') {
      this.value = newValue;
    }

    return this.rules.reduce(function (acc, value) { return (
      typeof acc === 'string' ? acc : (!value.validate(this$1.value) && value.error) || acc
    ); }, true)
  };

  Validator.prototype.required = function required () {
    return this.register({
      type: 'required',
      validate: function (value) { return value !== ''; },
      error: 'Field is required',
    })
  };

  Validator.prototype.test = function test (regexp) {
    return this.register({
      type: 'test',
      validate: function (value) { return regexp.test(value); },
      error: 'Field must be valid',
    })
  };

  Validator.prototype.equal = function equal (equal$1) {
    return this.register({
      type: 'equal',
      validate: function (value) { return value === equal$1; },
      error: 'Field must be equal to ' + equal$1,
    })
  };

  Validator.prototype.notEqual = function notEqual (equal) {
    return this.register({
      type: 'notEqual',
      validate: function (value) { return value !== equal; },
      error: 'Field must not be equal to ' + equal,
    })
  };

  Validator.prototype.min = function min (num) {
    return this.register({
      type: 'min',
      validate: function (value) { return value.length >= num; },
      error: 'Min char length is ' + num,
    })
  };

  Validator.prototype.max = function max (num) {
    return this.register({
      type: 'max',
      validate: function (value) { return value.length < num; },
      error: 'Max char length is ' + num,
    })
  };

  Validator.prototype.email = function email () {
    return this.register({
      type: 'email',
      validate: function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); },
      error: 'Email is not valid',
    })
  };

  // import {} from './custom';
  // import validate from './custom/validation/validate';
  // import { Validator } from './custom/validation/Validator';

  var Radi = {
    v: GLOBALS.VERSION,
    version: GLOBALS.VERSION,
    h: html,
    Fetch: Fetch,
    html: html,
    Store: Store,
    customTag: customTag,
    customAttribute: customAttribute,
    patch: patch,
    mount: mount,
    service: service,
    Subscribe: Subscribe,
    Validator: Validator,
  };

  // Pass Radi instance to plugins
  Radi.plugin = function (fn) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    return fn.apply(void 0, [ Radi ].concat( args ));
  };

  // Radi.plugin(validate);

  if (window) { window.Radi = Radi; }

  return Radi;

})));
//# sourceMappingURL=radi.js.map
