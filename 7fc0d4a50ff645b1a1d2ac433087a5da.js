require=function(r,e,n){function t(n,o){function i(r){return t(i.resolve(r))}function f(e){return r[n][1][e]||e}if(!e[n]){if(!r[n]){var c="function"==typeof require&&require;if(!o&&c)return c(n,!0);if(u)return u(n,!0);var l=new Error("Cannot find module '"+n+"'");throw l.code="MODULE_NOT_FOUND",l}i.resolve=f;var s=e[n]=new t.Module(n);r[n][0].call(s.exports,i,s,s.exports)}return e[n].exports}function o(r){this.id=r,this.bundle=t,this.exports={}}var u="function"==typeof require&&require;t.isParcelRequire=!0,t.Module=o,t.modules=r,t.cache=e,t.parent=u;for(var i=0;i<n.length;i++)t(n[i]);return t}({37:[function(require,module,exports) {

},{}],36:[function(require,module,exports) {
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

var _babelPluginTransformRadiListen = require('babel-plugin-transform-radi-listen');

var _babelPluginTransformRadiListen2 = _interopRequireDefault(_babelPluginTransformRadiListen);

var _radiCompilerBrowser = require('../helpers/radi-compiler-browser.js');

var _radiCompilerBrowser2 = _interopRequireDefault(_radiCompilerBrowser);

require('../../assets/stylus/large-repl.styl');

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

var LargeRepl = (_class = function (_radi$Component) {
  _inherits(LargeRepl, _radi$Component);

  function LargeRepl() {
    var _ref, _desc2, _value2, _obj;

    _classCallCheck(this, LargeRepl);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = LargeRepl.__proto__ || Object.getPrototypeOf(LargeRepl)).call.apply(_ref, [this].concat(args)));

    _this.state = {
      scroll: 0,
      error: null,
      code: '',
      height: 800,
      url: ''
    };
    _this.on = (_obj = {
      mount: function mount() {
        var _this2 = this;

        window.onresize = function (e) {
          return _this2.trigger('resize', e.target);
        };
        this.trigger('resize', window);

        var fn = function fn() {
          var _ace$edit;

          // ace.define(`function(require, exports, module) {
          //   var JsxHighlightRules = require("ace/mode/jsx_highlight_rules").JsxHighlightRules;
          //
          // 	(function() {
          //
          //     this.$rules = new JsxHighlightRules().getRules();
          //
          //     var newRules = {
          //       start: [
          //         {
          //           token : "pipeline.operator",
          //           regex : "\|\>"
          //         }
          //       ]
          //     };
          //     this.addRules(newRules, "new-");
          //
          //   }).call(JsxHighlightRules.prototype);
          //
          //   exports.JsxHighlightRules = JsxHighlightRules;
          // }`, 1);
          var editor = ace.edit("aceditor", (_ace$edit = {
            mode: "ace/mode/javascript",
            selectionStyle: "text",
            cursorStyle: "smooth",
            showPrintMargin: false,
            tabSize: 2,
            fixedWidthGutter: true,
            foldStyle: "manual",
            useWorker: false,
            tooltipFollowsMouse: false
          }, _defineProperty(_ace$edit, 'selectionStyle', "line"), _defineProperty(_ace$edit, 'scrollPastEnd', true), _defineProperty(_ace$edit, 'fontSize', 14), _defineProperty(_ace$edit, 'value', _this2.$router.state.params.code ? _this2.fromBase64(_this2.$router.state.params.code.replace(/^code\=/, '')) : _this2.state.code), _ace$edit));

          _this2.originalChange(editor.getValue());
          editor.on("change", function (e) {
            _this2.originalChange(editor.getValue());
          });
        };
        loadJS('https://unpkg.com/@babel/standalone@7.0.0-beta.46/babel.min.js', function () {
          loadJS('https://ajaxorg.github.io/ace-builds/src-min-noconflict/ace.js', fn);
        });
      },
      destroy: function destroy() {
        if (window.lastmount) window.lastmount.destroy();
      },
      resize: function resize(el) {
        return {
          height: parseInt(el.innerHeight, 10)
        };
      }
    }, (_applyDecoratedDescriptor(_obj, 'resize', [action], Object.getOwnPropertyDescriptor(_obj, 'resize'), _obj)), _obj);
    return _this;
  }

  _createClass(LargeRepl, [{
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
    key: 'originalChange',
    value: function originalChange(code) {
      this.codeChange(code, 'Sample');
      return {
        code: code
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

      (function (code) {
        if (window.lastmount) window.lastmount.destroy();
        var del = document.getElementById('repl-out-' + self.$id);
        del.parentNode.replaceChild(del.cloneNode(false), del);
        eval(code + 'window.lastmount = Radi.mount([new Sample()], "repl-out-' + self.$id + '");');
        self.setError();
      })(transformed.code);
    }
  }, {
    key: 'codeChange',
    value: function codeChange(value, name) {
      var based = this.toBase64(value).url;
      window.history.replaceState({}, document.title, window.location.href.replace(/\/code\=.*/, '') + '/code=' + based);
      try {
        var parsed = (0, _radiCompilerBrowser2.default)(name, value);
        this.build(parsed);
      } catch (e) {
        this.setError([e.name, e.message], e);
      }
    }
  }, {
    key: 'toBase64',
    value: function toBase64(string) {
      return {
        url: window.encodeURIComponent(window.btoa(window.unescape(window.encodeURIComponent(string))))
      };
    }
  }, {
    key: 'fromBase64',
    value: function fromBase64(string) {
      return window.decodeURIComponent(window.escape(window.atob(window.decodeURIComponent(string))));
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
          { 'class': _radi_listen(component, 'error').process(function (_$0) {
              return ['large-repl-wrap', 'repl-wrap', _$0 && 'repl-error'];
            }), style: {
              height: _radi_listen(component, 'height').process(function (_$1) {
                return _$1 - 54 + 'px';
              })
            } },
          _radi3.default.r(
            'div',
            { 'class': 'repl-head' },
            _radi3.default.r(
              'strong',
              null,
              'Radi live editor'
            ),
            _radi3.default.r(
              'div',
              null,
              _radi3.default.r(
                'span',
                null,
                _radi_listen(component, 'error').process(function (_$2) {
                  return _$2 ? 'Error' : 'Live preview';
                })
              )
            )
          ),
          _radi3.default.r(
            'div',
            { 'class': 'repl-container' },
            _radi3.default.r('pre', { id: 'aceditor', style: {
                height: _radi_listen(component, 'height').process(function (_$3) {
                  return _$3 - 95 + 'px';
                })
              } })
          ),
          _radi_listen(component, 'error').process(function (_$4) {
            return _$4 && _radi3.default.r(
              'pre',
              { 'class': 'repl-out-error', style: {
                  height: _radi_listen(component, 'height').process(function (_$5) {
                    return _$5 - 95 + 'px';
                  })
                } },
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
            { id: 'repl-out-' + component.$id, 'class': 'repl-output', style: {
                height: _radi_listen(component, 'height').process(function (_$8) {
                  return _$8 - 95 + 'px';
                })
              } },
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

  return LargeRepl;
}(_radi3.default.Component), (_applyDecoratedDescriptor(_class.prototype, 'scrollCode', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'scrollCode'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setError', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'setError'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'originalChange', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'originalChange'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'toBase64', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'toBase64'), _class.prototype)), _class);
exports.default = LargeRepl;
;
},{"radi":13,"babel-plugin-transform-radi-listen":52,"../helpers/radi-compiler-browser.js":51,"../../assets/stylus/large-repl.styl":37}],20:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

var _globals = require('../helpers/globals');

var _globals2 = _interopRequireDefault(_globals);

var _LargeRepl = require('../components/LargeRepl.radi');

var _LargeRepl2 = _interopRequireDefault(_LargeRepl);

var _Header = require('../components/Header.radi');

var _Header2 = _interopRequireDefault(_Header);

require('../../assets/stylus/large-repl.styl');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var Repl = function (_radi$Component) {
  _inherits(Repl, _radi$Component);

  function Repl() {
    var _ref;

    _classCallCheck(this, Repl);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = Repl.__proto__ || Object.getPrototypeOf(Repl)).call.apply(_ref, [this].concat(args)));

    _this.state = {};
    _this.on = {};
    return _this;
  }

  _createClass(Repl, [{
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(
        'template',
        null,
        _radi3.default.r(
          'div',
          null,
          _radi3.default.r(_Header2.default, { location: 'at-repl' }),
          _radi3.default.r(_LargeRepl2.default, { code: _globals2.default.startingCode })
        )
      )];
    }
  }]);

  return Repl;
}(_radi3.default.Component);

exports.default = Repl;
;
},{"radi":13,"../helpers/globals":21,"../components/LargeRepl.radi":36,"../components/Header.radi":35,"../../assets/stylus/large-repl.styl":37}]},{},[20])
//# sourceMappingURL=7fc0d4a50ff645b1a1d2ac433087a5da.map