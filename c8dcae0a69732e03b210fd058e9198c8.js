// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({73:[function(require,module,exports) {
module.exports="6e70ba7b1d89921e1828e15e26d37127.svg";
},{}],71:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class; /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

var _github = require('../../assets/svg/github.svg');

var _github2 = _interopRequireDefault(_github);

var _globals = require('../helpers/globals');

var _globals2 = _interopRequireDefault(_globals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var Hero = (_class = function (_radi$Component) {
  _inherits(Hero, _radi$Component);

  function Hero() {
    var _ref, _desc2, _value2, _obj;

    _classCallCheck(this, Hero);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = Hero.__proto__ || Object.getPrototypeOf(Hero)).call.apply(_ref, [this].concat(args)));

    _this.state = {
      settings: {
        start: 20,
        size: 50,
        step: 0.2
      },
      dots: [],
      offset: 0,
      height: 800,
      stars: null
    };
    _this.on = (_obj = {
      mount: function mount() {
        var _this2 = this;

        // Fetch github stars
        fetch('https://api.github.com/repos/radi-js/radi').then(function (response) {
          if (response.status !== 200) return;
          response.json().then(function (_ref2) {
            var stargazers_count = _ref2.stargazers_count;

            _this2.applyStars(stargazers_count);
          });
        });

        window.onresize = function (e) {
          return _this2.trigger('resize', e.target);
        };
        window.onscroll = function (e) {
          return _this2.trigger('scroll', window);
        };
        this.trigger('resize', window);
        this.trigger('scroll', window);

        this.circle();
      },
      resize: function resize(el) {
        return {
          height: Math.max(parseInt(el.innerHeight, 10), 800)
        };
      },
      scroll: function scroll(el) {
        return {
          offset: parseInt(el.scrollY, 10)
        };
      }
    }, (_applyDecoratedDescriptor(_obj, 'resize', [action], Object.getOwnPropertyDescriptor(_obj, 'resize'), _obj), _applyDecoratedDescriptor(_obj, 'scroll', [action], Object.getOwnPropertyDescriptor(_obj, 'scroll'), _obj)), _obj);
    return _this;
  }

  _createClass(Hero, [{
    key: 'templateDot',
    value: function templateDot(distance, angle, step, age) {
      return {
        x: age * Math.cos(angle * Math.PI / 180),
        y: age * Math.sin(-angle * Math.PI / 180),
        z: distance * age,
        angle: angle,
        step: step,
        age: age
      };
    }
  }, {
    key: 'createDots',
    value: function createDots() {
      var dots = this.state.dots.slice();
      if (dots.length < Math.min(this.state.height / 8, this.state.settings.size) && Math.random() < 0.2) {
        var dot = this.templateDot(0, Math.random() * 360, 0, this.state.settings.start);

        dots.push(dot);
      }

      for (var i = 0; i < dots.length; i++) {
        var age = dots[i] && dots[i].age;
        if (age !== false && age <= 70) {
          dots[i] = this.templateDot(age / 10, dots[i].angle, 0, age + this.state.settings.step);
        } else {
          0;
          dots[i].angle = Math.random() * 360;
          dots[i].age = this.state.settings.start;
        }
      }

      return {
        dots: dots
      };
    }
  }, {
    key: 'circle',
    value: function circle() {
      var _this3 = this;

      requestAnimationFrame(function () {
        if (_this3.state.height > _this3.state.offset) {
          _this3.createDots(_this3.state);
        }
        _this3.circle();
      });
      // setTimeout(() => {
      //   if (this.state.height > this.state.offset) {
      //     this.createDots();
      //   }
      //   this.circle();
      // }, 50);
    }
  }, {
    key: 'applyStars',
    value: function applyStars(stars) {
      return {
        stars: stars
      };
    }
  }, {
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(
        'template',
        null,
        _radi3.default.r(
          'div',
          { id: 'hero', style: {
              height: _radi_listen(component, 'height').process(function (_$9) {
                return _$9 + 'px';
              })
            } },
          _radi3.default.r(
            'div',
            { id: 'hero-overlay' },
            _radi3.default.r(
              'div',
              { 'class': 'wrapper' },
              _radi3.default.r(
                'h1',
                null,
                'Micro-rendering view framework'
              ),
              _radi3.default.r(
                'p',
                null,
                'Radi is a really tiny javascript framework.'
              ),
              _radi3.default.r(
                'p',
                null,
                'It\u2019s built quite differently from any other framework. Radi only re-renders parts that should be rendered which makes it really fast.'
              ),
              _radi3.default.r(
                'div',
                { 'class': 'btn-wrap' },
                _radi3.default.r(
                  'a',
                  { href: _globals2.default.github, target: '_blank', 'class': 'btn btn-white' },
                  _radi3.default.r('img', { src: _github2.default, alt: '' }),
                  'Star on GitHub',
                  _radi_listen(component, 'stars').process(function (_$10) {
                    return _$10 !== null && _radi3.default.r(
                      'i',
                      { 'class': 'right-side' },
                      _radi_listen(component, 'stars')
                    );
                  })
                ),
                _radi3.default.r(
                  Link,
                  { to: _globals2.default.docs, 'class': 'btn btn-green' },
                  'Get started'
                )
              )
            )
          ),
          _radi3.default.r(
            'div',
            { id: 'hero-bg', style: 'perspective: 200px;' },
            _radi_listen(component, 'dots').process(function (_$12) {
              return _$12.map(function (dot) {
                return _radi3.default.r('i', { style: {
                    transform: 'translate3d(' + dot.x + 'px, ' + dot.y + 'px, ' + dot.z / 2 + 'px) scale(' + dot.z / 1000 + ')',
                    backgroundColor: 'hsl(276, 72%, ' + (100 / dot.z * 10 + 70) + '%)'
                  } });
              });
            })
          )
        )
      )];
    }
  }]);

  return Hero;
}(_radi3.default.Component), (_applyDecoratedDescriptor(_class.prototype, 'createDots', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'createDots'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'applyStars', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'applyStars'), _class.prototype)), _class);
exports.default = Hero;
;
},{"radi":13,"../../assets/svg/github.svg":73,"../helpers/globals":21}],75:[function(require,module,exports) {
var global = (1,eval)("this");

/* **********************************************
     Begin prism-core.js
********************************************** */

var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function(){

// Private helper vars
var lang = /\blang(?:uage)?-([\w-]+)\b/i;
var uniqueId = 0;

var _ = _self.Prism = {
	manual: _self.Prism && _self.Prism.manual,
	disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
	util: {
		encode: function (tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
			} else if (_.util.type(tokens) === 'Array') {
				return tokens.map(_.util.encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},

		type: function (o) {
			return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
		},

		objId: function (obj) {
			if (!obj['__id']) {
				Object.defineProperty(obj, '__id', { value: ++uniqueId });
			}
			return obj['__id'];
		},

		// Deep clone a language definition (e.g. to extend it)
		clone: function (o, visited) {
			var type = _.util.type(o);
			visited = visited || {};

			switch (type) {
				case 'Object':
					if (visited[_.util.objId(o)]) {
						return visited[_.util.objId(o)];
					}
					var clone = {};
					visited[_.util.objId(o)] = clone;

					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = _.util.clone(o[key], visited);
						}
					}

					return clone;

				case 'Array':
					if (visited[_.util.objId(o)]) {
						return visited[_.util.objId(o)];
					}
					var clone = [];
					visited[_.util.objId(o)] = clone;

					o.forEach(function (v, i) {
						clone[i] = _.util.clone(v, visited);
					});

					return clone;
			}

			return o;
		}
	},

	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);

			for (var key in redef) {
				lang[key] = redef[key];
			}

			return lang;
		},

		/**
		 * Insert a token before another token in a language literal
		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
		 * we cannot just provide an object, we need anobject and a key.
		 * @param inside The key (or language id) of the parent
		 * @param before The key to insert before. If not provided, the function appends instead.
		 * @param insert Object with the key/value pairs to insert
		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
		 */
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];

			if (arguments.length == 2) {
				insert = arguments[1];

				for (var newToken in insert) {
					if (insert.hasOwnProperty(newToken)) {
						grammar[newToken] = insert[newToken];
					}
				}

				return grammar;
			}

			var ret = {};

			for (var token in grammar) {

				if (grammar.hasOwnProperty(token)) {

					if (token == before) {

						for (var newToken in insert) {

							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}

					ret[token] = grammar[token];
				}
			}

			// Update references in other language definitions
			_.languages.DFS(_.languages, function(key, value) {
				if (value === root[inside] && key != inside) {
					this[key] = ret;
				}
			});

			return root[inside] = ret;
		},

		// Traverse a language definition with Depth First Search
		DFS: function(o, callback, type, visited) {
			visited = visited || {};
			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);

					if (_.util.type(o[i]) === 'Object' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, null, visited);
					}
					else if (_.util.type(o[i]) === 'Array' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, i, visited);
					}
				}
			}
		}
	},
	plugins: {},

	highlightAll: function(async, callback) {
		_.highlightAllUnder(document, async, callback);
	},

	highlightAllUnder: function(container, async, callback) {
		var env = {
			callback: callback,
			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
		};

		_.hooks.run("before-highlightall", env);

		var elements = env.elements || container.querySelectorAll(env.selector);

		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, env.callback);
		}
	},

	highlightElement: function(element, async, callback) {
		// Find language
		var language, grammar, parent = element;

		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}

		if (parent) {
			language = (parent.className.match(lang) || [,''])[1].toLowerCase();
			grammar = _.languages[language];
		}

		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

		if (element.parentNode) {
			// Set language on the parent, for styling
			parent = element.parentNode;

			if (/pre/i.test(parent.nodeName)) {
				parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
			}
		}

		var code = element.textContent;

		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};

		_.hooks.run('before-sanity-check', env);

		if (!env.code || !env.grammar) {
			if (env.code) {
				_.hooks.run('before-highlight', env);
				env.element.textContent = env.code;
				_.hooks.run('after-highlight', env);
			}
			_.hooks.run('complete', env);
			return;
		}

		_.hooks.run('before-highlight', env);

		if (async && _self.Worker) {
			var worker = new Worker(_.filename);

			worker.onmessage = function(evt) {
				env.highlightedCode = evt.data;

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				callback && callback.call(env.element);
				_.hooks.run('after-highlight', env);
				_.hooks.run('complete', env);
			};

			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code,
				immediateClose: true
			}));
		}
		else {
			env.highlightedCode = _.highlight(env.code, env.grammar, env.language);

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;

			callback && callback.call(element);

			_.hooks.run('after-highlight', env);
			_.hooks.run('complete', env);
		}
	},

	highlight: function (text, grammar, language) {
		var env = {
			code: text,
			grammar: grammar,
			language: language
		};
		_.hooks.run('before-tokenize', env);
		env.tokens = _.tokenize(env.code, env.grammar);
		_.hooks.run('after-tokenize', env);
		return Token.stringify(_.util.encode(env.tokens), env.language);
	},

	matchGrammar: function (text, strarr, grammar, index, startPos, oneshot, target) {
		var Token = _.Token;

		for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			if (token == target) {
				return;
			}

			var patterns = grammar[token];
			patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				var pattern = patterns[j],
					inside = pattern.inside,
					lookbehind = !!pattern.lookbehind,
					greedy = !!pattern.greedy,
					lookbehindLength = 0,
					alias = pattern.alias;

				if (greedy && !pattern.pattern.global) {
					// Without the global flag, lastIndex won't work
					var flags = pattern.pattern.toString().match(/[imuy]*$/)[0];
					pattern.pattern = RegExp(pattern.pattern.source, flags + "g");
				}

				pattern = pattern.pattern || pattern;

				// Don’t cache length as it changes during the loop
				for (var i = index, pos = startPos; i < strarr.length; pos += strarr[i].length, ++i) {

					var str = strarr[i];

					if (strarr.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						return;
					}

					if (str instanceof Token) {
						continue;
					}

					if (greedy && i != strarr.length - 1) {
						pattern.lastIndex = pos;
						var match = pattern.exec(text);
						if (!match) {
							break;
						}

						var from = match.index + (lookbehind ? match[1].length : 0),
						    to = match.index + match[0].length,
						    k = i,
						    p = pos;

						for (var len = strarr.length; k < len && (p < to || (!strarr[k].type && !strarr[k - 1].greedy)); ++k) {
							p += strarr[k].length;
							// Move the index i to the element in strarr that is closest to from
							if (from >= p) {
								++i;
								pos = p;
							}
						}

						// If strarr[i] is a Token, then the match starts inside another Token, which is invalid
						if (strarr[i] instanceof Token) {
							continue;
						}

						// Number of tokens to delete and replace with the new match
						delNum = k - i;
						str = text.slice(pos, p);
						match.index -= pos;
					} else {
						pattern.lastIndex = 0;

						var match = pattern.exec(str),
							delNum = 1;
					}

					if (!match) {
						if (oneshot) {
							break;
						}

						continue;
					}

					if(lookbehind) {
						lookbehindLength = match[1] ? match[1].length : 0;
					}

					var from = match.index + lookbehindLength,
					    match = match[0].slice(lookbehindLength),
					    to = from + match.length,
					    before = str.slice(0, from),
					    after = str.slice(to);

					var args = [i, delNum];

					if (before) {
						++i;
						pos += before.length;
						args.push(before);
					}

					var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias, match, greedy);

					args.push(wrapped);

					if (after) {
						args.push(after);
					}

					Array.prototype.splice.apply(strarr, args);

					if (delNum != 1)
						_.matchGrammar(text, strarr, grammar, i, pos, true, token);

					if (oneshot)
						break;
				}
			}
		}
	},

	tokenize: function(text, grammar, language) {
		var strarr = [text];

		var rest = grammar.rest;

		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}

			delete grammar.rest;
		}

		_.matchGrammar(text, strarr, grammar, 0, 0, false);

		return strarr;
	},

	hooks: {
		all: {},

		add: function (name, callback) {
			var hooks = _.hooks.all;

			hooks[name] = hooks[name] || [];

			hooks[name].push(callback);
		},

		run: function (name, env) {
			var callbacks = _.hooks.all[name];

			if (!callbacks || !callbacks.length) {
				return;
			}

			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	}
};

