(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Radi = factory());
}(this, (function () { 'use strict';

  var GLOBALS = {
    VERSION: '0.5.0',
    CURRENT_COMPONENT: null,
    CUSTOM_ATTRIBUTES: {},
    CUSTOM_TAGS: {},
    IS_UPDATE: false,
    SERVICES: {},
  };

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
   * @param  {HTMLElement} node
   */
  function destroyTree$$1(node) {
    fireEvent('destroy', node);
    node.__radiRef = undefined;

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
  function fireEvent(type, $node, $element) {
    if ( $element === void 0 ) $element = $node;

    var onEvent = document.createEvent('Event');
    onEvent.initEvent(type, false, true);

    if (typeof $node.dispatchEvent === 'function') {
      $node._eventFired = true;
      $node.dispatchEvent(onEvent, $element);
    }

    return $node;
  }

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
  function flatten(list) {
    return list.reduce(function (a, b) { return a.concat(Array.isArray(b) ? flatten(b) : b); }, []);
  }

  /**
   * @param {*[]} list
   * @returns {*[]}
   */
  function ensureArray(list) {
    return flatten([list]);
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
      if (isValidElement(element)) {
      /*
       * Some fields allow for more than one value, so we need to check if this
       * is one of those fields and, if so, store the values as an array.
       */
        if (isCheckbox(element)) {
          if (typeof data[element.name] === 'undefined') { data[element.name] = []; }
          if (isValidValue(element)) {
            data[element.name] = data[element.name]
              .concat(transform(element, element.value));
          }
        } else
        if (isValidValue(element)) {
          if (isMultiSelect(element)) {
            data[element.name] = transform(element, getSelectValues(element));
          } else {
            data[element.name] = transform(element, element.value);
          }
        }
      }

      return data;
    }, {});
  };

  /**
   * @typedef {Object} Node
   * @property {string|function} type
   * @property {{}} props
   * @property {*[]} children
   */

  /**
   * @param  {*} preType
   * @param  {{}} preProps
   * @param  {*[]} preChildren
   * @return {Node}
   */
  function html(preType, preProps) {
    var preChildren = [], len = arguments.length - 2;
    while ( len-- > 0 ) preChildren[ len ] = arguments[ len + 2 ];

    var type = (typeof preType === 'number') ? ("" + preType) : preType;
    var props = preProps || {};
    var children = flatten(preChildren);

    if (type instanceof Promise || (type && type.constructor.name === 'LazyPromise')) {
      type = 'await';
      props = {
        src: preType,
      };
    }

    return {
      type: type,
      props: props,
      children: children,
    };
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
   * @param  {HTMLElement} node
   * @param  {function} next
   */
  function beforeDestroy(node, next) {
    if (typeof node.beforedestroy === 'function') {
      return node.beforedestroy(next);
    }

    return next();
  }

  /**
   * @param  {*|*[]} data
   */
  function destroy(data) {
    var nodes = ensureArray(data);

    nodes.map(function (node) {
      if (!(node instanceof Node)) { return; }

      var parent = node.parentNode;
      if (node instanceof Node && parent instanceof Node) {
        beforeDestroy(node, function () {
          // This is for async node removals
          parent.removeChild(node);
          destroyTree$$1(node);
        });
      }
    });
  }

  /**
   * @typedef {Object} Mount
   * @property {Object} component
   * @property {Object} node
   * @property {function} destroy
   */

  /**
   * @param  {*|*[]} data
   * @param  {HTMLElement} container
   * @param  {HTMLElement} after
   * @return {HTMLElement[]}
   */
  function mount(data, container, after) {
    var nodes = ensureArray(data);

    return nodes.map(function (node) {
      var renderedNode = render$$1(node, container);

      if (Array.isArray(renderedNode)) {
        return mount(renderedNode, container, after);
      }
      
      if (after && after.parentNode) {
        after = insertAfter(renderedNode, after, after.parentNode);
        fireEvent('mount', renderedNode);
        return after;
      }

      if (!container) {
        console.log('[Radi] Mount canceled');
        return nodes;
      }

      var mountedEl = container.appendChild(renderedNode);
      fireEvent('mount', renderedNode);
      return mountedEl;
    });
  }

  var renderQueue = [];

  /**
   * @param {Function} data
   * @returns {Function}
   */
  function addToRenderQueue(data) {
    var fn = data.update || data;
    if (renderQueue.indexOf(fn) < 0) {
      renderQueue.push(fn);
    }
    return fn;
  }

  function clearRenderQueue() {
    renderQueue = [];
  }

  var Dependencies = function Dependencies() {
    this.dependencies = {};
  };

  /**
   * @param {string[]} path
   * @param {Function} component
   */
  Dependencies.prototype.add = function add (path, component) {
    var key = path[0];
    if (typeof this.dependencies[key] === 'undefined') { this.dependencies[key] = []; }

    if (this.dependencies[key].indexOf(component) < 0) {
      // console.log('addDependency', key, component, this.dependencies[key])
      this.dependencies[key].push(component);
    }

    this.dependencies[key] = this.dependencies[key].filter(function (c) {
      if (c.dom instanceof Node) {
        return c.dom.isConnected;
      }

      return true;
    });
  };

  /**
   * @param {string[]} path
   * @param {Function} component
   */
  Dependencies.prototype.remove = function remove (path, component) {
    var key = path[0];
    var index = (this.dependencies[key] || []).indexOf(component);
    if (index >= 0) {
      // console.log('removeDependency', key, component)
      this.dependencies[key].splice(index, 1);
    }
  };

  /**
   * @param {string[]} path
   * @param {Function} component
   */
  Dependencies.prototype.component = function component (path, component$1) {
      var this$1 = this;

    if (component$1) {
      this.add(path, component$1);

      component$1.__onDestroy = function () {
        this$1.remove(path, component$1);
      };
    }
    return component$1;
  };

  /**
   * @param {string} key
   * @param {*} newStore
   * @param {*} oldState
   */
  Dependencies.prototype.trigger = function trigger (key, newStore, oldState) {
    if (this.dependencies[key]) {
      this.dependencies[key].forEach(function (fn) { return (
        addToRenderQueue(fn)(newStore, oldState)
      ); });
    }
  };

  /**
   * @param {*} key
   * @returns {Function}
   */
  var noop = function (e) { return e; };

  var Listener = function Listener(map, store) {
    this.map = map;
    this.getValue = this.getValue.bind(this);
    this.render = this.render.bind(this);
    this.store = store;
    this.dep = store.event;
  };

  /**
   * @param {Function} updater
   * @returns {*} Cached state
   */
  Listener.prototype.getValue = function getValue (updater) {
    var state = this.store.get();

    if (!this.subbed) {
      this.subbed = this.dep.add('*', updater);
    }

    return this.cached = this.map(state);
  };

  /**
   * @returns {Function} That returns mapped state
   */
  Listener.prototype.render = function render () {
    var self = this;

    return (function () {
      var mappedState = self.getValue(this);
      return mappedState;
    });
  };

  /**
   * @param {*} value
   * @returns {boolean}
   */
  function isObject(value) {
    return value && (
      value.constructor === Object
      || value.constructor === Array
    );
  }

  /**
   * @param {Store} store
   * @param {Store} state
   * @param {string[]} path
   * @returns {*} New state
   */
  function evalState(store, state, path) {
    if ( path === void 0 ) path = [];

    if (state) {
      if (isObject(state)) {
        var newState = Array.isArray(state) ? [] : {};
        for (var key in state) {
          newState[key] = evalState(store, state[key], path.concat(key));
        }
        return newState;
      }

      if (state instanceof Store) {
        state.subscribe.call(state, function (newValue) {
          store.update(store.setPartial(path, newValue));
        });
        return state.get();
      }
    }

    return state;
  }

  /**
   * @param {Store} state
   * @param {string|number} key
   * @param {*} value
   * @returns {*} New state
   */
  function mapState(state, key, value) {
    if (state && isObject(state)) {
      var output = Array.isArray(state)
        ? [].concat( state )
        : Object.assign({}, state);
      output[key] = value;
      return output;
    }

    return state;
  }

  var Store = function Store(state) {
    this.dependencies = new Dependencies();
    this.transform = noop;
    this.willDispatch = this.willDispatch.bind(this);
    this.dispatch = this.dispatch.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.update = this.update.bind(this);
    this.get = this.get.bind(this);
    this.storedState = evalState(this, state);
  };

  var prototypeAccessors = { state: { configurable: true } };

  /**
   * @returns {*} Stored state
   */
  prototypeAccessors.state.get = function () {
    if (GLOBALS.CURRENT_COMPONENT) {
      this.dependencies.component('*', GLOBALS.CURRENT_COMPONENT);
    }

    return this.get();
  };

  /**
   * @returns {*} Transformed state
   */
  Store.prototype.get = function get () {
    return this.transform(this.storedState);
  };

  /**
   * @param {Function} transform
   * @returns {Store}
   */
  Store.prototype.map = function map (transform) {
    var last = this.transform;
    this.transform = function (data) { return transform(last(data)); };
    return this;
  };

  /**
   * @param {string[]} path
   * @param {*} newValue
   * @param {*} source Stored state
   * @returns {*} Mapped state
   */
  Store.prototype.setPartial = function setPartial (path, newValue, source) {
      if ( source === void 0 ) source = this.storedState;

    if (source && path && path.length) {
      var current = path[0];
        var nextPath = path.slice(1);
      return mapState(source, current, this.setPartial(nextPath, newValue, source[current]));
    }

    return newValue;
  };

  /**
   * @param {*} newState
   * @returns {*} Mapped state
   */
  Store.prototype.update = function update (newState) {
    var parsedState = evalState(this, newState);
    var oldStore = this.get();
    this.storedState = parsedState;
    this.dependencies.trigger('*', this.get(), oldStore);
    clearRenderQueue();
    return this.get();
  };

  /**
   * @param {Function} callback
   * @returns {Store}
   */
  Store.prototype.subscribe = function subscribe (callback) {
    this.dependencies.add('*', callback);
    callback(this.get(), null);
    return this;
  };

  /**
   * @param {Function} subscriber
   */
  Store.prototype.unsubscribe = function unsubscribe (subscriber) {
    this.dependencies.remove('*', subscriber);
  };

  /**
   * @param {Function} action
   * @param {*[]} args
   * @returns {*} Mapped state
   */
  Store.prototype.dispatch = function dispatch (action) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    var payload = action.apply(void 0, [ this.storedState ].concat( args ));
    // console.log('dispatch', {
    // action: action.name,
    // args: args,
    // payload,
    // });
    // console.log('dispatch', action.name, payload);
    return this.update(payload);
  };

  /**
   * @param {Function} action
   * @param {*[]} args
   * @returns {Function} Store.dispatch
   */
  Store.prototype.willDispatch = function willDispatch (action) {
      var this$1 = this;
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    return function () {
        var ref;

        var args2 = [], len = arguments.length;
        while ( len-- ) args2[ len ] = arguments[ len ];
        return (ref = this$1).dispatch.apply(ref, [ action ].concat( args, args2 ));
      };
  };

  /**
   * @param {Function} listenerToRender
   * @returns {Listener}
   */
  Store.prototype.listener = function listener (listenerToRender) {
      if ( listenerToRender === void 0 ) listenerToRender = function (e) { return e; };

    return new Listener(listenerToRender, this);
  };

  Object.defineProperties( Store.prototype, prototypeAccessors );

  function Fetcher(resolver, success, error) {
    return function (defaults) {
      var fetcherStore = new Store(defaults);

      if (typeof resolver === 'function') {
        resolver()
          .then(success || (function (returned) {
            fetcherStore.dispatch(function () { return returned; });
          }))
          .catch(error || (function (err) {
            console.error(err);
          }));
      }

      return fetcherStore;
    };
  }

  /**
   * @param       {EventTarget} [target=document]
   * @constructor
   */
  function Subscribe(target) {
    if ( target === void 0 ) target = document;

    return {
      /**
       * @param {string} eventHolder
       * @param {Function} transformer
       * @returns {Store}
       */
      on: function (eventHolder, transformer) {
        if ( transformer === void 0 ) transformer = function (e) { return e; };

        var events = eventHolder.trim().split(' ');
        var eventSubscription = null;
        var staticDefaults = null;
        var staticStore = null;
        var state = false;

        if (typeof transformer !== 'function') {
          throw new Error(("[Radi.js] Subscription `" + eventHolder + "` must be transformed by function"));
        }

        function updater(defaults, newStore) {
          var store = typeof newStore !== 'undefined' ? newStore : new Store(defaults);

          state = true;
          staticDefaults = defaults;
          staticStore = store;
          events.forEach(function (event) { return target.addEventListener(event,
            eventSubscription = function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                return store.dispatch(function () { return transformer.apply(void 0, args.concat( [event] )); });
            }
          ); });

          return store;
        }

        updater.stop = function () {
          if (state) {
            events.forEach(function (event) { return target.removeEventListener(event, eventSubscription); });
          }
          return state = !state;
        };
        updater.start = function () { return !state && updater(staticDefaults, staticStore); };

        return updater;
      },
    };
  }

  /**
   * @param {Component} compNode
   * @returns {Function<HTMLElement|HTMLElement[]>}
   */
  function refFactory(compNode) {
    return function (data, ii) {
      if (ii && Array.isArray(compNode.dom)) {
        return compNode.dom[ii] = data;
      }
      return compNode.dom = data;
    };
  }

  /**
   * @param {HTMLElement|HTMLElement[]} node
   * @param {HTMLElement} $parent
   * @returns {HTMLElement|HTMLElement[]}
   */
  function render$$1(node, $parent) {
    if (Array.isArray(node)) {
      var output = flatten(node).map(function (n) { return render$$1(n, $parent); });

      // Always must render some element
      // In case of empty array we simulate empty element as null
      if (output.length === 0) { return render$$1([null], $parent); }

      return output;
    }

    if (node && node.__esModule && node.default) {
      return render$$1(node.default, $parent);
    }

    if ((node && typeof node.type === 'function') || typeof node === 'function') {
      var componentFn = node.type || node;
      var compNode = new Component(componentFn, node.props, node.children);
      var tempComponent = GLOBALS.CURRENT_COMPONENT;
      GLOBALS.CURRENT_COMPONENT = compNode;
      var renderedComponent = compNode.render(node.props, node.children, $parent);

      var $styleRef;

      if (renderedComponent && typeof renderedComponent.addEventListener === 'function') {
        renderedComponent.addEventListener('mount', function () {
          if (typeof compNode.style === 'string') {
            $styleRef = document.createElement('style');
            $styleRef.innerHTML = compNode.style;
            document.head.appendChild($styleRef);
          }
          compNode.trigger('mount', renderedComponent);
        }, {
          passive: true,
          once: true,
        }, false);

        renderedComponent.addEventListener('destroy', function () {
          compNode.trigger('destroy', renderedComponent);
          if ($styleRef instanceof Node) {
            document.head.removeChild($styleRef);
          }
        }, {
          passive: true,
          once: true,
        }, false);
      }

      if (Array.isArray(renderedComponent)) {
        renderedComponent.forEach(function (compItem) {
          if (compItem && typeof compItem.addEventListener === 'function') {
            compItem.addEventListener('mount', function () {
              if (typeof compNode.style === 'string') {
                $styleRef = document.createElement('style');
                $styleRef.innerHTML = compNode.style;
                document.head.appendChild($styleRef);
              }
              compNode.trigger('mount', compItem);
            }, {
              passive: true,
              once: true,
            }, false);

            compItem.addEventListener('destroy', function () {
              compNode.trigger('destroy', compItem);
              if ($styleRef instanceof Node) {
                document.head.removeChild($styleRef);
              }
            }, {
              passive: true,
              once: true,
            }, false);
          }
        });
      }

      if (Array.isArray(renderedComponent)) {
        renderedComponent[0].__radiRef = refFactory(compNode);
      } else {
        renderedComponent.__radiRef = refFactory(compNode);
      }
      GLOBALS.CURRENT_COMPONENT = tempComponent;

      return renderedComponent;
    }

    if (node instanceof Node) {
      return node;
    }

    if (node instanceof Listener) {
      return node.render();
    }

    if (node instanceof Promise) {
      return render$$1({ type: 'await', props: { src: node }, children: [] }, $parent);
    }

    // if the node is text, return text node
    if (['string', 'number'].indexOf(typeof node) > -1) { return document.createTextNode(node); }

    // We still have to render nodes that are hidden, to preserve
    // node tree and ref to components
    if (!node) {
      return document.createComment('');
    }

    if (!(
      typeof node.type !== 'undefined'
      && typeof node.props !== 'undefined'
      && typeof node.children !== 'undefined'
    )) {
      return document.createTextNode(JSON.stringify(node));
    }

    if (typeof GLOBALS.CUSTOM_TAGS[node.type] !== 'undefined') {
      return render$$1(Object.assign({}, node,
        {type: GLOBALS.CUSTOM_TAGS[node.type].render}), $parent);
    }

    // create element
    var element;
    if (node.type === 'svg' || $parent instanceof SVGElement) {
      element = document.createElementNS(
        'http://www.w3.org/2000/svg',
        node.type
      );
    } else {
      element = document.createElement(node.type);
    }

    // set attributes
    setProps(element, node.props);

    // build and append children
    if (node.children) {
      flatten(node.children || []).forEach(function (child) {
        var childNode = child instanceof Node ? child : render$$1(child, element);
        mount(childNode, element);
      });
    }

    return element;
  }

  /**
   * @param {*} value
   * @param {Function} fn
   * @returns {*}
   */
  function autoUpdate(value, fn) {
    if (value instanceof Listener) {
      return fn(value.getValue(function (e) { return fn(value.map(e)); }));
    }
    return fn(value);
  }

  /**
   * @param {HTMLElement} $target
   * @param {string} name
   * @param {*} value
   */
  function setBooleanProp($target, name, value) {
    if (value) {
      $target.setAttribute(name, value);
      $target[name] = true;
    } else {
      $target[name] = false;
    }
  }

  /**
   * @param {HTMLElement} $target
   * @param {string} name
   */
  function removeBooleanProp($target, name) {
    $target.removeAttribute(name);
    $target[name] = false;
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  function isEventProp(name) {
    return /^on/.test(name);
  }

  /**
   * @param {string} name
   * @returns {string}
   */
  function extractEventName(name) {
    return name.slice(2).toLowerCase();
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  function isCustomProp(name) {
    return isEventProp(name);
  }

  /**
   * @param {HTMLElement} $target
   * @param {string} name
   * @param {*} value
   */
  function setProp($target, name, value) {
    if (name === 'style' && typeof value !== 'string') {
      setStyles($target, value);
    } else if (isCustomProp(name)) {
      addEventListener($target, name, value);
    } else if (name === 'className') {
      $target.setAttribute('class', value);
    } else if (typeof value === 'boolean') {
      setBooleanProp($target, name, value);
    } else {
      if (name === 'value' && document.activeElement !== $target) {
        $target[name] = value;
      }
      $target.setAttribute(name, value);
    }
  }

  /**
   * @param {HTMLElement} $target
   * @param {string} name
   * @param {*} value
   */
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

  /**
   * @param {HTMLElement} $target
   * @param {{}} styles
   */
  function setStyles($target, styles) {
    Object.keys(styles).forEach(function (name) {
      autoUpdate(styles[name], function (value) {
        $target.style[name] = value;
      });
    });
  }

  /**
   * @param {HTMLElement} $target
   * @param {{}} props
   */
  function setProps($target, props) {
    (Object.keys(props || {})).forEach(function (name) {
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
            props[name] = caller($target, props[name]);
          }
          if (!addToElement) { return; }
        }
      }

      autoUpdate(props[name], function (value) {
        if (name === 'model') {
          name = 'value';
        } else
        if (name === 'class' || name === 'className') {
          if (Array.isArray(value)) {
            value = value.filter(function (v) { return v && typeof v !== 'function'; }).join(' ');
          }
        }
        setProp($target, name, value);
      });
    });
  }

  /**
   * @param {*} value
   * @returns {boolean}
   */
  function isRemovableProp(value) {
    return typeof value === 'undefined' || value === false || value === null;
  }

  /**
   * @param {HTMLElement} $target
   * @param {string} name
   * @param {*} newVal
   * @param {*} oldVal
   */
  function updateProp($target, name, newVal, oldVal) {
    if (isRemovableProp(newVal)) {
      removeProp($target, name, oldVal);
    } else if (!oldVal || newVal !== oldVal) {
      setProp($target, name, newVal);
    }
  }

  /**
   * @param {HTMLElement} $target
   * @param {{}} newProps
   * @param {{}} oldProps = {}
   */
  function updateProps($target, newProps, oldProps) {
    if ( oldProps === void 0 ) oldProps = {};

    var props = Object.assign({}, newProps, oldProps);
    Object.keys(props).forEach(function (name) {
      autoUpdate(newProps[name], function (value) {
        if (name === 'model') {
          name = 'value';
        }
        updateProp($target, name, value, oldProps[name]);
      });
    });
  }

  /**
   * @param {HTMLElement} $target
   * @param {string} name
   * @param {*} value
   */
  function addEventListener($target, name, value) {
    var exceptions = ['mount', 'destroy'];
    if (isEventProp(name)) {
      $target.addEventListener(
        extractEventName(name),
        function (e) {
          if (exceptions.indexOf(name) >= 0) {
            if ($target === e.target) { value(e); }
          } else
          if (typeof value === 'function') {
            value(e);
          }
        },
        false
      );
    }
  }

  /**
   * @param  {Node|Node[]} nodes
   * @param  {HTMLElement} dom
   * @param  {HTMLElement} parent
   * @param  {HTMLElement} $pointer
   * @returns {HTMLElement|HTMLElement[]}
   */
  function patch(nodes, dom, parent, $pointer) {
    if ( parent === void 0 ) parent = dom && dom.parentNode;
    if ( $pointer === void 0 ) $pointer = null;

    if (Array.isArray(nodes) || Array.isArray(dom)) {
      var flatNodes = Array.isArray(nodes) && nodes.length === 0 ? [null] : ensureArray(nodes);
      var flatDom = ensureArray(dom);
      var ref = Array.isArray(dom)
        ? dom[0] && dom[0].__radiRef
        : dom.__radiRef;

      var lastNode = dom;

      var outcome = flatNodes.map(function (node, ii) {
        var staticLastNode = lastNode;
        var outputNode = patch(
          node,
          flatDom[ii],
          (flatDom[ii] && flatDom[ii].parentNode) || parent,
          !flatDom[ii] && staticLastNode
        );

        // Need to memoize last rendered node
        lastNode = Array.isArray(outputNode)
          ? outputNode[0]
          : outputNode;

        // Make nested & updated components update their refrences
        if (typeof ref === 'function' && ii > 0) {
          lastNode.__radiRef = function (data) { return ref(data, ii); };
          lastNode.__radiRef(lastNode, ii);
        }

        return outputNode;
      });

      // Unused nodes can be savely remove from DOM
      if (flatDom.length > flatNodes.length) {
        var unusedDomNodes = flatDom.slice(flatNodes.length - flatDom.length);
        unusedDomNodes.forEach(destroy);
      }

      // Pass new nodes refrence to function containing it
      if (typeof ref === 'function') { ref(outcome); }

      return outcome;
    }

    /*
      TODO: Make dom structure in before making HTMLElement
      so that we can diff that structure with existing DOM

      Preferrably it would look like this:

      ```
      {
        type: 0,
        query: function Component() {},
        props: {},
        children: [
          {
            type: 1,
            query: 'button',
            props: {
              onclick: function dispatch() {}
            },
            children: [
              {
                type: 2,
                query: 'Click me'
              }
            ]
          }
        ]
      }
      ```
    */

    /* Currently we'll render HTMLElements and diff them with real dom */

    var newNode = render$$1(nodes, parent);

    return patchDomRecursively(dom, newNode, parent, $pointer);
  }

  /**
   * @param {HTMLElement} node1
   * @param {HTMLElement} node2
   * @returns {boolean}
   */
  function nodeChanged(node1, node2) {
    if (node1.nodeType === 3 && node2.nodeType === 3 && node1.__radiRef) { return true; }
    if (node1.nodeType === node2.nodeType) { return false; }
    if (node1.nodeName === node2.nodeName) { return false; }

    return true;
  }

  /**
   * @param {NamedNodeMap} value
   * @returns {{}}
   */
  function attributesToObject(value) {
    return [].reduce.call(value, function (acc, obj) {
      var obj$1;

      return (Object.assign({}, acc,
      ( obj$1 = {}, obj$1[obj.name] = obj.value, obj$1)));
    }, {});
  }

  /**
   * @param {HTMLElement} oldDom
   * @param {HTMLElement} newDom
   * @param {HTMLElement} parent
   * @param {HTMLElement} pointer
   * @returns {HTMLElement}
   */
  function patchDomRecursively(oldDom, newDom, parent, pointer) {
    var active = document.activeElement;

    if (!oldDom && (pointer || parent)) {
      var mounter = mount(newDom, parent, pointer);
      return mounter;
    }

    if (typeof newDom === 'undefined') {
      destroy(oldDom);
      return oldDom;
    }

    if (oldDom && parent) {
      if (!nodeChanged(oldDom, newDom)) {
        if (oldDom.nodeType === 3 && newDom.nodeType === 3
          && oldDom.textContent !== newDom.textContent) {
          oldDom.textContent = newDom.textContent;

          fireEvent('mount', newDom, oldDom);
        }

        if (oldDom.childNodes || newDom.childNodes) {
          var length = Math.max(oldDom.childNodes.length, newDom.childNodes.length);

          /* We should always run patch childnodes in reverse from last to first
          because if node is removed, it removes whole element in array */
          for (var ii = length - 1; ii >= 0; ii--) {
            patchDomRecursively(
              oldDom.childNodes[ii],
              newDom.childNodes[ii] && newDom.childNodes[ii],
              oldDom
            );
          }
        }

        // TODO: After we have structured objects not dom nodes,
        // should use props from there
        if (oldDom.nodeType === 1 && newDom.nodeType === 1) {
          var oldAttrs = attributesToObject(oldDom.attributes);
          var newAttrs = attributesToObject(newDom.attributes);
          updateProps(oldDom, newAttrs, oldAttrs);
        }

        if (oldDom.__radiRef) {
          oldDom.__radiRef(oldDom);
        }

        active.focus();
        return oldDom;
      }

      mount(newDom, parent, oldDom);

      if (oldDom.__radiRef) {
        newDom.__radiRef = oldDom.__radiRef;
        newDom.__radiRef(newDom);
      }

      destroy(oldDom);
    }

    active.focus();
    return newDom;
  }

  var Component = function Component(type) {
    this.type = type;
    this.name = type.name;
    this.render = this.render.bind(this);
    this.evaluate = this.evaluate.bind(this);
    this.update = this.update.bind(this);
    this.updateWithProps = this.updateWithProps.bind(this);
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
      var ref;

      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
    var name = "on" + (capitalise(event));

    (this.__$events[name] || [])
      .map(function (e) { return e.apply(void 0, args); });

    if (typeof this[name] === 'function') {
      (ref = this)[name].apply(ref, args);
    }
  };

  /**
   * @param{{}} props
   * @param{*[]} children
   */
  Component.prototype.evaluate = function evaluate (props, children) {
    this.props = props;
    this.children = children;

    return this.node = this.type.call(
      this,
      Object.assign({}, this.props,
        {children: this.children})
    );
  };

  /**
   * @param{string} props
   * @param{*[]} children
   * @param{HTMLElement} parent
   */
  Component.prototype.render = function render$1 (props, children, parent) {
    return this.dom = render$$1(this.evaluate(props, children), parent);
  };

  /**
   * @returns {HTMLElement}
   */
  Component.prototype.update = function update () {
    var oldDom = this.dom;

    return this.dom = patch(
      this.evaluate(this.props, this.children),
      oldDom
    );
  };

  /**
   * @param{{}} props
   * @param{*[]} children
   * @returns {HTMLElement}
   */
  Component.prototype.updateWithProps = function updateWithProps (props, children) {
      if ( props === void 0 ) props = this.props;
      if ( children === void 0 ) children = this.children;

    this.props = props;
    this.children = children;
    return this.update();
  };

  var Service = function Service () {};

  Service.prototype.add = function add (name, fn) {
      var args = [], len = arguments.length - 2;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

    if (typeof name !== 'string') {
      throw new Error('[Radi.js] Service first argument has to be string');
    }

    if (typeof this[name] !== 'undefined' || typeof Component.prototype[name] !== 'undefined') {
      throw new Error('[Radi.js] Service "' + name + '" is already in use');
    }

    if (typeof fn !== 'function') {
      throw new Error('[Radi.js] Service second argument has to be function');
    }

    var mounted = fn.apply(void 0, args);

    Component.prototype[name] = this[name] = mounted;

    return GLOBALS.SERVICES[name] = mounted;
  };

  var service = new Service();

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
    el.addEventListener('mount', function () { return setTimeout(function () { return el.focus(); }, 0); }
    );
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

  function extractValue(value) {
    return Array.isArray(value)
      ? value.map(function (arr) { return arr.value; })
      : value.value;
  }

  function extractTouched(value, elements) {
    return Array.isArray(value)
      ? [].reduce.call(elements, function (acc, val) { return (val.touched && true) || acc; }, false)
      : value.touched;
  }

  function fullValidate(elements, rules, update) {
    var values = formToJSON(elements, function (ref, value) {
      var touched = ref.touched;

      return ({touched: touched, value: value});
    });
    var plainValues = Object.keys(values)
      .reduce(function (acc, key) {
        var obj;

        return (Object.assign({}, acc,
        ( obj = {}, obj[key] = extractValue(values[key]), obj)));
    }, {});
    var errors = [];

    for (var name in values) {
      var value = values[name];

      if (typeof rules[name] === 'function') {
        var result = rules[name](extractValue(value), plainValues);
        var valid = (
            result
            && typeof result.check === 'function'
            && result.check()
          )
          || result
          || name + ' field is invalid';

        if (valid !== true) { errors.push({
          field: name,
          touched: Boolean(extractTouched(value, elements[name])),
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
      var elements = el.elements;
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
    function Await(props) {
      var this$1 = this;

      var placeholderTimeout;
      var src = props.src;
      var waitMs = props.waitMs;
      var transform = props.transform; if ( transform === void 0 ) transform = function (e) { return e; };
      var error = props.error; if ( error === void 0 ) error = function (e) { return e; };
      var placeholder = props.placeholder; if ( placeholder === void 0 ) placeholder = 'Loading..';
      var value = props.value; if ( value === void 0 ) value = null;
      var loaded = props.loaded; if ( loaded === void 0 ) loaded = false;

      if (!(src &&
        (src instanceof Promise || src.constructor.name === 'LazyPromise')
      )) {
        console.warn('[Radi] <await/> must have `src` as a Promise');
        return null;
      }

      if (!loaded) {
        if (placeholder !== value) {
          if (waitMs) {
            placeholderTimeout = setTimeout(function () {
              this$1.updateWithProps(Object.assign({}, props, {value: placeholder}));
            }, waitMs);
          } else {
            value = placeholder;
          }
        }

        src
          .then(function (value) {
            clearTimeout(placeholderTimeout);
            this$1.updateWithProps(Object.assign({}, props, {value: ensureFn(transform)(value), loaded: true}));
          })
          .catch(function (err) {
            console.error(err);
            clearTimeout(placeholderTimeout);
            this$1.updateWithProps(Object.assign({}, props, {value: ensureFn(error)(err), loaded: true}));
          });
      }

      return value;
    }
  );

  customTag('errors',
    function Errors(ref) {
      var name = ref.name;
      var onrender = ref.onrender; if ( onrender === void 0 ) onrender = function (e) { return (e); };

      var state = errorsStore.state;

      if (typeof name === 'undefined') {
        console.warn('[Radi.js] Warn: Every <errors> tag needs to have `name` attribute!');
      }
      if (typeof onrender !== 'function') {
        console.warn('[Radi.js] Warn: Every <errors> tag needs to have `onrender` attribute!');
      }

      return html(function () { return state[name] && onrender(state[name]); });
    }
  );

  var h = html;

  var ModalStore = new Store({});

  var registerModal = function (store, name) {
    var obj;

    return (Object.assign({}, store,
    ( obj = {}, obj[name] = false, obj)));
  };

  var switchModal = function (store, name, type) {
    var obj;

    return (Object.assign({}, store,
    ( obj = {}, obj[name] = type, obj)));
  };

  var ModalService = service.add('modal', function () {
    return {
      open: function (name) { return ModalStore.dispatch(switchModal, name, true); },
      close: function (name) { return ModalStore.dispatch(switchModal, name, false); },
      onOpen: function (name, fn) { return ModalStore.subscribe(function (n, p) { return n[name] === true && n[name] !== p[name] && fn(); }); },
      onClose: function (name, fn) { return ModalStore.subscribe(function (n, p) { return n[name] === false && n[name] !== p[name] && fn(); }); },
    };
  });

  // TODO: Figure out a different approach to modal
  customTag('modal',
    function Modal(ref) {
      var name = ref.name; if ( name === void 0 ) name = 'default';
      var children = ref.children;

      var modal = ModalStore.state;

      if (typeof name === 'undefined') {
        console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
      }

      this.onMount = function (el) {
        if (!modal[name])
        { ModalStore.dispatch(registerModal, name); }
      };

      return h('portal', {},
        modal[name] && h('div',
          { class: 'radi-modal', name: name },
          h('div', {
            class: 'radi-modal-backdrop',
            onclick: function () { return service.modal.close(name); },
          }),
          h.apply(void 0, [ 'div',
            { class: 'radi-modal-content' } ].concat( (children.slice()) )
          )
        )
      );
    }
  );

  customTag('portal',
    function Portal(data) {
      var children = data.children; if ( children === void 0 ) children = [];
      var parent = data.parent; if ( parent === void 0 ) parent = data.on || document.body;
      var $ref;

      this.onMount = function (e) {
        mount(function () {
          var this$1 = this;

          this.onMount = function (e) {
            $ref = this$1.dom;
          };
          return html('portal-body', {}, children)
        }, parent);
      };

      this.onDestroy = function (e) {
        destroy($ref);
      };

      return null;
    }
  );

  var validValue = function (value) { return (
    typeof value === 'string'
      || typeof value === 'number'
      || value
  ); };

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
      validate: function (value) { return (validValue(value) && validate(value)); },
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
      validate: function (value) { return value === '' || regexp.test(value); },
      error: 'Field must be valid',
    })
  };

  Validator.prototype.includes = function includes (include) {
    return this.register({
      type: 'includes',
      validate: function (value) { return value === '' ||
        (Array.isArray(value) && value.indexOf(include) >= 0); },
      error: 'Field must include ' + include,
    })
  };

  Validator.prototype.excludes = function excludes (exclude) {
    return this.register({
      type: 'excludes',
      validate: function (value) { return value === '' ||
        (Array.isArray(value) && value.indexOf(exclude) < 0); },
      error: 'Field must exclude ' + exclude,
    })
  };

  Validator.prototype.equal = function equal (equal$1) {
    return this.register({
      type: 'equal',
      validate: function (value) { return value === '' || value === equal$1; },
      error: 'Field must be equal to ' + equal$1,
    })
  };

  Validator.prototype.notEqual = function notEqual (equal) {
    return this.register({
      type: 'notEqual',
      validate: function (value) { return value === '' || value !== equal; },
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
      validate: function (value) { return value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); },
      error: 'Email is not valid',
    })
  };

  var Radi = {
    v: GLOBALS.VERSION,
    version: GLOBALS.VERSION,
    h: html,
    html: html,
    Fetcher: Fetcher,
    Store: Store,
    customTag: customTag,
    customAttribute: customAttribute,
    destroy: destroy,
    patch: patch,
    mount: mount,
    service: service,
    Service: service,
    Subscribe: Subscribe,
    Validator: Validator,
  };

  // Pass Radi instance to plugins
  Radi.plugin = function (fn) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    return fn.apply(void 0, [ Radi ].concat( args ));
  };

  if (window) { window.Radi = Radi; }

  return Radi;

})));
//# sourceMappingURL=radi.js.map
