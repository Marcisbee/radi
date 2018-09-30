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
   * @param  {string}   name
   * @param  {Function} fn
   * @param  {*[]}   args
   * @return {Function}
   */
  function service(name, fn) {
    var args = [], len = arguments.length - 2;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

    if (typeof name !== 'string') {
      throw new Error('[Radi.js] Service first argument has to be string');
    }

    if (typeof fn !== 'function') {
      throw new Error('[Radi.js] Service second argument has to be function');
    }

    var mounted = fn.apply(void 0, args);

    service.prototype[name] = mounted;

    return GLOBALS.SERVICES[name] = mounted;
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
   * @param  {HTMLElement} node
   */
  function destroyTree(node) {
    fireEvent('destroy', node);
    var instance = node.__radiInstance;
    if (instance) {
      instance.trigger('destroy');
      instance.__onDestroy();
    }
    node.__radiInstance = null;

    if (node.nodeType === 1) {
      var curChild = node.firstChild;
      while (curChild) {
        destroyTree(curChild);
        curChild = curChild.nextSibling;
      }
    }
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

    if (type instanceof Promise || (type && type.constructor.name === 'LazyPromise')) {
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

  var componentStore = {
    currentComponent: null,
  };

  function setAttribute(dom, key, value) {
    if (typeof GLOBALS.CUSTOM_ATTRIBUTES[key] !== 'undefined') {
      var ref = GLOBALS.CUSTOM_ATTRIBUTES[key];
      var allowedTags = ref.allowedTags;

      if (!allowedTags || (
        allowedTags
          && allowedTags.length > 0
          && allowedTags.indexOf(dom.localName) >= 0
      )) {
        if (typeof GLOBALS.CUSTOM_ATTRIBUTES[key].caller === 'function') {
          GLOBALS.CUSTOM_ATTRIBUTES[key].caller(dom, value);
        }
        if (!GLOBALS.CUSTOM_ATTRIBUTES[key].addToElement) { return; }
      }
    }

    if (typeof value === 'function' && key.startsWith('on')) {
      var eventType = key.slice(2).toLowerCase();
      dom.__radiHandlers = dom.__radiHandlers || {};
      dom.removeEventListener(eventType, dom.__radiHandlers[eventType]);
      dom.__radiHandlers[eventType] = value;
      dom.addEventListener(eventType, dom.__radiHandlers[eventType]);
    } else if (key === 'checked' || key === 'value' || key === 'className') {
      dom[key] = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(dom.style, value);
    } else if (key === 'ref' && typeof value === 'function') {
      value(dom);
    } else if (key === 'key') {
      dom.__radiKey = value;
    } else if (typeof value !== 'object' && typeof value !== 'function') {
      if (value) {
        dom.setAttribute(key, value);
      } else {
        dom.removeAttribute(key);
      }
    }
  }

  function render(vdom, parent) {
    var ref;

    if ( parent === void 0 ) parent = null;
    var mount = parent ? (function (el) { return parent.appendChild(el); }) : (function (el) { return el; });
    var itemToMount;
    if (typeof vdom === 'string' || typeof vdom === 'number') {
      itemToMount = mount(document.createTextNode(vdom));
    } else if (typeof vdom === 'boolean' || vdom === null || typeof vdom === 'undefined') {
      itemToMount = mount(document.createTextNode(''));
    } else if (typeof vdom === 'object' && typeof vdom.type === 'function') {
      itemToMount = renderComponent(vdom, parent);
    } else if (typeof vdom === 'object' && typeof vdom.type === 'string') {
      var dom = mount(document.createElement(vdom.type));
      for (var child of (ref = []).concat.apply(ref, vdom.children)) render(child, dom);
      for (var prop in vdom.props) { setAttribute(dom, prop, vdom.props[prop]); }
      itemToMount = dom;
    }

    if (itemToMount) {
      fireEvent('mount', itemToMount);
      return itemToMount;
    }
    throw new Error(("Invalid VDOM: " + vdom + "."));
  }

  function evaluate(comp, fn) {
    var temp = componentStore.currentComponent;
    componentStore.currentComponent = comp;
    var evaluated = fn();
    componentStore.currentComponent = temp;
    return evaluated;
  }

  function renderComponent(vdom, parent) {
    var props = Object.assign({}, vdom.props, { children: vdom.children });

    var lifecycles = new Component(vdom.type);

    lifecycles.update = function () { return patchComponent(lifecycles.dom, vdom, parent); };
    lifecycles.render = function (instance) {
      if ( instance === void 0 ) instance = lifecycles;

      return (
      evaluate(instance, function () { return vdom.type.call(lifecycles, props); })
    );
    };
    lifecycles.dom = render(
      lifecycles.render(),
      parent
    );

    var $styleRef;

    if (lifecycles.dom && typeof lifecycles.dom.addEventListener === 'function') {
      lifecycles.on('mount', function () {
        if (typeof lifecycles.style === 'string') {
          $styleRef = document.createElement('style');
          $styleRef.innerHTML = lifecycles.style;
          document.head.appendChild($styleRef);
        }
      }, {
        passive: true,
        once: true,
      }, false);

      lifecycles.on('destroy', function () {
        lifecycles.dom = null;
        lifecycles.self = null;
        lifecycles.__$events = {};
        if ($styleRef instanceof Node) {
          document.head.removeChild($styleRef);
        }
      }, {
        passive: true,
        once: true,
      }, false);
    }

    lifecycles.dom.__radiInstance = lifecycles;
    lifecycles.trigger('mount', lifecycles.dom, parent);
    return lifecycles.dom;
  }

  function patchComponent(dom, vdom, parent) {
    if ( parent === void 0 ) parent = dom.parentNode;

    var props = Object.assign({}, vdom.props, { children: vdom.children });
    var instance = dom.__radiInstance;
    if (instance && instance.self === vdom.type) {
      return patch(dom, instance.render(), parent);
    } else if (instance.isPrototypeOf(vdom.type)) {
      var ndom = renderComponent(vdom, parent);
      return parent ? (parent.replaceChild(ndom, dom) && ndom) : (ndom);
    } else if (!instance.isPrototypeOf(vdom.type)) {
      return patch(dom, vdom.type(props), parent);
    }
    return null;
  }

  function beforeDestroy(node, next) {
    if (typeof node.beforedestroy === 'function') {
      return node.beforedestroy(next);
    }

    return next();
  }

  function patch(dom, vdom, parent) {
    var ref, ref$1;

    if ( parent === void 0 ) parent = dom.parentNode;
    var replace = parent ? function (el) { return (parent.replaceChild(el, dom) && el); } : (function (el) { return el; });
    if (typeof vdom === 'object' && typeof vdom.type === 'function') {
      return patchComponent(dom, vdom, parent);
    } else if (typeof vdom !== 'object' && dom instanceof Text) {
      return dom.textContent !== vdom ? replace(render(vdom, parent)) : dom;
    } else if (typeof vdom === 'object' && dom instanceof Text) {
      return replace(render(vdom, parent));
    } else if (typeof vdom === 'object' && dom.nodeName !== vdom.type.toUpperCase()) {
      return replace(render(vdom, parent));
    } else if (typeof vdom === 'object' && dom.nodeName === vdom.type.toUpperCase()) {
      var pool = {};
      var active = document.activeElement;
      (ref = []).concat.apply(ref, dom.childNodes).filter(function (n) { return !n.__radiRemoved; }).forEach(function (child, index) {
        var key = child.__radiKey || ("__index_" + index);
        pool[key] = child;
      });
      (ref$1 = []).concat.apply(ref$1, vdom.children).forEach(function (child, index) {
        var key = child.props && (child.props.key || ("__index_" + index));
        if (pool[key]) {
          fireEvent('update', patch(pool[key], child));
          delete pool[key];
        } else {
          var temp = pool[key] ? patch(pool[key], child) : render(child, dom);
          if (temp) {
            dom.appendChild(temp);
            delete pool[key];
          }
        }
      });
      var loop = function ( key ) {
        pool[key].__radiRemoved = true;
        beforeDestroy(pool[key], function () {
          // This is for async node removals
          destroyTree(pool[key]);
          pool[key].remove();
        });
      };

      for (var key in pool) loop( key );
      for (var attr of dom.attributes) dom.removeAttribute(attr.name);
      for (var prop in vdom.props) { setAttribute(dom, prop, vdom.props[prop]); }
      active.focus();
      return dom;
    }
    return null;
  }

  function anchored(anchor, to) {
    return function (newState, oldState) {
      if (anchor[0] === newState) { return false; }
      if (newState !== oldState) {
        anchor[0] = newState;
        to.dispatch(function () { return newState; });
      }
      return true;
    };
  }

  function extractState(state, path) {
    var this$1 = this;
    if ( path === void 0 ) path = [];

    if (!state) { return state; }

    if (this && state && typeof state.subscribe === 'function') {
      var anchor = [];
      if (path.length > 0) {
        state.subscribe(function (newState, oldState) {
          if (anchor[0] === newState) { return false; }
          if (newState !== oldState) {
            this$1.dispatch(function () { return this$1.setPartial(path, newState); });
            anchor[0] = newState;
          }
          return true;
        });
      } else {
        this.subscribe(anchored(anchor, state));
        state.subscribe(anchored(anchor, this));
      }
      return state.get();
    }

    if (typeof state === 'object') {
      var tempState = Array.isArray(state) ? new Array(state.length) : {};
      for (var key in state) {
        if (state.hasOwnProperty(key)) {
          tempState[key] = extractState.call(this$1, state[key], path.concat(key));
        }
      }
      return tempState;
    }

    return state;
  }

  function clone(target, source) {
    var out = Array.isArray(target) ? [] : {};

    for (var i in target) { out[i] = target[i]; }
    for (var i$1 in source) { out[i$1] = source[i$1]; }

    return out;
  }

  function proxied(state, fn, path) {
    if ( path === void 0 ) path = [];

    return new Proxy(state, {
      get: function get(_, prop) {
        var newPath = path.concat(prop);

        if (typeof state[prop] === 'object') {
          return proxied(state[prop], fn, newPath);
        }

        if (typeof fn === 'function') { fn(newPath); }
        return state[prop];
      },
    });
  }

  function Dependencies() {
    var this$1 = this;

    this.dependencies = {};
    this.add = function (path, component) {
      var key = path[0];
      if (typeof this$1.dependencies[key] === 'undefined') { this$1.dependencies[key] = []; }

      if (this$1.dependencies[key].indexOf(component) < 0) {
        // console.log('addDependency', key, component)
        this$1.dependencies[key].push(component);
      }
    };
    this.remove = function (path, component) {
      var key = path[0];
      var index = (this$1.dependencies[key] || []).indexOf(component);
      if (index >= 0) {
        // console.log('removeDependency', key, component)
        this$1.dependencies[key].splice(index, 1);
      }
    };
    this.fn = function (fn) { return function (path) {
      var current = componentStore.currentComponent;
      if (current) {
        this$1.add(path, current);

        current.__onDestroy = function () {
          this$1.remove(path, current);
        };
      }
      return fn(path);
    }; };
    this.trigger = function (key, newStore, oldState) {
      if (this$1.dependencies[key]) {
        this$1.dependencies[key].forEach(function (fn) { return (
          (fn.update ? fn.update : fn)(newStore, oldState)
        ); });
      }
    };
  }

  function Store(state, fn) {
    var this$1 = this;
    if ( state === void 0 ) state = {};
    if ( fn === void 0 ) fn = function () {};

    var currentState = Object.assign({}, state);
    var StoreHold = function () {
      return proxied(StoreHold.get(), dependencies.fn(fn));
    };

    var dependencies = new Dependencies();
    var remap = function (e) { return e; };

    StoreHold.getInitial = function () { return initialSate; };
    StoreHold.get = function () { return remap(currentState); };
    StoreHold.setPartial = function (path, value) {
      var target = Array.isArray(currentState) ? [] : {};
      if (path.length) {
        target[path[0]] =
          path.length > 1
            ? this$1.setPartial(path.slice(1), value, currentState[path[0]])
            : value;
        return clone(currentState, target);
      }
      return value;
    };
    StoreHold.update = function (chunkState/* , noStrictSubs */) {
      var keys = Object.keys(chunkState);
      var oldState = currentState;
      var newState = Object.assign({}, currentState,
        chunkState);
      currentState = newState;
      dependencies.trigger('*', StoreHold.get(), oldState);
      keys.forEach(function (key) { return dependencies.trigger(key, StoreHold.get(), oldState); });

      return currentState;
    };
    StoreHold.dispatch = function (action) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      var payload = action.apply(void 0, [ currentState ].concat( args ));
      // console.log('dispatch', {
      //   action: action.name,
      //   args: args,
      //   payload,
      // });
      // console.log('dispatch', action.name, payload);
      return StoreHold.update(payload);
    };
    StoreHold.willDispatch = function (action) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      return function () {
        var args2 = [], len = arguments.length;
        while ( len-- ) args2[ len ] = arguments[ len ];

        return StoreHold.dispatch.apply(StoreHold, [ action ].concat( args, args2 ));
    }    };
    StoreHold.subscribe = function (callback/* , strict */) {
      dependencies.add('*', callback);
      callback(StoreHold.get(), null);
      return StoreHold;
    };
    StoreHold.unsubscribe = function (subscriber) {
      dependencies.remove('*', subscriber);
    };
    StoreHold.map = function (fnMap) {
      var tempFn = remap;
      remap = function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        return fnMap(tempFn.apply(void 0, args));
      };
      return StoreHold;
    };

    var initialSate = extractState.call(StoreHold, state);

    return StoreHold;
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
        var staticStore = null;
        var state = false;

        if (typeof transformer !== 'function') {
          throw new Error(("[Radi.js] Subscription `" + eventHolder + "` must be transformed by function"));
        }

        function updater(defaults, newStore) {
          var store = newStore || new Store(defaults || {});

          state = true;
          staticDefaults = defaults;
          staticStore = store;
          events.map(function (event) { return target.addEventListener(event,
            eventSubscription = function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                return store.dispatch(function (oldStore) { return (Object.assign({}, oldStore, transformer.apply(void 0, args.concat( [event] )))); });
            }
          ); });

          return store;
        }

        updater.stop = function () {
          if (state) {
            events.map(function (event) { return target.removeEventListener(event, eventSubscription); });
          }
          return state = !state;
        };
        updater.start = function () { return !state && updater(staticDefaults, staticStore); };

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
    var insert = function () {
      if (el.escape) {
        el.textContent = value;
      } else {
        el.innerHTML = value;
      }
    };
    el.addEventListener('mount', insert);
    el.addEventListener('update', insert);
  });

  customAttribute('loadfocus', function (el) {
    el.addEventListener('mount', function () { return el.focus(); });
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
          field: name,
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

  // export * from './await';
  // export * from './errors';
  // export * from './modal';
  // export * from './portal';

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
    Store: Store,
    customTag: customTag,
    customAttribute: customAttribute,
    patch: patch,
    mount: render,
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

  if (window) { window.Radi = Radi; }

  return Radi;

})));
//# sourceMappingURL=radi.js.map