var Token = _.Token = function(type, content, alias, matchedStr, greedy) {
	this.type = type;
	this.content = content;
	this.alias = alias;
	// Copy of the full string this token was created from
	this.length = (matchedStr || "").length|0;
	this.greedy = !!greedy;
};

Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}

	if (_.util.type(o) === 'Array') {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}

	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};

	if (o.alias) {
		var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
		Array.prototype.push.apply(env.classes, aliases);
	}

	_.hooks.run('wrap', env);

	var attributes = Object.keys(env.attributes).map(function(name) {
		return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
	}).join(' ');

	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';

};

if (!_self.document) {
	if (!_self.addEventListener) {
		// in Node.js
		return _self.Prism;
	}

	if (!_.disableWorkerMessageHandler) {
		// In worker
		_self.addEventListener('message', function (evt) {
			var message = JSON.parse(evt.data),
				lang = message.language,
				code = message.code,
				immediateClose = message.immediateClose;

			_self.postMessage(_.highlight(code, _.languages[lang], lang));
			if (immediateClose) {
				_self.close();
			}
		}, false);
	}

	return _self.Prism;
}

//Get current script and highlight
var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();

if (script) {
	_.filename = script.src;

	if (!_.manual && !script.hasAttribute('data-manual')) {
		if(document.readyState !== "loading") {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(_.highlightAll);
			} else {
				window.setTimeout(_.highlightAll, 16);
			}
		}
		else {
			document.addEventListener('DOMContentLoaded', _.highlightAll);
		}
	}
}

