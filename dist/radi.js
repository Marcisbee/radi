(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Radi = factory());
}(this, (function () { 'use strict';

  var GLOBALS = {
    VERSION: '0.5.0',
    CURRENT_COMPONENT: null,
    CURRENT_ACTIION: 0,
    CUSTOM_ATTRIBUTES: {},
    SERVICES: {},
    USE_CACHE: false,
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
  var formToJSON = function (
    elements,
    transform
  ) {
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

  var Component = function Component(node) {
    this.type = node.type;
    this.name = node.type.name;
    this.pointer = node.pointer;
    this.update = node.update;
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

  var RadiService = function RadiService () {};

  RadiService.prototype.add = function add (name, fn) {
      var args = [], len = arguments.length - 2;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

    if (typeof name !== 'string') {
      throw new Error('[Radi.js] Service first argument has to be string');
    }

    if (typeof this[name] !== 'undefined' || typeof Component.prototype[name] !== 'undefined') {
      throw new Error(("[Radi.js] Service \"" + name + "\" is already in use"));
    }

    if (typeof fn !== 'function') {
      throw new Error('[Radi.js] Service second argument has to be function');
    }

    var mounted = fn.apply(void 0, args);

    this[name] = mounted;
    Component.prototype[name] = mounted;

    return GLOBALS.SERVICES[name] = mounted;
  };

  var Service = new RadiService();

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

  function ensureFn(maybeFn) {
    if (typeof maybeFn === 'function') { return maybeFn; }
    return function (e) { return maybeFn || e; };
  }

  var sharedPlaceholder;

  function Await(props) {
    var this$1 = this;

    var placeholderTimeout;
    var value = props.value; if ( value === void 0 ) value = null;
    var src = props.src;
    var waitMs = props.waitMs;
    var transform = props.transform; if ( transform === void 0 ) transform = function (e) { return e; };
    var error = props.error; if ( error === void 0 ) error = function (e) { return e; };
    var placeholder = props.placeholder; if ( placeholder === void 0 ) placeholder = sharedPlaceholder;
    var loaded = props.loaded; if ( loaded === void 0 ) loaded = false;

    this.cached = true;

    if (!(src && (src instanceof Promise || src.constructor.name === 'LazyPromise'))) {
      console.warn('[Radi] <Await/> must have `src` as a Promise');
      return null;
    }

    if (!loaded) {
      if (placeholder !== value) {
        if (waitMs) {
          placeholderTimeout = setTimeout(function () {
            this$1.update(Object.assign({}, props, {value: placeholder}));
          }, waitMs);
        } else {
          value = placeholder;
        }
      }

      src
        .then(function (output) {
          if (output && typeof output === 'object' && typeof output.default === 'function') {
            output = html(output.default);
          }

          clearTimeout(placeholderTimeout);

          var tempPlaceholder = sharedPlaceholder;
          sharedPlaceholder = placeholder;

          this$1.update(Object.assign({}, props, {value: ensureFn(transform)(output), loaded: true}));

          sharedPlaceholder = tempPlaceholder;
        })
        .catch(function (err) {
          console.error(err);
          clearTimeout(placeholderTimeout);
          this$1.update(Object.assign({}, props, {value: ensureFn(error)(err), loaded: true}));
        });
    }

    return value;
  }

  /** Example usage:
    const fade = {
      in: (el) => el.animate({
        opacity: [0, 1],
        transform: ['scale(0.5)', 'scale(1)'],
      }, {
        duration: 200,
        iterations: 1
      }),

      out: (el, done) => el.animate({
        opacity: [1, 0],
        transform: ['scale(1)', 'scale(0.5)'],
      }, {
        duration: 200,
        iterations: 1
      }).onfinish = done,
    };


    <div animation={fade}></div>
   */

  var animate = function (target, type, opts, done) {
    var direct = opts[type];
    if (typeof direct !== 'function') {
      console.warn(("[Radi.js] Animation `" + type + "` for node `" + (target.nodeName.toLowerCase) + "` should be function"));
      return null;
    }

    return direct(target, done);
  };

  customAttribute('animation', function (el, value) {
    el.addEventListener('mount', function () {
      animate(el, 'in', value, function () {});
    });
    el.beforedestroy = function (done) { return animate(el, 'out', value, done); };
  });

  customAttribute('html', function (el, value) {
    if (el.escape) {
      el.textContent = value;
    } else {
      el.innerHTML = value;
    }
  });

  customAttribute('loadfocus', function (el) {
    el.addEventListener('mount', function () { return (
      setTimeout(function () { return el.focus(); }, 0)
    ); });
  });

  customAttribute('onsubmit', function (el, fn) { return (
    function (e) {
      if (el.prevent) { e.preventDefault(); }
      fn(e, formToJSON(el.elements || {}));
    }
  ); }, {
    allowedTags: [
      'form' ],
    addToElement: true,
  });

  var renderQueue = [];

  /**
   * @param {Function} data
   * @returns {Function}
   */
  function addToRenderQueue(data) {
    var fn = (data.update && (function () { return data.update(); })) || data;
    if (renderQueue.indexOf(fn) < 0) {
      renderQueue.push(fn);
    }
    return fn;
  }

  function clearRenderQueue() {
    renderQueue = [];
  }

  var Dependencies = function Dependencies() {
    this.dependencies = [];
  };

  /**
   * @param {Function} component
   */
  Dependencies.prototype.add = function add (component) {
    this.dependencies = this.dependencies.filter(function (c) {
      if (GLOBALS.CURRENT_COMPONENT
        && (
          c === GLOBALS.CURRENT_COMPONENT.query
          || c.query === GLOBALS.CURRENT_COMPONENT.query
        )) { return true; }
      if (c.pointer instanceof Node) {
        if (c.mounted) { return true; }
        return c.pointer.isConnected;
      }
      return true;
    });

    if (this.dependencies.indexOf(component) < 0) {
      // console.log('addDependency', component, this.dependencies)
      this.dependencies.push(component);
    }
  };

  /**
   * @param {Function} component
   */
  Dependencies.prototype.remove = function remove (component) {
    var index = this.dependencies.indexOf(component);
    if (index >= 0) {
      // console.log('removeDependency', component)
      this.dependencies.splice(index, 1);
    }
  };

  /**
   * @param {Function} component
   */
  Dependencies.prototype.component = function component (component$1) {
      var this$1 = this;

    if (component$1) {
      this.add(component$1);

      component$1.__onDestroy = function () {
        this$1.remove(component$1);
      };
    }
    return component$1;
  };

  /**
   * @param {*} newState
   * @param {*} oldState
   */
  Dependencies.prototype.trigger = function trigger (newState, oldState) {
    this.dependencies.forEach(function (fn) { return (
      addToRenderQueue(fn)(newState, oldState)
    ); });
  };

  /**
   * @param {*} key
   * @returns {Function}
   */
  var noop = function (e) { return e; };

  var Listener = function Listener(map, store) {
    this.map = map;
    this.getValue = this.getValue.bind(this);
    this.update = this.update.bind(this);
    this.store = store;
  };

  /**
   * @param {Function} updater
   * @returns {*} Cached state
   */
  Listener.prototype.link = function link (updater) {
    if (!this.subbed) {
      this.subbed = this.store.subscribe(updater);
    }
    return this.subbed;
  };

  /**
   * @param {Function} updater
   * @returns {*} Cached state
   */
  Listener.prototype.getValue = function getValue (updater) {
    var state = this.store.getState();

    if (!this.subbed) {
      this.subbed = this.store.subscribe(updater);
    }

    return this.cached = this.map(state);
  };

  /**
   * @returns {*} Cached state
   */
  Listener.prototype.update = function update () {
    var state = this.store.getState();
    return this.cached = this.map(state);
  };

  var storeListMiddleware = noop;
  var storeList = [];

  function addStoreToList(store) {
    var index = storeList.push(store) - 1;
    store.id = index;

    storeListMiddleware(storeList);

    return index;
  }

  var events = {};

  /**
   * @param {*} originalState
   * @param {String} name
   * @returns {Store} Store
   */
  function Store(originalState, name) {
    if ( originalState === void 0 ) originalState = null;
    if ( name === void 0 ) name = 'unnamed';

    var state = originalState;
    var storeEvents = [];
    var dependencies = new Dependencies();

    var _store = {

      /**
       * @param {Action} action
       * @param {Function} reducer
       * @returns {*} Stored state
       */
      on: function on(action, reducer) {
        if ( reducer === void 0 ) reducer = function (s) { return s; };

        events[action.id].push(function () {
          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];

          var newState = reducer.apply(void 0, [ state ].concat( args ));

          return _store.setState(newState);
        });
        return _store;
      },

      /**
       * @returns {*} Stored state
       */
      get state() {
        return _store.getState();
      },

      /**
       * @returns {*} Stored state
       */
      getState: function getState() {
        if (GLOBALS.CURRENT_COMPONENT) {
          dependencies.component(GLOBALS.CURRENT_COMPONENT);
        }

        return state;
      },

      /**
       * @returns {*} Stored state
       */
      getRawState: function getRawState() {
        return state;
      },

      /**
       * @param {*} newState
       * @returns {*} Stored state
       */
      setState: function setState(newState) {
        // Timeout render queue
        setTimeout(function () {
          dependencies.trigger(newState, state);
          clearRenderQueue();
        });

        storeEvents.forEach(function (fn) {
          fn(newState, state);
        });

        return (state = newState);
      },

      /**
       * @param {Function} fn
       * @returns {Function} Unsubscribe
       */
      subscribe: function subscribe(fn) {
        dependencies.add(fn);
        fn(_store.getState(), null);
        storeEvents.push(fn);
        return function () {
          var index = storeEvents.indexOf(fn);
          if (index >= 0) {
            dependencies.remove(fn);
            storeEvents.splice(index, 1);
          }
        };
      },

      /**
       * @param {Function} transformer
       * @param {String} mappedName
       * @returns {*} Mapped state
       */
      map: function map(transformer, mappedName) {
        if ( transformer === void 0 ) transformer = function (e) { return e; };
        if ( mappedName === void 0 ) mappedName = "Mapped " + name;

        var mappedStore = Store(state, mappedName);
        _store.subscribe(
          function (newState, oldState) {
            mappedStore.setState(transformer(newState, oldState));
          }
        );
        return mappedStore;
      },

      /**
       * @returns {*} Transformed state
       */
      get bind() {
        return {
          value: _store.getState(),
          onInput: function (e) { return _store.setState(e.target.value); },
        };
      },

      /**
       * @param {Function} listenerToRender
       * @returns {Listener}
       */
      listener: function listener(listenerToRender) {
        if ( listenerToRender === void 0 ) listenerToRender = function (e) { return e; };

        return new Listener(listenerToRender, _store);
      },
    };

    if (name !== false) {
      addStoreToList(_store);
    }

    return _store;
  }

  function Merge(stores, name) {
    if ( name === void 0 ) name = 'Unnnamed Map';

    var storesList = [].concat(stores);
    var states = storesList.map(function (store) { return store.getRawState(); });
    var mappedStore = Store(states, name);
    storesList.forEach(
      function (store, ii) { return store.subscribe(
        function (state) {
          states[ii] = state;
          mappedStore.setState(states);
        }
      ); }
    );
    return mappedStore;
  }

  /**
   * @param {String} name
   * @returns {Action} Action
   */
  function Action(name) {
    GLOBALS.CURRENT_ACTIION += 1;
    var actionEvents = [];
    var id = GLOBALS.CURRENT_ACTIION;
    events[id] = [];

    var caller = function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // console.log(`Called action ${name}`, args);
      events[id].forEach(function (fn) {
        fn.apply(void 0, args);
      });

      actionEvents.forEach(function (fn) {
        fn.apply(void 0, args);
      });
    };

    Object.defineProperties(caller, {
      name: {
        value: name,
      },
      id: {
        value: id,
      },
      subscribe: {
        value: function value(fn) {
          actionEvents.push(fn);
          return function () {
            var index = actionEvents.indexOf(fn);
            if (index >= 0) {
              actionEvents.splice(index, 1);
            }
          };
        },
      },
    });

    return caller;
  }

  /**
   * @param {String} name
   * @param {Function} effect
   * @returns {Effect} Effect
   */
  function Effect(name, effect) {
    GLOBALS.CURRENT_ACTIION += 1;
    var effectEvents = [];
    var id = GLOBALS.CURRENT_ACTIION;
    var status = 'idle';

    events[id] = [];

    var done = Action((name + " done"));
    var fail = Action((name + " fail"));

    var caller = function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      status = 'loading';
      // console.log(`Called effect ${name}`, args);
      events[id].forEach(function (fn) {
        fn.apply(void 0, args);
      });

      effectEvents.forEach(function (fn) {
        fn({ params: args });
      });

      effect.apply(void 0, args)
        .then(function (result) {
          status = 'done';
          // console.log('DONE', result);
          var output = { result: result, params: args };
          done(output);
          effectEvents.forEach(function (fn) { return fn(output); });
        })
        .catch(function (error) {
          status = 'fail';
          // console.log('FAIL', error);
          var output = { error: error, params: args };
          fail(output);
          effectEvents.forEach(function (fn) { return fn(output); });
        });
    };

    Object.defineProperties(caller, {
      name: {
        value: name,
      },
      id: {
        value: id,
      },
      done: {
        value: done,
      },
      fail: {
        value: fail,
      },
      status: {
        get: function get() {
          return status;
        },
      },
      subscribe: {
        value: function value(fn) {
          effectEvents.push(fn);
          return function () {
            var index = effectEvents.indexOf(fn);
            if (index >= 0) {
              effectEvents.splice(index, 1);
            }
          };
        },
      },
    });

    return caller;
  }

  /**
   * @param {String} name
   * @param {EventDispatcher} target
   * @returns {Event} Event
   */
  function Event(name, target) {
    if ( target === void 0 ) target = window;

    var eventNames = [];
    var action = Action(name);

    function handler() {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      return action.apply(void 0, args);
    }

    Object.defineProperties(action, {
      on: {
        value: function value(nameChunks) {
          nameChunks
            .split(' ')
            .forEach(function (eventName) {
              target.addEventListener(eventName, handler, false);
              eventNames.push(eventName);
            });
          return action;
        },
      },
      off: {
        value: function value(nameChunks) {
          nameChunks
            .split(' ')
            .forEach(function (eventName) {
              var index = eventNames.indexOf(eventName);
              if (index >= 0) {
                target.removeEventListener(eventName, handler, false);
                eventNames.splice(eventName);
              }
            });
          return action;
        },
      },
    });

    return action;
  }

  var setErrors = Action('Set Errors');

  var errorsStore = Store({}, null)
    .on(setErrors, function (state, name, errors) {
      var obj;

      return (Object.assign({}, state,
      ( obj = {}, obj[name] = errors, obj )));
  });

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

      return ({ touched: touched, value: value });
    });
    var plainValues = Object.keys(values)
      .reduce(function (acc, key) {
        var obj;

        return (Object.assign({}, acc,
        ( obj = {}, obj[key] = extractValue(values[key]), obj )));
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
          || (name + " field is invalid");

        if (valid !== true) {
          errors.push({
            field: name,
            touched: Boolean(extractTouched(value, elements[name])),
            error: valid,
          });
        }
      }
    }

    update(errors);
  }

  var formCount = 0;

  var ruleMemo = {};

  customAttribute('onvalidate', function (el, rules) {
    var formName = el.getAttribute('name') || ("defaultForm" + (formCount++));
    var submit;

    if (typeof rules === 'function') {
      ruleMemo[formName] = rules;
    }

    function update(errors) {
      setErrors(formName, errors);
    }

    errorsStore.subscribe(function (state) {
      if (submit) {
        submit.disabled = state[formName].length > 0;
      }
    });

    var runValidation = function (e) {
      var rule = ruleMemo[formName];
      if (typeof rule !== 'function') { return; }
      var validate = rule(e);
      var elements = el.elements;
      if (validate && typeof validate === 'object' && elements) {
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
    };

    el.addEventListener('patch', runValidation);
    el.addEventListener('mount', runValidation, false);
  }, {
    allowedTags: [
      'form' ],
  });

  function Errors(ref) {
    var name = ref.name;
    var onrender = ref.onrender; if ( onrender === void 0 ) onrender = function (e) { return (e); };

    var errors = errorsStore.state;

    if (typeof name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <errors> tag needs to have `name` attribute!');
    }
    if (typeof onrender !== 'function') {
      console.warn('[Radi.js] Warn: Every <errors> tag needs to have `onrender` attribute!');
    }

    if (!errors[name]) {
      return null;
    }

    return onrender(errors[name]);
  }

  function areAnyLoading(src) {
    if (Array.isArray(src)) {
      return src.reduce(
        function (acc, data) { return areAnyLoading(data) || acc; },
        false
      );
    }

    return src && src.loading && src.loading.state
  }

  function Loading(ref) {
    var src = ref.src;
    var children = ref.children;
    var placeholder = ref.placeholder; if ( placeholder === void 0 ) placeholder = children;
    var isLoading = ref.isLoading; if ( isLoading === void 0 ) isLoading = areAnyLoading(src);

    if (!src) { return children; }
    if (isLoading) { return placeholder; }

    return children;
  }

  var h = html;

  var registerModal = Action('Register Modal');
  var switchModal = Action('Switch Modal');

  var ModalStore = Store({}, null)
    .on(registerModal, function (store, name) {
      var obj;

      return (Object.assign({}, store,
      ( obj = {}, obj[name] = false, obj )));
  })
    .on(switchModal, function (store, name, type) {
      var obj;

      return (Object.assign({}, store,
      ( obj = {}, obj[name] = type, obj )));
  });

  function Modal(ref) {
    var name = ref.name; if ( name === void 0 ) name = 'default';
    var children = ref.children;

    var modal = ModalStore.state;

    if (typeof name === 'undefined') {
      console.warn('[Radi.js] Warn: Every <modal> tag needs to have `name` attribute!');
    }

    this.onMount = function () {
      if (!modal[name]) {
        registerModal(name);
      }
    };

    return modal[name] && h('div',
      { class: 'radi-modal', name: name },
      h('div', {
        class: 'radi-modal-backdrop',
        onclick: function () { return ModalService.close(name); },
      }),
      h.apply(void 0, [ 'div',
        { class: 'radi-modal-content' } ].concat( (children.slice()) )
      )
    );
  }

  var ModalService = Service.add('Modal', function () { return (
    {
      open: function (name) { return switchModal(name, true); },
      close: function (name) { return switchModal(name, false); },
      onOpen: function (name, fn) { return (
        ModalStore.subscribe(function (n, p) { return n[name] === true && n[name] !== p[name] && fn(); })
      ); },
      onClose: function (name, fn) { return (
        ModalStore.subscribe(function (n, p) { return n[name] === false && n[name] !== p[name] && fn(); })
      ); },
    }
  ); });

  /**
   * @param  {*} node
   * @param  {HTMLElement} container
   * @returns {{nodes: Structure[], dom: HTMLElement[]}}
   */
  function mount(node, container) {
    var nodes = flatten([evaluate(node)]);
    var dom = render$$1(nodes, container);

    dom.forEach(function (item) {
      container.appendChild(item);
      fireEvent('mount', item);
    });

    return {
      nodes: nodes,
      dom: dom,
    };
  }

  function Portal(data) {
    var children = data.children;
    var parent = data.parent; if ( parent === void 0 ) parent = data.on || document.body;
    if (this.pointer && this.pointer.__radiUpdateChild) {
      this.pointer.__radiUpdateChild(undefined, children);
    }
    this.onMount = function (e) {
      mount(html(function (props) {
        var this$1 = this;

        this.onMount = function (ev) {
          e.target.__radiUpdateChild = this$1.update;
          e.target.__radiPoint.dom[0].__radiRef = ev.target.__radiPoint;
        };
        return props.children.length > 0 ? props.children : children;
      }), parent);
    };

    this.onDestroy = function (e) {
      destroy(e.target.__radiPoint.dom[0].__radiRef.dom);
    };

    return null;
  }

  var TYPE = {
    NODE: 0,
    TEXT: 1,
    COMPONENT: 2,
  };

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
      $node.dispatchEvent(onEvent, $element);
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

  function render$$1(node, parent) {
    if (Array.isArray(node)) {
      return node.map(function (item) { return render$$1(item, parent); });
    }

    if (node.type === TYPE.TEXT) {
      return document.createTextNode(node.query);
    }

    if (node.type === TYPE.NODE) {
      var element;
      if (node.query === 'svg' || parent instanceof SVGElement) {
        element = document.createElementNS(
          'http://www.w3.org/2000/svg',
          node.query
        );
      } else {
        element = document.createElement(node.query);
      }

      mount(node.children, element);

      // set attributes
      setProps(element, node.props);

      return element;
    }

    if (node.type === TYPE.COMPONENT) {
      if (!node.pointer) {
        node.pointer = document.createTextNode('');
        node.pointer.__radiPoint = node;
      }

      node.source = new Component(node);

      var $styleRef;

      node.pointer.addEventListener('mount', function (e) {
        node.update();
        if (typeof node.source.style === 'string') {
          $styleRef = document.createElement('style');
          $styleRef.innerHTML = node.source.style;
          document.head.appendChild($styleRef);
        }
        node.source.trigger('mount', e);
        node.mounted = true;
      }, {
        passive: true,
        once: true,
      }, false);

      node.pointer.addEventListener('destroy', function (e) {
        node.source.trigger('destroy', e);
        if ($styleRef instanceof Node) {
          document.head.removeChild($styleRef);
        }
        node.mounted = false;
      }, {
        passive: true,
        once: true,
      }, false);

      return node.pointer;
    }

    return document.createTextNode(node.toString());
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
    return name.replace(/^on/, '').toLowerCase();
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

    if (name === 'model') {
      name = 'value';
    } else
    if (name === 'class' || name === 'className') {
      if (Array.isArray(value)) {
        value = value.filter(function (v) { return v && typeof v !== 'function'; }).join(' ');
      }
    }

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
      return;
    }

    if (name === 'className') {
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
      autoUpdate(props[name], function (value) {
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

    if (typeof $target.__radiHandlers !== 'undefined') {
      $target.__radiHandlers.forEach(function (event) {
        $target.removeEventListener.apply($target, event);
      });

      $target.__radiHandlers = [];
    }

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
      if (typeof $target.__radiHandlers === 'undefined') {
        $target.__radiHandlers = [];
      }
      var event = [
        extractEventName(name),
        function (e) {
          if (exceptions.indexOf(name) >= 0) {
            if ($target === e.target) { value(e); }
          } else
          if (typeof value === 'function') {
            value(e);
          }
        } ];
      $target.__radiHandlers.push(event);
      $target.addEventListener(
        event[0],
        event[1],
        false
      );
    }
  }

  /**
   * @param {NamedNodeMap} value
   * @returns {{}}
   */
  function attributesToObject(value) {
    return [].reduce.call(value, function (acc, obj) {
      var obj$1;

      return (Object.assign({}, acc,
      ( obj$1 = {}, obj$1[obj.name] = obj.value, obj$1 )));
    }, {});
  }

  function withoutInnerChilds(dom) {
    var childrenOfComponents = Array.prototype.filter.call(
      dom.childNodes,
      function (d) { return typeof d.__radiPoint !== 'undefined'; }
    )
      .reduce(function (acc, d) { return acc.concat( d.__radiPoint.dom); }, []);

    return Array.prototype.filter.call(
      dom.childNodes,
      function (d) { return childrenOfComponents.indexOf(d) < 0; }
    );
  }

  /**
   * @param  {Structure} structure
   * @param  {HTMLElement} dom
   * @param  {HTMLElement} parent
   * @param  {HTMLElement} last
   * @returns {{ newDom: HTMLElement, newStucture: Structure, last: HTMLElement }}
   */
  function patch(structure, dom, parent, last) {
    var newStucture;
    var newDom;
    if (!dom) {
      // add
      newDom = fireEvent('mount', insertAfter(render$$1(newStucture = structure), last, parent));
      last = newDom;
    } else
    if (!structure) {
      // remove
      destroy(dom);
    } else {
      // replace
      if (structure.type === TYPE.NODE) {
        var patchNewDom = structure;
        var patchOldDom = dom;
        var patchOldDomChildren = withoutInnerChilds(dom);

        if (patchOldDom.nodeName === patchNewDom.query.toUpperCase()) {
          var oldAttrs = attributesToObject(patchOldDom.attributes);

          if (patchOldDomChildren || patchNewDom.children) {
            var length = Math.max(patchOldDomChildren.length, patchNewDom.children.length);

            /* We should always run patch childnodes in reverse from last to first
              because if node is removed, it removes whole element in array */
            for (var ii = length - 1; ii >= 0; ii--) {
              patch(
                patchNewDom.children[ii],
                patchOldDomChildren[ii],
                patchOldDom
              );
            }
          }

          updateProps(patchOldDom, patchNewDom.props, oldAttrs);

          newStucture = structure;
          newDom = fireEvent('patch', dom);
          return { newDom: newDom, newStucture: newStucture, last: last };
        }
      }

      if (structure.type === TYPE.TEXT && dom.nodeType === 3 && !dom.__radiPoint) {
        if (dom.textContent !== structure.query) {
          dom.textContent = structure.query;
        }

        newStucture = structure;
        newDom = dom;
        return { newDom: newDom, newStucture: newStucture, last: last };
      }

      if (structure.type === TYPE.COMPONENT) {
        if (dom && dom.__radiPoint
            && structure.query.name === dom.__radiPoint.query.name
            && dom.__radiPoint.source.cached === true) {
          GLOBALS.USE_CACHE = true;

          structure.pointer = dom.__radiPoint.pointer;
          structure.dom = dom.__radiPoint.dom;
        }

        if (dom.__radiPoint && dom.__radiPoint.query === structure.query) {
          dom.__radiPoint.update(structure.props, structure.children);

          newStucture = dom.__radiPoint;
          newDom = dom;
          return { newDom: newDom, newStucture: newStucture, last: last };
        }
      }

      newDom = fireEvent('mount', insertAfter(render$$1(newStucture = structure), dom, parent));
      last = newDom;
      if (last.__radiPoint && last.__radiPoint && last.__radiPoint.dom) {
        last = last.__radiPoint.dom[last.__radiPoint.dom.length - 1];
      }
      destroy(dom);
    }

    return { newDom: newDom, newStucture: newStucture, last: last };
  }

  /**
   * @param {{}} props
   * @param {[]} children
   * @returns {HTMLElement}
   */
  function renderComponent(props, children) {
    var this$1 = this;
    if ( props === void 0 ) props = this.props;
    if ( children === void 0 ) children = this.children;

    var oldProps = Object.assign({}, this.props);
    // const oldChildren = [...this.children];
    if (props) { this.props = props; }
    if (children) { this.children = children; }

    if (this.source && typeof this.source.shouldUpdate === 'function'
      && !this.source.shouldUpdate(props, oldProps)) {
      return this.dom;
    }
    var component = flatten([evaluate(
      this.query.call(this.source, Object.assign({}, this.props,
        {children: this.children}))
    )]);

    if (!this.dom) {
      var rendered = render$$1(this.domStructure = component);

      return this.dom = rendered
        .reverse()
        .map(function (item) { return fireEvent('mount', insertAfter(item, this$1.pointer)); })
        .reverse();
    }

    if (GLOBALS.USE_CACHE) {
      GLOBALS.USE_CACHE = false;

      return this.dom;
    }

    var active = document.activeElement;
    var scrollPosition = window.scrollY;

    if (this.pointer.parentNode === null) { return this.dom; }

    var length = Math.max(this.dom.length, component.length);
    var lastEl = this.pointer;
    var newDom = [];
    var newStucture = [];
    for (var i = 0; i <= length - 1; i++) {
      var output = patch(component[i], this.dom[i], this.pointer.parentNode, lastEl);
      if (output.last) { lastEl = output.last; }
      if (output.newDom) { newDom[i] = output.newDom; }
      if (output.newStucture) { newStucture[i] = output.newStucture; }
    }

    active.focus();
    window.scrollTo(0, scrollPosition);

    this.domStructure = newStucture;
    return this.dom = newDom;
  }

  function isNode(value) {
    return value && typeof value === 'object'
      && typeof value.query !== 'undefined'
      && typeof value.props !== 'undefined'
      && typeof value.children !== 'undefined';
  }

  function updater(comp) {
    return function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      var tempComponent = GLOBALS.CURRENT_COMPONENT;
      GLOBALS.CURRENT_COMPONENT = comp;
      var output = renderComponent.call.apply(renderComponent, [ comp ].concat( args ));

      GLOBALS.CURRENT_COMPONENT = tempComponent;
      return output;
    };
  }

  function evaluate(node) {
    if (Array.isArray(node)) {
      return flatten(node).map(evaluate);
    }

    if (typeof node === 'function') {
      return evaluate(node());
    }

    if (node instanceof Promise || (node && node.constructor.name === 'LazyPromise')) {
      return evaluate({
        query: Await,
        props: {
          src: node,
        },
        children: [],
      });
    }

    if (node instanceof Listener) {
      var comp = {
        query: node.update,
        type: TYPE.COMPONENT,
        props: {},
        children: [],
        pointer: null,
        dom: null,
      };
      comp.update = updater(comp);

      node.link(function () { return (
        comp.dom !== null && comp.update()
      ); });

      return comp;
    }

    if (node && typeof node.type === 'number') { return node; }
    if (isNode(node)) {
      if (typeof node.query === 'function') {
        var comp$1 = Object.assign({}, node,
          {type: TYPE.COMPONENT,
          pointer: null,
          dom: null});
        comp$1.update = updater(comp$1);
        return comp$1;
      }

      return Object.assign({}, node,
        {type: TYPE.NODE,
        children: evaluate(flatten(node.children))});
    }

    if (!node && typeof node !== 'string' && typeof node !== 'number') {
      return {
        // query: node,
        query: '',
        type: TYPE.TEXT,
      };
    }

    return {
      query: node.toString(),
      type: TYPE.TEXT,
    };
  }

  /**
   * @typedef {Object} Node
   * @property {string|function} query
   * @property {{}} props
   * @property {*[]} children
   */

  /**
   * @param  {*} preQuery
   * @param  {{}} preProps
   * @param  {*[]} preChildren
   * @return {Node}
   */
  function html(preQuery, preProps) {
    var preChildren = [], len = arguments.length - 2;
    while ( len-- > 0 ) preChildren[ len ] = arguments[ len + 2 ];

    var query = (typeof preQuery === 'number') ? ("" + preQuery) : preQuery;
    var props = preProps || {};
    var children = flatten(preChildren);

    if (query instanceof Promise || (query && query.constructor.name === 'LazyPromise')) {
      query = Await;
      props = {
        src: preQuery,
      };
    }

    return {
      query: query,
      props: props,
      children: children,
    };
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

    nodes.forEach(function (node) {
      if (!(node instanceof Node)) { return; }

      if (node.__radiPoint && node.__radiPoint.dom && node.__radiPoint.dom.length > 0) {
        node.__radiPoint.dom.forEach(destroy);
      }

      var parent = node.parentNode;
      if (node instanceof Node && parent instanceof Node) {
        beforeDestroy(node, function () {
          // This is for async node removals
          destroyTree$$1(node);
          parent.removeChild(node);
        });
      }
    });
  }

  var Radi = {
    v: GLOBALS.VERSION,
    version: GLOBALS.VERSION,
    h: html,
    html: html,
    customAttribute: customAttribute,
    destroy: destroy,
    patch: patch,
    mount: mount,
    Service: Service,

    Action: Action,
    Effect: Effect,
    Event: Event,
    Merge: Merge,
    Store: Store,

    Await: Await,
    Errors: Errors,
    Modal: Modal,
    Portal: Portal,
    Loading: Loading,
  };

  // Pass Radi instance to plugins
  Radi.plugin = function (fn) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    return fn.apply(void 0, [ Radi ].concat( args ));
  };

  if (typeof window !== 'undefined') { window.Radi = Radi; }

  return Radi;

})));
//# sourceMappingURL=radi.js.map
