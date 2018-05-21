require=function(r,e,n){function t(n,o){function i(r){return t(i.resolve(r))}function f(e){return r[n][1][e]||e}if(!e[n]){if(!r[n]){var c="function"==typeof require&&require;if(!o&&c)return c(n,!0);if(u)return u(n,!0);var l=new Error("Cannot find module '"+n+"'");throw l.code="MODULE_NOT_FOUND",l}i.resolve=f;var s=e[n]=new t.Module(n);r[n][0].call(s.exports,i,s,s.exports)}return e[n].exports}function o(r){this.id=r,this.bundle=t,this.exports={}}var u="function"==typeof require&&require;t.isParcelRequire=!0,t.Module=o,t.modules=r,t.cache=e,t.parent=u;for(var i=0;i<n.length;i++)t(n[i]);return t}({74:[function(require,module,exports) {
module.exports="6e70ba7b1d89921e1828e15e26d37127.svg";
},{}],60:[function(require,module,exports) {
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
          height: parseInt(el.innerHeight, 10)
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
              height: _radi_listen(component, 'height').process(function (_$13) {
                return _$13 + 'px';
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
                'Radi is a tiny (4kB minified & gzipped) javascript framework.'
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
                  _radi_listen(component, 'stars').process(function (_$14) {
                    return _$14 !== null && _radi3.default.r(
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
            _radi_listen(component, 'dots').process(function (_$16) {
              return _$16.map(function (dot) {
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
},{"radi":13,"../../assets/svg/github.svg":74,"../helpers/globals":21}],76:[function(require,module,exports) {
var global = (1,eval)("this");
var e=(0,eval)("this"),t="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},a=function(){var e=/\blang(?:uage)?-([\w-]+)\b/i,a=0,n=t.Prism={manual:t.Prism&&t.Prism.manual,disableWorkerMessageHandler:t.Prism&&t.Prism.disableWorkerMessageHandler,util:{encode:function(e){return e instanceof r?new r(e.type,n.util.encode(e.content),e.alias):"Array"===n.util.type(e)?e.map(n.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).match(/\[object (\w+)\]/)[1]},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++a}),e.__id},clone:function(e,t){var a=n.util.type(e);switch(t=t||{},a){case"Object":if(t[n.util.objId(e)])return t[n.util.objId(e)];var r={};for(var i in t[n.util.objId(e)]=r,e)e.hasOwnProperty(i)&&(r[i]=n.util.clone(e[i],t));return r;case"Array":if(t[n.util.objId(e)])return t[n.util.objId(e)];r=[];return t[n.util.objId(e)]=r,e.forEach(function(e,a){r[a]=n.util.clone(e,t)}),r}return e}},languages:{extend:function(e,t){var a=n.util.clone(n.languages[e]);for(var r in t)a[r]=t[r];return a},insertBefore:function(e,t,a,r){var i=(r=r||n.languages)[e];if(2==arguments.length){for(var s in a=arguments[1])a.hasOwnProperty(s)&&(i[s]=a[s]);return i}var l={};for(var o in i)if(i.hasOwnProperty(o)){if(o==t)for(var s in a)a.hasOwnProperty(s)&&(l[s]=a[s]);l[o]=i[o]}return n.languages.DFS(n.languages,function(t,a){a===r[e]&&t!=e&&(this[t]=l)}),r[e]=l},DFS:function(e,t,a,r){for(var i in r=r||{},e)e.hasOwnProperty(i)&&(t.call(e,i,e[i],a||i),"Object"!==n.util.type(e[i])||r[n.util.objId(e[i])]?"Array"!==n.util.type(e[i])||r[n.util.objId(e[i])]||(r[n.util.objId(e[i])]=!0,n.languages.DFS(e[i],t,i,r)):(r[n.util.objId(e[i])]=!0,n.languages.DFS(e[i],t,null,r)))}},plugins:{},highlightAll:function(e,t){n.highlightAllUnder(document,e,t)},highlightAllUnder:function(e,t,a){var r={callback:a,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};n.hooks.run("before-highlightall",r);for(var i,s=r.elements||e.querySelectorAll(r.selector),l=0;i=s[l++];)n.highlightElement(i,!0===t,r.callback)},highlightElement:function(a,r,i){for(var s,l,o=a;o&&!e.test(o.className);)o=o.parentNode;o&&(s=(o.className.match(e)||[,""])[1].toLowerCase(),l=n.languages[s]),a.className=a.className.replace(e,"").replace(/\s+/g," ")+" language-"+s,a.parentNode&&(o=a.parentNode,/pre/i.test(o.nodeName)&&(o.className=o.className.replace(e,"").replace(/\s+/g," ")+" language-"+s));var u={element:a,language:s,grammar:l,code:a.textContent};if(n.hooks.run("before-sanity-check",u),!u.code||!u.grammar)return u.code&&(n.hooks.run("before-highlight",u),u.element.textContent=u.code,n.hooks.run("after-highlight",u)),void n.hooks.run("complete",u);if(n.hooks.run("before-highlight",u),r&&t.Worker){var g=new Worker(n.filename);g.onmessage=function(e){u.highlightedCode=e.data,n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,i&&i.call(u.element),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},g.postMessage(JSON.stringify({language:u.language,code:u.code,immediateClose:!0}))}else u.highlightedCode=n.highlight(u.code,u.grammar,u.language),n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,i&&i.call(a),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},highlight:function(e,t,a){var i={code:e,grammar:t,language:a};return n.hooks.run("before-tokenize",i),i.tokens=n.tokenize(i.code,i.grammar),n.hooks.run("after-tokenize",i),r.stringify(n.util.encode(i.tokens),i.language)},matchGrammar:function(e,t,a,r,i,s,l){var o=n.Token;for(var u in a)if(a.hasOwnProperty(u)&&a[u]){if(u==l)return;var g=a[u];g="Array"===n.util.type(g)?g:[g];for(var c=0;c<g.length;++c){var d=g[c],p=d.inside,h=!!d.lookbehind,f=!!d.greedy,m=0,y=d.alias;if(f&&!d.pattern.global){var b=d.pattern.toString().match(/[imuy]*$/)[0];d.pattern=RegExp(d.pattern.source,b+"g")}d=d.pattern||d;for(var k=r,v=i;k<t.length;v+=t[k].length,++k){var w=t[k];if(t.length>e.length)return;if(!(w instanceof o)){if(f&&k!=t.length-1){if(d.lastIndex=v,!(C=d.exec(e)))break;for(var F=C.index+(h?C[1].length:0),x=C.index+C[0].length,A=k,S=v,j=t.length;A<j&&(S<x||!t[A].type&&!t[A-1].greedy);++A)F>=(S+=t[A].length)&&(++k,v=S);if(t[k]instanceof o)continue;P=A-k,w=e.slice(v,S),C.index-=v}else{d.lastIndex=0;var C=d.exec(w),P=1}if(C){h&&(m=C[1]?C[1].length:0);x=(F=C.index+m)+(C=C[0].slice(m)).length;var N=w.slice(0,F),E=w.slice(x),O=[k,P];N&&(++k,v+=N.length,O.push(N));var $=new o(u,p?n.tokenize(C,p):C,y,C,f);if(O.push($),E&&O.push(E),Array.prototype.splice.apply(t,O),1!=P&&n.matchGrammar(e,t,a,k,v,!0,u),s)break}else if(s)break}}}}},tokenize:function(e,t,a){var r=[e],i=t.rest;if(i){for(var s in i)t[s]=i[s];delete t.rest}return n.matchGrammar(e,r,t,0,0,!1),r},hooks:{all:{},add:function(e,t){var a=n.hooks.all;a[e]=a[e]||[],a[e].push(t)},run:function(e,t){var a=n.hooks.all[e];if(a&&a.length)for(var r,i=0;r=a[i++];)r(t)}}},r=n.Token=function(e,t,a,n,r){this.type=e,this.content=t,this.alias=a,this.length=0|(n||"").length,this.greedy=!!r};if(r.stringify=function(e,t,a){if("string"==typeof e)return e;if("Array"===n.util.type(e))return e.map(function(a){return r.stringify(a,t,e)}).join("");var i={type:e.type,content:r.stringify(e.content,t,a),tag:"span",classes:["token",e.type],attributes:{},language:t,parent:a};if(e.alias){var s="Array"===n.util.type(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(i.classes,s)}n.hooks.run("wrap",i);var l=Object.keys(i.attributes).map(function(e){return e+'="'+(i.attributes[e]||"").replace(/"/g,"&quot;")+'"'}).join(" ");return"<"+i.tag+' class="'+i.classes.join(" ")+'"'+(l?" "+l:"")+">"+i.content+"</"+i.tag+">"},!t.document)return t.addEventListener?(n.disableWorkerMessageHandler||t.addEventListener("message",function(e){var a=JSON.parse(e.data),r=a.language,i=a.code,s=a.immediateClose;t.postMessage(n.highlight(i,n.languages[r],r)),s&&t.close()},!1),t.Prism):t.Prism;var i=document.currentScript||[].slice.call(document.getElementsByTagName("script")).pop();return i&&(n.filename=i.src,n.manual||i.hasAttribute("data-manual")||("loading"!==document.readyState?window.requestAnimationFrame?window.requestAnimationFrame(n.highlightAll):window.setTimeout(n.highlightAll,16):document.addEventListener("DOMContentLoaded",n.highlightAll))),t.Prism}();"undefined"!=typeof module&&module.exports&&(module.exports=a),void 0!==e&&(e.Prism=a),a.languages.markup={comment:/<!--[\s\S]*?-->/,prolog:/<\?[\s\S]+?\?>/,doctype:/<!DOCTYPE[\s\S]+?>/i,cdata:/<!\[CDATA\[[\s\S]*?]]>/i,tag:{pattern:/<\/?(?!\d)[^\s>\/=$<%]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i,greedy:!0,inside:{tag:{pattern:/^<\/?[^\s>\/]+/i,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"attr-value":{pattern:/=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/i,inside:{punctuation:[/^=/,{pattern:/(^|[^\\])["']/,lookbehind:!0}]}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:/&#?[\da-z]{1,8};/i},a.languages.markup.tag.inside["attr-value"].inside.entity=a.languages.markup.entity,a.hooks.add("wrap",function(e){"entity"===e.type&&(e.attributes.title=e.content.replace(/&amp;/,"&"))}),a.languages.xml=a.languages.markup,a.languages.html=a.languages.markup,a.languages.mathml=a.languages.markup,a.languages.svg=a.languages.markup,a.languages.css={comment:/\/\*[\s\S]*?\*\//,atrule:{pattern:/@[\w-]+?.*?(?:;|(?=\s*\{))/i,inside:{rule:/@[\w-]+/}},url:/url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,selector:/[^{}\s][^{};]*?(?=\s*\{)/,string:{pattern:/("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},property:/[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,important:/\B!important\b/i,function:/[-a-z0-9]+(?=\()/i,punctuation:/[(){};:]/},a.languages.css.atrule.inside.rest=a.languages.css,a.languages.markup&&(a.languages.insertBefore("markup","tag",{style:{pattern:/(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,lookbehind:!0,inside:a.languages.css,alias:"language-css",greedy:!0}}),a.languages.insertBefore("inside","attr-value",{"style-attr":{pattern:/\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,inside:{"attr-name":{pattern:/^\s*style/i,inside:a.languages.markup.tag.inside},punctuation:/^\s*=\s*['"]|['"]\s*$/,"attr-value":{pattern:/.+/i,inside:a.languages.css}},alias:"language-css"}},a.languages.markup.tag)),a.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\]/}},keyword:/\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,boolean:/\b(?:true|false)\b/,function:/[a-z0-9_]+(?=\()/i,number:/\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,punctuation:/[{}[\];(),.:]/},a.languages.javascript=a.languages.extend("clike",{keyword:/\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,number:/\b(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,function:/[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\()/i,operator:/-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/}),a.languages.insertBefore("javascript","keyword",{regex:{pattern:/((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[[^\]\r\n]+]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,lookbehind:!0,greedy:!0},"function-variable":{pattern:/[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=\s*(?:function\b|(?:\([^()]*\)|[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/i,alias:"function"},constant:/\b[A-Z][A-Z\d_]*\b/}),a.languages.insertBefore("javascript","string",{"template-string":{pattern:/`(?:\\[\s\S]|[^\\`])*`/,greedy:!0,inside:{interpolation:{pattern:/\$\{[^}]+\}/,inside:{"interpolation-punctuation":{pattern:/^\$\{|\}$/,alias:"punctuation"},rest:a.languages.javascript}},string:/[\s\S]+/}}}),a.languages.markup&&a.languages.insertBefore("markup","tag",{script:{pattern:/(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,lookbehind:!0,inside:a.languages.javascript,alias:"language-javascript",greedy:!0}}),a.languages.js=a.languages.javascript,"undefined"!=typeof self&&self.Prism&&self.document&&document.querySelector&&(self.Prism.fileHighlight=function(){var e={js:"javascript",py:"python",rb:"ruby",ps1:"powershell",psm1:"powershell",sh:"bash",bat:"batch",h:"c",tex:"latex"};Array.prototype.slice.call(document.querySelectorAll("pre[data-src]")).forEach(function(t){for(var n,r=t.getAttribute("data-src"),i=t,s=/\blang(?:uage)?-(?!\*)([\w-]+)\b/i;i&&!s.test(i.className);)i=i.parentNode;if(i&&(n=(t.className.match(s)||[,""])[1]),!n){var l=(r.match(/\.(\w+)$/)||[,""])[1];n=e[l]||l}var o=document.createElement("code");o.className="language-"+n,t.textContent="",o.textContent="Loading…",t.appendChild(o);var u=new XMLHttpRequest;u.open("GET",r,!0),u.onreadystatechange=function(){4==u.readyState&&(u.status<400&&u.responseText?(o.textContent=u.responseText,a.highlightElement(o)):u.status>=400?o.textContent="✖ Error "+u.status+" while fetching file: "+u.statusText:o.textContent="✖ Error: File does not exist or is empty")},t.hasAttribute("data-download-link")&&a.plugins.toolbar&&a.plugins.toolbar.registerButton("download-file",function(){var e=document.createElement("a");return e.textContent=t.getAttribute("data-download-link-label")||"Download",e.setAttribute("download",""),e.href=r,e}),u.send(null)})},document.addEventListener("DOMContentLoaded",self.Prism.fileHighlight));
},{}],77:[function(require,module,exports) {
!function(t){var n=t.util.clone(t.languages.javascript);t.languages.jsx=t.languages.extend("markup",n),t.languages.jsx.tag.pattern=/<\/?[\w.:-]+\s*(?:\s+(?:[\w.:-]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s{'">=]+|\{(?:\{[^}]*\}|[^{}])+\}))?|\{\.{3}[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\}))*\s*\/?>/i,t.languages.jsx.tag.inside["attr-value"].pattern=/=(?!\{)(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">]+)/i,t.languages.insertBefore("inside","attr-name",{spread:{pattern:/\{\.{3}[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\}/,inside:{punctuation:/\.{3}|[{}.]/,"attr-value":/\w+/}}},t.languages.jsx.tag),t.languages.insertBefore("inside","attr-value",{script:{pattern:/=(\{(?:\{[^}]*\}|[^}])+\})/i,inside:{"script-punctuation":{pattern:/^=(?={)/,alias:"punctuation"},rest:t.languages.jsx},alias:"language-javascript"}},t.languages.jsx.tag);var e=function(t){return"string"==typeof t?t:"string"==typeof t.content?t.content:t.content.map(e).join("")},a=function(n){for(var s=[],g=0;g<n.length;g++){var o=n[g],i=!1;if("string"!=typeof o&&("tag"===o.type&&o.content[0]&&"tag"===o.content[0].type?"</"===o.content[0].content[0].content?s.length>0&&s[s.length-1].tagName===e(o.content[0].content[1])&&s.pop():"/>"===o.content[o.content.length-1].content||s.push({tagName:e(o.content[0].content[1]),openedBraces:0}):s.length>0&&"punctuation"===o.type&&"{"===o.content?s[s.length-1].openedBraces++:s.length>0&&s[s.length-1].openedBraces>0&&"punctuation"===o.type&&"}"===o.content?s[s.length-1].openedBraces--:i=!0),(i||"string"==typeof o)&&s.length>0&&0===s[s.length-1].openedBraces){var p=e(o);g<n.length-1&&("string"==typeof n[g+1]||"plain-text"===n[g+1].type)&&(p+=e(n[g+1]),n.splice(g+1,1)),g>0&&("string"==typeof n[g-1]||"plain-text"===n[g-1].type)&&(p=e(n[g-1])+p,n.splice(g-1,1),g--),n[g]=new t.Token("plain-text",p,null,p)}o.content&&"string"!=typeof o.content&&a(o.content)}};t.hooks.add("after-tokenize",function(t){("jsx"===t.language||"tsx"===t.language)&&a(t.tokens)})}(Prism);
},{}],75:[function(require,module,exports) {

},{}],59:[function(require,module,exports) {
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
        if (window.lastmount) window.lastmount.destroy();
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
          if (window.lastmount) window.lastmount.destroy();
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
          { 'class': _radi_listen(component, 'error').process(function (_$1) {
              return ['repl-wrap', _$1 && 'repl-error'];
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
                _radi_listen(component, 'error').process(function (_$2) {
                  return _$2 ? 'Error' : 'Live preview';
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
                    marginTop: _radi_listen(component, 'scroll').process(function (_$3) {
                      return -_$3 + 'px';
                    })
                  } },
                _radi3.default.r('code', { 'class': 'tlit-highlight',
                  html: _radi_listen(component, 'code').process(function (_$4) {
                    return _prismjs2.default.highlight(_$4, _prismjs2.default.languages.jsx);
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
          _radi_listen(component, 'error').process(function (_$6) {
            return _$6 && _radi3.default.r(
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
},{"radi":13,"prismjs":76,"babel-plugin-transform-radi-listen":52,"../helpers/radi-compiler-browser.js":51,"prismjs/components/prism-jsx.min":77,"../../assets/stylus/mini-repl.styl":75}],38:[function(require,module,exports) {
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
},{"radi":13,"../components/Hero.radi":60,"../components/MiniRepl.radi":59,"../components/Header.radi":36,"../helpers/globals":21}],39:[function(require,module,exports) {
module.exports="ec1044bce9e69aa95df108c9581b0106.png";
},{}],40:[function(require,module,exports) {
module.exports="94d93683a2ebc1a16ed11e7e5c5b09c6.png";
},{}],41:[function(require,module,exports) {
module.exports="68eaf9dda3323f75544cfa111b82b69c.png";
},{}],42:[function(require,module,exports) {
module.exports="90e891bd752da22c18abff180dd8bef9.png";
},{}],43:[function(require,module,exports) {
module.exports="7dac33bb14b9cd6b71ac140d422436f5.png";
},{}],44:[function(require,module,exports) {
module.exports="e63612f23f466482c9d44de0328f92d1.png";
},{}],45:[function(require,module,exports) {
module.exports="4a4cbae5cc9695d074dc7d3e89ed3361.png";
},{}],46:[function(require,module,exports) {
module.exports="866d1a29ff9d6e555a3ce13f0701e90f.png";
},{}],47:[function(require,module,exports) {
module.exports="6fde0edafe606b5119b8fd221444d322.png";
},{}],48:[function(require,module,exports) {
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
},{"radi":13,"../layouts/Default.radi":38,"../helpers/globals":21,"../../assets/img/satelite.png":39,"../../assets/img/satelite@2x.png":40,"../../assets/img/shield.png":41,"../../assets/img/shield@2x.png":42,"../../assets/img/bg.png":43,"../../assets/img/bg@2x.png":44,"../../assets/img/head.png":45,"../../assets/img/head@2x.png":46,"../../assets/img/body.png":47,"../../assets/img/body@2x.png":48}]},{},[19])
//# sourceMappingURL=c8dcae0a69732e03b210fd058e9198c8.map