return _self.Prism;

})();

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
	global.Prism = Prism;
}


/* **********************************************
     Begin prism-markup.js
********************************************** */

Prism.languages.markup = {
	'comment': /<!--[\s\S]*?-->/,
	'prolog': /<\?[\s\S]+?\?>/,
	'doctype': /<!DOCTYPE[\s\S]+?>/i,
	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i,
		greedy: true,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/i,
				inside: {
					'punctuation': [
						/^=/,
						{
							pattern: /(^|[^\\])["']/,
							lookbehind: true
						}
					]
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
	Prism.languages.markup['entity'];

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Prism.languages.xml = Prism.languages.markup;
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;


/* **********************************************
     Begin prism-css.js
********************************************** */

Prism.languages.css = {
	'comment': /\/\*[\s\S]*?\*\//,
	'atrule': {
		pattern: /@[\w-]+?.*?(?:;|(?=\s*\{))/i,
		inside: {
			'rule': /@[\w-]+/
			// See rest below
		}
	},
	'url': /url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
	'selector': /[^{}\s][^{};]*?(?=\s*\{)/,
	'string': {
		pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
	'important': /\B!important\b/i,
	'function': /[-a-z0-9]+(?=\()/i,
	'punctuation': /[(){};:]/
};

Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,
			lookbehind: true,
			inside: Prism.languages.css,
			alias: 'language-css',
			greedy: true
		}
	});

	Prism.languages.insertBefore('inside', 'attr-value', {
		'style-attr': {
			pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
			inside: {
				'attr-name': {
					pattern: /^\s*style/i,
					inside: Prism.languages.markup.tag.inside
				},
				'punctuation': /^\s*=\s*['"]|['"]\s*$/,
				'attr-value': {
					pattern: /.+/i,
					inside: Prism.languages.css
				}
			},
			alias: 'language-css'
		}
	}, Prism.languages.markup.tag);
}

/* **********************************************
     Begin prism-clike.js
********************************************** */

Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /[.\\]/
		}
	},
	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(?:true|false)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};


/* **********************************************
     Begin prism-javascript.js
********************************************** */

Prism.languages.javascript = Prism.languages.extend('clike', {
	'keyword': /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
	'number': /\b(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\()/i,
	'operator': /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
});

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[[^\]\r\n]+]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,
		lookbehind: true,
		greedy: true
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	'function-variable': {
		pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=\s*(?:function\b|(?:\([^()]*\)|[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/i,
		alias: 'function'
	},
	'constant': /\b[A-Z][A-Z\d_]*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
	'template-string': {
		pattern: /`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\${[^}]+}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\${|}$/,
						alias: 'punctuation'
					},
					rest: null // See below
				}
			},
			'string': /[\s\S]+/
		}
	}
});
Prism.languages.javascript['template-string'].inside['interpolation'].inside.rest = Prism.languages.javascript;

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
			lookbehind: true,
			inside: Prism.languages.javascript,
			alias: 'language-javascript',
			greedy: true
		}
	});
}

Prism.languages.js = Prism.languages.javascript;


/* **********************************************
     Begin prism-file-highlight.js
********************************************** */

(function () {
	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
		return;
	}

	self.Prism.fileHighlight = function() {

		var Extensions = {
			'js': 'javascript',
			'py': 'python',
			'rb': 'ruby',
			'ps1': 'powershell',
			'psm1': 'powershell',
			'sh': 'bash',
			'bat': 'batch',
			'h': 'c',
			'tex': 'latex'
		};

		Array.prototype.slice.call(document.querySelectorAll('pre[data-src]')).forEach(function (pre) {
			var src = pre.getAttribute('data-src');

			var language, parent = pre;
			var lang = /\blang(?:uage)?-([\w-]+)\b/i;
			while (parent && !lang.test(parent.className)) {
				parent = parent.parentNode;
			}

			if (parent) {
				language = (pre.className.match(lang) || [, ''])[1];
			}

			if (!language) {
				var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
				language = Extensions[extension] || extension;
			}

			var code = document.createElement('code');
			code.className = 'language-' + language;

			pre.textContent = '';

			code.textContent = 'Loading…';

			pre.appendChild(code);

			var xhr = new XMLHttpRequest();

			xhr.open('GET', src, true);

			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {

					if (xhr.status < 400 && xhr.responseText) {
						code.textContent = xhr.responseText;

						Prism.highlightElement(code);
					}
					else if (xhr.status >= 400) {
						code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
					}
					else {
						code.textContent = '✖ Error: File does not exist or is empty';
					}
				}
			};

			xhr.send(null);
		});

		if (Prism.plugins.toolbar) {
			Prism.plugins.toolbar.registerButton('download-file', function (env) {
				var pre = env.element.parentNode;
				if (!pre || !/pre/i.test(pre.nodeName) || !pre.hasAttribute('data-src') || !pre.hasAttribute('data-download-link')) {
					return;
				}
				var src = pre.getAttribute('data-src');
				var a = document.createElement('a');
				a.textContent = pre.getAttribute('data-download-link-label') || 'Download';
				a.setAttribute('download', '');
				a.href = src;
				return a;
			});
		}

	};

	document.addEventListener('DOMContentLoaded', self.Prism.fileHighlight);

})();
},{}],77:[function(require,module,exports) {
!function(t){var n=t.util.clone(t.languages.javascript);t.languages.jsx=t.languages.extend("markup",n),t.languages.jsx.tag.pattern=/<\/?(?:[\w.:-]+\s*(?:\s+(?:[\w.:-]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s{'">=]+|\{(?:\{(?:\{[^}]*\}|[^{}])*\}|[^{}])+\}))?|\{\.{3}[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\}))*\s*\/?)?>/i,t.languages.jsx.tag.inside.tag.pattern=/^<\/?[^\s>\/]*/i,t.languages.jsx.tag.inside["attr-value"].pattern=/=(?!\{)(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">]+)/i,t.languages.insertBefore("inside","attr-name",{spread:{pattern:/\{\.{3}[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\}/,inside:{punctuation:/\.{3}|[{}.]/,"attr-value":/\w+/}}},t.languages.jsx.tag),t.languages.insertBefore("inside","attr-value",{script:{pattern:/=(\{(?:\{(?:\{[^}]*\}|[^}])*\}|[^}])+\})/i,inside:{"script-punctuation":{pattern:/^=(?={)/,alias:"punctuation"},rest:t.languages.jsx},alias:"language-javascript"}},t.languages.jsx.tag);var e=function(t){return t?"string"==typeof t?t:"string"==typeof t.content?t.content:t.content.map(e).join(""):""},a=function(n){for(var s=[],g=0;g<n.length;g++){var o=n[g],i=!1;if("string"!=typeof o&&("tag"===o.type&&o.content[0]&&"tag"===o.content[0].type?"</"===o.content[0].content[0].content?s.length>0&&s[s.length-1].tagName===e(o.content[0].content[1])&&s.pop():"/>"===o.content[o.content.length-1].content||s.push({tagName:e(o.content[0].content[1]),openedBraces:0}):s.length>0&&"punctuation"===o.type&&"{"===o.content?s[s.length-1].openedBraces++:s.length>0&&s[s.length-1].openedBraces>0&&"punctuation"===o.type&&"}"===o.content?s[s.length-1].openedBraces--:i=!0),(i||"string"==typeof o)&&s.length>0&&0===s[s.length-1].openedBraces){var p=e(o);g<n.length-1&&("string"==typeof n[g+1]||"plain-text"===n[g+1].type)&&(p+=e(n[g+1]),n.splice(g+1,1)),g>0&&("string"==typeof n[g-1]||"plain-text"===n[g-1].type)&&(p=e(n[g-1])+p,n.splice(g-1,1),g--),n[g]=new t.Token("plain-text",p,null,p)}o.content&&"string"!=typeof o.content&&a(o.content)}};t.hooks.add("after-tokenize",function(t){("jsx"===t.language||"tsx"===t.language)&&a(t.tokens)})}(Prism);
},{}],74:[function(require,module,exports) {

},{}],72:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class; /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

var _prismjs = require('prismjs');

var _prismjs2 = _interopRequireDefault(_prismjs);

var _babelPluginTransformRadiListen = require('babel-plugin-transform-radi-listen');

var _babelPluginTransformRadiListen2 = _interopRequireDefault(_babelPluginTransformRadiListen);

var _radiCompilerBrowser = require('../helpers/radi-compiler-browser.js');

var _radiCompilerBrowser2 = _interopRequireDefault(_radiCompilerBrowser);

require('prismjs/components/prism-jsx.min');

require('../../assets/stylus/mini-repl.styl');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var MiniRepl = (_class = function (_radi$Component) {
  _inherits(MiniRepl, _radi$Component);

  function MiniRepl() {
    var _ref;

    _classCallCheck(this, MiniRepl);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = MiniRepl.__proto__ || Object.getPrototypeOf(MiniRepl)).call.apply(_ref, [this].concat(args)));

    _this.state = {
      scroll: 0,
      error: null,
      code: ''
    };
    _this.on = {
      mount: function mount() {
        var _this2 = this;

        loadJS('https://unpkg.com/@babel/standalone@7.0.0-beta.46/babel.min.js', function () {
          _this2.codeChange(_this2.state.code, 'Counter');
        });
      },
      destroy: function destroy() {
        if (window.lastmount) {
          for (var i = 0; i < window.lastmount.length; i++) {
            window.lastmount[i].destroy();
          }
        }
      }
    };
    return _this;
  }

  _createClass(MiniRepl, [{
    key: 'insertMetachars',
    value: function insertMetachars(el, sStartTag, sEndTag, cb) {
      var bDouble = arguments.length > 1,
          nSelStart = el.selectionStart,
          nSelEnd = el.selectionEnd,
          sOldText = el.value;
      el.value = sOldText.substring(0, nSelStart) + (bDouble ? sStartTag + sOldText.substring(nSelStart, nSelEnd) + sEndTag : sStartTag) + sOldText.substring(nSelEnd);
      el.setSelectionRange(bDouble || nSelStart === nSelEnd ? nSelStart + sStartTag.length : nSelStart, (bDouble ? nSelEnd : nSelStart) + sStartTag.length);
      el.focus();
      cb();
    }
  }, {
    key: 'replInput',
    value: function replInput(e) {
      var code = e.keyCode || e.which;
      if (code == '9') {
        e.preventDefault();
        this.insertMetachars(e.target, '   ', '', function () {
          e.target.dispatchEvent(new window.Event('input', {
            'bubbles': true,
            'cancelable': true
          }));
        });
      }
    }
  }, {
    key: 'scrollCode',
    value: function scrollCode(e) {
      return {
        scroll: e.target.scrollTop
      };
    }
  }, {
    key: 'setError',
    value: function setError(value, e) {
      if (value) {
        value[1] = value[1].replace(/^unknown\: /, '');
        console.error(e.message);
      }
      return {
        error: value || null
      };
    }
  }, {
    key: 'build',
    value: function build(code) {
      var self = this;
      var transformed = Babel.transform(code, {
        presets: [],
        plugins: [['proposal-pipeline-operator'], ['proposal-decorators', {
          legacy: true
        }], 'transform-classes', [_babelPluginTransformRadiListen2.default], 'transform-react-jsx']
      });

      try {
        (function (code) {
          if (window.lastmount) {
            for (var i = 0; i < window.lastmount.length; i++) {
              window.lastmount[i].destroy();
            }
          }
          var del = document.getElementById('repl-out-' + self.$id);
          del.parentNode.replaceChild(del.cloneNode(false), del);
          eval(code + 'window.lastmount = Radi.mount([new Counter()], "repl-out-' + self.$id + '");');
          self.setError();
        })(transformed.code);
      } catch (e) {
        this.setError([e.name, e.message], e);
      }
    }
  }, {
    key: 'codeChange',
    value: function codeChange(value, name) {
      try {
        var parsed = (0, _radiCompilerBrowser2.default)(name, value);
        this.build(parsed);
      } catch (e) {
        this.setError([e.name, e.message], e);
      }
    }
  }, {
    key: 'view',
    value: function view() {
      var _radi$r;

      var component = this;
      return [_radi3.default.r(
        'template',
        null,
        _radi3.default.r(
          'div',
          { 'class': _radi_listen(component, 'error').process(function (_$13) {
              return ['repl-wrap', _$13 && 'repl-error'];
            }) },
          _radi3.default.r(
            'div',
            { 'class': 'repl-head' },
            _radi3.default.r('i', null),
            _radi3.default.r('i', null),
            _radi3.default.r('i', null),
            _radi3.default.r(
              'strong',
              null,
              'Counter.radi'
            ),
            _radi3.default.r(
              'div',
              null,
              _radi3.default.r(
                'span',
                null,
                _radi_listen(component, 'error').process(function (_$14) {
                  return _$14 ? 'Error' : 'Live preview';
                })
              )
            )
          ),
          _radi3.default.r(
            'div',
            { 'class': 'repl-container' },
            _radi3.default.r(
              'div',
              { 'class': 'backdrop' },
              _radi3.default.r(
                'pre',
                { style: {
                    marginTop: _radi_listen(component, 'scroll').process(function (_$15) {
                      return -_$15 + 'px';
                    })
                  } },
                _radi3.default.r('code', { 'class': 'tlit-highlight',
                  html: _radi_listen(component, 'code').process(function (_$16) {
                    return _prismjs2.default.highlight(_$16, _prismjs2.default.languages.jsx);
                  }) })
              )
            ),
            _radi3.default.r('textarea', (_radi$r = { 'class': 'tlit-text',
              onkeydown: function onkeydown(e) {
                return component.replInput(e);
              },
              onscroll: function onscroll(e) {
                return component.scrollCode(e);
              }
            }, _defineProperty(_radi$r, 'class', 'tlit-text'), _defineProperty(_radi$r, 'autocomplete', 'off'), _defineProperty(_radi$r, 'autocorrect', 'off'), _defineProperty(_radi$r, 'autocapitalize', 'off'), _defineProperty(_radi$r, 'spellcheck', 'false'), _defineProperty(_radi$r, 'model', _radi_listen(component, 'code')), _defineProperty(_radi$r, 'oninput', function oninput(e) {
              return component.codeChange(e.target.value, 'Counter');
            }), _radi$r))
          ),
          _radi_listen(component, 'error').process(function (_$18) {
            return _$18 && _radi3.default.r(
              'pre',
              { 'class': 'repl-out-error' },
              _radi3.default.r(
                'strong',
                null,
                _radi_listen(component, 'error', 0)
              ),
              _radi3.default.r(
                'p',
                null,
                _radi_listen(component, 'error', 1)
              )
            );
          }),
          _radi3.default.r(
            'div',
            { id: 'repl-out-' + component.$id, 'class': 'repl-output' },
            _radi3.default.r(
              'i',
              { style: 'color: #ccc' },
              'Loading Babel...'
            )
          )
        )
      )];
    }
  }]);

  return MiniRepl;
}(_radi3.default.Component), (_applyDecoratedDescriptor(_class.prototype, 'scrollCode', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'scrollCode'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setError', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'setError'), _class.prototype)), _class);
exports.default = MiniRepl;
;
},{"radi":13,"prismjs":75,"babel-plugin-transform-radi-listen":70,"../helpers/radi-compiler-browser.js":69,"prismjs/components/prism-jsx.min":77,"../../assets/stylus/mini-repl.styl":74}],58:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

var _Hero = require('../components/Hero.radi');

var _Hero2 = _interopRequireDefault(_Hero);

var _MiniRepl = require('../components/MiniRepl.radi');

var _MiniRepl2 = _interopRequireDefault(_MiniRepl);

var _Header = require('../components/Header.radi');

var _Header2 = _interopRequireDefault(_Header);

var _globals = require('../helpers/globals');

var _globals2 = _interopRequireDefault(_globals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var Default = function (_radi$Component) {
  _inherits(Default, _radi$Component);

  function Default() {
    var _ref;

    _classCallCheck(this, Default);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = Default.__proto__ || Object.getPrototypeOf(Default)).call.apply(_ref, [this].concat(args)));

    _this.state = {};
    _this.on = {};
    return _this;
  }

  _createClass(Default, [{
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(
        'section',
        { 'class': 'default-layout' },
        _radi3.default.r(_Header2.default, null),
        _radi3.default.r(_Hero2.default, null),
        _radi3.default.r(
          'div',
          { 'class': 'under-hero-repl' },
          _radi3.default.r(_MiniRepl2.default, { code: _globals2.default.startingCode })
        ),
        component.children,
        _radi3.default.r(
          'footer',
          null,
          _radi3.default.r(
            'p',
            null,
            'Website built with ',
            _radi3.default.r(
              'a',
              { href: _globals2.default.github, target: '_blank' },
              'Radi.js'
            )
          ),
          _radi3.default.r(
            'p',
            null,
            'Design & Illustrations by ',
            _radi3.default.r(
              'a',
              { href: 'https://dribbble.com/marcisbee', target: '_blank' },
              'Marcisbee'
            )
          )
        )
      )];
    }
  }]);

  return Default;
}(_radi3.default.Component);

exports.default = Default;
;
},{"radi":13,"../components/Hero.radi":71,"../components/MiniRepl.radi":72,"../components/Header.radi":36,"../helpers/globals":21}],59:[function(require,module,exports) {
module.exports="ec1044bce9e69aa95df108c9581b0106.png";
},{}],60:[function(require,module,exports) {
module.exports="94d93683a2ebc1a16ed11e7e5c5b09c6.png";
},{}],61:[function(require,module,exports) {
module.exports="68eaf9dda3323f75544cfa111b82b69c.png";
},{}],62:[function(require,module,exports) {
module.exports="90e891bd752da22c18abff180dd8bef9.png";
},{}],63:[function(require,module,exports) {
module.exports="7dac33bb14b9cd6b71ac140d422436f5.png";
},{}],64:[function(require,module,exports) {
module.exports="e63612f23f466482c9d44de0328f92d1.png";
},{}],65:[function(require,module,exports) {
module.exports="4a4cbae5cc9695d074dc7d3e89ed3361.png";
},{}],66:[function(require,module,exports) {
module.exports="866d1a29ff9d6e555a3ce13f0701e90f.png";
},{}],67:[function(require,module,exports) {
module.exports="6fde0edafe606b5119b8fd221444d322.png";
},{}],68:[function(require,module,exports) {
module.exports="0a1ab65f258cdc331a91f1aa5c19ab56.png";
},{}],19:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

var _Default = require('../layouts/Default.radi');

var _Default2 = _interopRequireDefault(_Default);

var _globals = require('../helpers/globals');

var _globals2 = _interopRequireDefault(_globals);

var _satelite = require('../../assets/img/satelite.png');

var _satelite2 = _interopRequireDefault(_satelite);

var _satelite2x = require('../../assets/img/satelite@2x.png');

var _satelite2x2 = _interopRequireDefault(_satelite2x);

var _shield = require('../../assets/img/shield.png');

var _shield2 = _interopRequireDefault(_shield);

var _shield2x = require('../../assets/img/shield@2x.png');

var _shield2x2 = _interopRequireDefault(_shield2x);

var _bg = require('../../assets/img/bg.png');

var _bg2 = _interopRequireDefault(_bg);

var _bg2x = require('../../assets/img/bg@2x.png');

var _bg2x2 = _interopRequireDefault(_bg2x);

var _head = require('../../assets/img/head.png');

var _head2 = _interopRequireDefault(_head);

var _head2x = require('../../assets/img/head@2x.png');

var _head2x2 = _interopRequireDefault(_head2x);

var _body = require('../../assets/img/body.png');

var _body2 = _interopRequireDefault(_body);

var _body2x = require('../../assets/img/body@2x.png');

var _body2x2 = _interopRequireDefault(_body2x);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var Index = function (_radi$Component) {
  _inherits(Index, _radi$Component);

  function Index() {
    var _ref;

    _classCallCheck(this, Index);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = Index.__proto__ || Object.getPrototypeOf(Index)).call.apply(_ref, [this].concat(args)));

    _this.state = {};
    _this.on = {};
    return _this;
  }

  _createClass(Index, [{
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(
        _Default2.default,
        null,
        _radi3.default.r(
          'div',
          { 'class': 'wrapper main' },
          _radi3.default.r(
            'div',
            { 'class': 'grid' },
            _radi3.default.r(
              'div',
              { 'class': 'l3 pr' },
              _radi3.default.r(
                'div',
                { 'class': 'custom-icon' },
                _radi3.default.r('div', null),
                _radi3.default.r('i', { 'class': 'first' }),
                _radi3.default.r('i', { 'class': 'second' }),
                _radi3.default.r('i', { 'class': 'third' }),
                _radi3.default.r('i', { 'class': 'fourth' }),
                _radi3.default.r('i', { 'class': 'fifth' }),
                _radi3.default.r('i', { 'class': 'sixth' }),
                _radi3.default.r('i', { 'class': 'seventh' }),
                _radi3.default.r('img', { src: _bg2.default, srcset: _bg2x2.default + ' 2x', alt: 'Micro rendering' })
              )
            ),
            _radi3.default.r(
              'div',
              { 'class': 'l9 pl' },
              _radi3.default.r(
                'h2',
                null,
                'Micro rendering'
              ),
              _radi3.default.r(
                'p',
                null,
                'This is core feature of Radi, that makes it what it is. By default every framework re-renders whole component and applies changes to DOM. Radi only re-renders parts that others apply.'
              )
            )
          ),
          _radi3.default.r(
            'div',
            { 'class': 'grid' },
            _radi3.default.r(
              'div',
              { 'class': 'l3 pr' },
              _radi3.default.r('img', { src: _shield2.default, srcset: _shield2x2.default + ' 2x', alt: 'Shield' })
            ),
            _radi3.default.r(
              'div',
              { 'class': 'l9 pl' },
              _radi3.default.r(
                'h2',
                null,
                'Immutable state by default'
              ),
              _radi3.default.r(
                'p',
                null,
                'Data cannot be changed once it is created. It can only be done via actions, by returning state modifications. This allows us to do more efficient rendering as Radi does it quite a bit.'
              )
            )
          ),
          _radi3.default.r(
            'div',
            { 'class': 'grid' },
            _radi3.default.r(
              'div',
              { 'class': 'l3 pr' },
              _radi3.default.r(
                'div',
                { 'class': 'custom-icon-component' },
                _radi3.default.r(
                  'i',
                  { 'class': 'head' },
                  _radi3.default.r('img', { src: _head2.default, srcset: _head2x2.default + ' 2x', alt: 'Head' })
                ),
                _radi3.default.r(
                  'i',
                  { 'class': 'body-1' },
                  _radi3.default.r('img', { src: _body2.default, srcset: _body2x2.default + ' 2x', alt: 'Body' })
                ),
                _radi3.default.r(
                  'i',
                  { 'class': 'body-2' },
                  _radi3.default.r('img', { src: _body2.default, srcset: _body2x2.default + ' 2x', alt: 'Body' })
                ),
                _radi3.default.r('img', { src: _bg2.default, srcset: _bg2x2.default + ' 2x', alt: 'Components' })
              )
            ),
            _radi3.default.r(
              'div',
              { 'class': 'l9 pl' },
              _radi3.default.r(
                'h2',
                null,
                'Normal & Headless components'
              ),
              _radi3.default.r(
                'p',
                null,
                'Inject component data and logic inside another component to extend it\'s state and methods. Treat this as mixin (or as a master component), but with in a contained in one-way bind.'
              )
            )
          ),
          _radi3.default.r(
            'div',
            { 'class': 'grid' },
            _radi3.default.r(
              'div',
              { 'class': 'l3 pr' },
              _radi3.default.r('img', { src: _satelite2.default, srcset: _satelite2x2.default + ' 2x', alt: 'Satelite' })
            ),
            _radi3.default.r(
              'div',
              { 'class': 'l9 pl' },
              _radi3.default.r(
                'h2',
                null,
                'Easy event handling'
              ),
              _radi3.default.r(
                'p',
                null,
                'Easy way to handle and trigger component events. This allows plugins to integrate some cool events that can be easily handled. And watch state changes for custom actions.'
              )
            )
          ),
          _radi3.default.r('hr', null),
          _radi3.default.r(
            'h3',
            null,
            'Motivation behind Radi'
          ),
          _radi3.default.r(
            'p',
            null,
            'We as developers need some good tools to ease all of the unnecessary parts of front-end. So here are some of the things Radi aims to handle.'
          ),
          _radi3.default.r(
            'ul',
            null,
            _radi3.default.r(
              'li',
              null,
              'Super simple and easy Single File Component syntax;'
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                'strong',
                null,
                'Handling loading state'
              ),
              ' when user does some action that takes time to complete;'
            ),
            _radi3.default.r(
              'li',
              null,
              'At prototyping stage when we need to set some dummy data, we could use API requests that spits out async predefined data;'
            ),
            _radi3.default.r(
              'li',
              null,
              'Automatic component testing;'
            ),
            _radi3.default.r(
              'li',
              null,
              'Encourage usage of pipelines when writing component logic;'
            ),
            _radi3.default.r(
              'li',
              null,
              'Lower memory usage;'
            ),
            _radi3.default.r(
              'li',
              null,
              'Make it really fast.'
            )
          ),
          _radi3.default.r(
            'div',
            { 'class': 'center-me-maybe' },
            _radi3.default.r(
              Link,
              { to: _globals2.default.docs, 'class': 'btn' },
              'Getting started with Radi'
            ),
            _radi3.default.r(
              'a',
              { href: _globals2.default.github, target: '_blank', 'class': 'btn btn-alt' },
              'Fork on GitHub'
            )
          )
        )
      )];
    }
  }]);

  return Index;
}(_radi3.default.Component);

exports.default = Index;
;
},{"radi":13,"../layouts/Default.radi":58,"../helpers/globals":21,"../../assets/img/satelite.png":59,"../../assets/img/satelite@2x.png":60,"../../assets/img/shield.png":61,"../../assets/img/shield@2x.png":62,"../../assets/img/bg.png":63,"../../assets/img/bg@2x.png":64,"../../assets/img/head.png":65,"../../assets/img/head@2x.png":66,"../../assets/img/body.png":67,"../../assets/img/body@2x.png":68}]},{},[19])
//# sourceMappingURL=c8dcae0a69732e03b210fd058e9198c8.map