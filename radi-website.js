require=function(r,e,n){function t(n,o){function i(r){return t(i.resolve(r))}function f(e){return r[n][1][e]||e}if(!e[n]){if(!r[n]){var c="function"==typeof require&&require;if(!o&&c)return c(n,!0);if(u)return u(n,!0);var l=new Error("Cannot find module '"+n+"'");throw l.code="MODULE_NOT_FOUND",l}i.resolve=f;var s=e[n]=new t.Module(n);r[n][0].call(s.exports,i,s,s.exports)}return e[n].exports}function o(r){this.id=r,this.bundle=t,this.exports={}}var u="function"==typeof require&&require;t.isParcelRequire=!0,t.Module=o,t.modules=r,t.cache=e,t.parent=u;for(var i=0;i<n.length;i++)t(n[i]);return t}({16:[function(require,module,exports) {

var t,e,n=module.exports={};function r(){throw new Error("setTimeout has not been defined")}function o(){throw new Error("clearTimeout has not been defined")}function i(e){if(t===setTimeout)return setTimeout(e,0);if((t===r||!t)&&setTimeout)return t=setTimeout,setTimeout(e,0);try{return t(e,0)}catch(n){try{return t.call(null,e,0)}catch(n){return t.call(this,e,0)}}}function u(t){if(e===clearTimeout)return clearTimeout(t);if((e===o||!e)&&clearTimeout)return e=clearTimeout,clearTimeout(t);try{return e(t)}catch(n){try{return e.call(null,t)}catch(n){return e.call(this,t)}}}!function(){try{t="function"==typeof setTimeout?setTimeout:r}catch(e){t=r}try{e="function"==typeof clearTimeout?clearTimeout:o}catch(t){e=o}}();var c,s=[],l=!1,a=-1;function f(){l&&c&&(l=!1,c.length?s=c.concat(s):a=-1,s.length&&h())}function h(){if(!l){var t=i(f);l=!0;for(var e=s.length;e;){for(c=s,s=[];++a<e;)c&&c[a].run();a=-1,e=s.length}c=null,l=!1,u(t)}}function m(t,e){this.fun=t,this.array=e}function p(){}n.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)e[n-1]=arguments[n];s.push(new m(t,e)),1!==s.length||l||i(h)},m.prototype.run=function(){this.fun.apply(null,this.array)},n.title="browser",n.browser=!0,n.env={},n.argv=[],n.version="",n.versions={},n.on=p,n.addListener=p,n.once=p,n.off=p,n.removeListener=p,n.removeAllListeners=p,n.emit=p,n.prependListener=p,n.prependOnceListener=p,n.listeners=function(t){return[]},n.binding=function(t){throw new Error("process.binding is not supported")},n.cwd=function(){return"/"},n.chdir=function(t){throw new Error("process.chdir is not supported")},n.umask=function(){return 0};
},{}],13:[function(require,module,exports) {
var global = (1,eval)("this");
var process = require("process");
var e=(0,eval)("this"),t=require("process");!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):e.Radi=t()}(this,function(){"use strict";var e={HEADLESS_COMPONENTS:{},FROZEN_STATE:!1,VERSION:"0.3.12",ACTIVE_COMPONENTS:{},HTML_CACHE:{}},t=function(e,...t){var n;this.component=e,n=t,this.key=n[0],this.childPath=t.slice(1,t.length),this.path=t,this.value=null,this.changeListeners=[],this.processValue=(e=>e),this.attached=!0,this.component.addListener(this.key,this),this.component.state&&this.handleUpdate(this.component.state[this.key])};t.prototype.deattach=function(){this.component=null,this.attached=!1,this.key=null,this.childPath=null,this.path=null,this.value=null,this.changeListeners=[],this.processValue=(()=>{})},t.prototype.handleUpdate=function(e){var n=this.processValue(this.getShallowValue(e),this.value);n instanceof t&&this.value instanceof t&&this.value.deattach(),this.value=n,this.changeListeners.forEach(e=>e(this.value))},t.prototype.onValueChange=function(e){this.changeListeners.push(e),e(this.value)},t.prototype.process=function(e){return this.processValue=e,this.handleUpdate(this.value),this},t.prototype.getShallowValue=function(e){if("object"!=typeof e||!this.childPath)return e;var t=e;for(var n of this.childPath)t=null===t||!t[n]&&"number"!=typeof t[n]?null:t[n];return t};var n=function(e){var t=e.attributeKey,n=e.listener,s=e.element;this.attributeKey=t,this.listener=n,this.element=s,this.attached=!1,this.handleValueChange=this.handleValueChange.bind(this)};n.prototype.attach=function(){return this.element.attributeListeners||(this.element.attributeListeners=[]),this.element.attributeListeners.push(this),this.listener.onValueChange(this.handleValueChange),this.attached=!0,"model"===this.attributeKey&&(/(checkbox|radio)/.test(this.element.getAttribute("type"))?this.element.addEventListener("change",e=>{this.listener.component.setState({[this.listener.key]:e.target.checked})}):this.element.addEventListener("input",e=>{this.listener.component.setState({[this.listener.key]:e.target.value})})),this},n.prototype.handleValueChange=function(e){"value"===this.attributeKey||"model"===this.attributeKey?/(checkbox|radio)/.test(this.element.getAttribute("type"))?this.element.checked=e:this.element.value=e:r(this.element,{[this.attributeKey]:e})},n.prototype.updateElement=function(e){return this.element=e,this.element},n.prototype.deattach=function(){this.attributeKey=null,this.listener.deattach(),this.listener=null,this.element=null,this.listenerAsNode=null,this.attached=!1,this.handleValueChange=(()=>{})};var s=function(e){var t=e.styleKey,n=e.listener,s=e.element;this.styleKey=t,this.listener=n,this.element=s,this.attached=!1,this.handleValueChange=this.handleValueChange.bind(this)};s.prototype.attach=function(){return this.element.styleListeners||(this.element.styleListeners=[]),this.element.styleListeners.push(this),this.listener.onValueChange(this.handleValueChange),this.attached=!0,this},s.prototype.handleValueChange=function(e){i(this.element,this.styleKey,e)},s.prototype.updateElement=function(e){return this.element=e,this.element},s.prototype.deattach=function(){this.listener.deattach(),this.styleKey=null,this.listener=null,this.element=null,this.attached=!1,this.handleValueChange=null};var i=(e,n,i)=>{if(void 0!==i)return i instanceof t?(new s({styleKey:n,listener:i,element:e}).attach(),e[n]):e.style[n]=(e=>"number"!=typeof e||Number.isNaN(e)?e:`${e}px`)(i)},r=(e,s)=>{var r=function(r){var a=s[r];void 0!==a&&(a||"number"==typeof a?"style"!==r.toLowerCase()?a instanceof t?new n({attributeKey:r,listener:a,element:e}).attach():"class"!==r.toLowerCase()&&"classname"!==r.toLowerCase()?"html"!==r.toLowerCase()?"model"!==r.toLowerCase()?"on"!==r.substring(0,2).toLowerCase()?e.setAttribute(r,a):"onsubmit"===r.substring(0,8).toLowerCase()?e[r]=(e=>{var t=[],n=e.target.elements||[];for(var s of n)if(""!==s.name){var i={name:s.name,el:s,type:s.type,default:s.defaultValue,value:s.value,set(e){this.el.value=e},reset(e){this.el.value=e,this.el.defaultValue=e}};t.push(i),Object.defineProperty(t,i.name,{value:i})}return a(e,t)}):e[r]=a:/(checkbox|radio)/.test(e.getAttribute("type"))?e.onchange=(e=>{a.component[a.key]=e.target.checked}):(e.oninput=(e=>{a.component[a.key]=e.target.value}),e.value=a.value):e.innerHTML=a:e.setAttribute("class",(e=>Array.isArray(e)?e.filter(e=>e).join(" "):e)(a)):((e,s)=>{if("string"==typeof s&&(e.style=s),"object"!=typeof s||Array.isArray(s))return e.style;if(s instanceof t)return new n({attributeKey:"style",listener:s,element:e}).attach(),e.style;for(var r in s)i(e,r,s[r]);e.style})(e,a):e.removeAttribute(r))};for(var a in s)r(a)},a=(e,t)=>"string"==typeof e||"number"==typeof e?"template"!==e?t||"svg"===e?document.createElementNS("http://www.w3.org/2000/svg",e):document.createElement(e):document.createDocumentFragment():(console.warn("[Radi.js] Warn: Creating a JSX element whose query is not of type string, automatically converting query to string."),document.createElement(e.toString())),o=function(){this.store={}};o.prototype.addListener=function(e,t){return void 0===this.store[e]&&this.createItemWrapper(e),this.store[e].listeners=this.store[e].listeners.filter(e=>e.attached),this.store[e].listeners.push(t),t.handleUpdate(this.store[e].value),t},o.prototype.removeListeners=function(){for(var e=Object.keys(this.store),t=0;t<e.length;t++)this.store[e[t]].listeners=[],this.store[e[t]].null=[]},o.prototype.setState=function(e){for(var t of Object.keys(e))void 0===this.store[t]&&this.createItemWrapper(t),this.store[t].value=e[t],this.triggerListeners(t);return e},o.prototype.createItemWrapper=function(e){return this.store[e]={listeners:[],value:null}},o.prototype.triggerListeners=function(e){var t=this.store[e];t&&t.listeners.forEach(e=>{e.attached&&e.handleUpdate(t.value)})};var l=e=>{if(e instanceof Node){for(var t,n=document.createTreeWalker(e,NodeFilter.SHOW_ALL,e=>!0,!1),s=[];t=n.nextNode();){if(t.listeners)for(var i=0;i<t.listeners.length;i++)t.listeners[i].deattach();if(t.listeners=null,t.attributeListeners)for(i=0;i<t.attributeListeners.length;i++)t.attributeListeners[i].deattach();if(t.attributeListeners=null,t.styleListeners)for(i=0;i<t.styleListeners.length;i++)t.styleListeners[i].deattach();t.styleListeners=null,t.destroy&&t.destroy(),s.push(function(){t&&t.parentNode&&t.parentNode.removeChild(t)})}if(e.listeners)for(i=0;i<e.listeners.length;i++)e.listeners[i].deattach();if(e.listeners=null,e.attributeListeners)for(i=0;i<e.attributeListeners.length;i++)e.attributeListeners[i].deattach();if(e.attributeListeners=null,e.styleListeners)for(i=0;i<e.styleListeners.length;i++)e.styleListeners[i].deattach();e.styleListeners=null,e.styleListeners=null,e.destroy&&e.destroy(),e.parentNode&&e.parentNode.removeChild(e);for(i=0;i<s.length;i++)s[i]();s=null}};function h(e,t){return e.id?e.id===t.id:e.isSameNode?e.isSameNode(t):e.tagName===t.tagName&&(3===e.type&&e.nodeValue===t.nodeValue)}var u,c=(e,t,n)=>{if((Array.isArray(t)||Array.isArray(e))&&(n=!0),!n){var s=e.nodeType,i=t.nodeType;if(s===i&&(3===s||8===i))return h(e,t)||(e.nodeValue=t.nodeValue,l(t)),e;if(t.destroy||e.destroy||t.__async||e.__async||e.listeners||t.listeners||3===s||3===i)return h(e,t)||(e.parentNode.insertBefore(t,e),l(e)),t;!function(e,t,n){for(var s=t.attributes,i=0,r=s.length;i<r;i++){var a=s.item(i),o=a.namespaceURI,l=o?n.getNamedItemNS(o,a.name):n.getNamedItem(a.name);if("style"!==l.name)l&&l.value==a.value||(o?e.setAttributeNS(o,a.name,a.value):e.setAttribute(a.name,a.value));else for(var h of t.style)e.style[h]!==t.style[h]&&(e.style[h]=t.style[h])}for(var u=n.length;u;){var c=n.item(--u),d=c.namespaceURI;d?s.getNamedItemNS(d,c.name)||e.removeAttributeNS(d,c.name):s.getNamedItem(c.name)||e.removeAttribute(c.name)}}(e,t,(u=e,u.attributes))}for(var r=[...e.childNodes||e],a=[...t.childNodes||t],o=Math.max(r.length,a.length),d=0;d<o;d++)r[d]&&a[d]?c(r[d],a[d]):r[d]&&!a[d]?l(r[d]):!r[d]&&a[d]&&e.appendChild(a[d]);return l(t),e},d=function(){};d.prototype.fuse=function(...e){return c(...e)},d.prototype.destroy=function(...e){return l(...e)};var f=new d,p=function(t,n){for(var s in this.addNonEnumerableProperties({$id:(()=>{for(var e="",t=0;t<32;t++){var n=16*Math.random()|0;8!==t&&12!==t&&16!==t&&20!==t||(e+="-"),e+=(12===t?4:16===t?3&n|8:n).toString(16)}return e})(),$name:this.constructor.name,$config:"function"==typeof this.config?this.config():{listen:!0},$events:{},$privateStore:new o}),this.on="function"==typeof this.on?this.on():{},this.children=[],e.HEADLESS_COMPONENTS)this[s].when("update",()=>this.setState());this.state=Object.assign("function"==typeof this.state?this.state():{},n||{}),t&&this.setChildren(t)};p.prototype.render=function(e){if("function"!=typeof this.view)return"";var t=this.view();if(Array.isArray(t))for(var n=0;n<t.length;n++)"function"==typeof t[n].buildNode&&(t[n]=t[n].buildNode(e)),t[n].destroy=this.destroy.bind(this);else"function"==typeof t.buildNode&&(t=t.buildNode(e)),t.destroy=this.destroy.bind(this);return this.html=t,t},p.prototype.setProps=function(e){return this.setState(e),this},p.prototype.setChildren=function(e){this.children=e,this.setState();for(var t=0;t<this.children.length;t++)"function"==typeof this.children[t].when&&this.children[t].when("update",()=>this.setState());return this},p.prototype.addNonEnumerableProperties=function(e){for(var t in e)void 0===this[t]&&Object.defineProperty(this,t,{value:e[t]})},p.prototype.addListener=function(e,t){this.$privateStore.addListener(e,t)},p.prototype.mount=function(){this.trigger("mount")},p.prototype.destroy=function(){this.trigger("destroy"),this.$privateStore.removeListeners()},p.prototype.when=function(e,t){void 0===this.$events[e]&&(this.$events[e]=[]),this.$events[e].push(t)},p.prototype.trigger=function(e,...t){if("function"==typeof this.on[e]&&this.on[e].call(this,...t),void 0!==this.$events[e])for(var n in this.$events[e])this.$events[e][n].call(this,...t)},p.prototype.setState=function(e){if("object"==typeof e){var t=this.state;this.state=Object.assign(t,e),this.$config.listen&&this.$privateStore.setState(e)}return!this.$config.listen&&"function"==typeof this.view&&this.html&&f.fuse(this.html,this.view()),this.trigger("update"),e},p.isComponent=function(){return!0};var y=(e,t,n)=>{var s=document.createDocumentFragment(),i="string"==typeof t?document.getElementById(t):t;n=n||i instanceof SVGElement;var r=e instanceof p||e.render?e.render(n):e;if(Array.isArray(r))for(var a=0;a<r.length;a++)y(r[a],s,n);else g(s,n)(r);return i.appendChild(s),"function"!=typeof i.destroy&&(i.destroy=(()=>{for(var e=0;e<r.length;e++)f.destroy(r[e])})),"function"==typeof e.mount&&e.mount(),i},m=e=>{if(e instanceof DocumentFragment)return Array.from(e.childNodes);var t=document.createDocumentFragment();return b(t,(e=>Array.isArray(e)?e:[e])(e)),m(t)},v=function(e){var t=e.listener,n=e.element;this.listener=t,this.element=n,this.listenerAsNode=[],this.attached=!1,this.handleValueChange=this.handleValueChange.bind(this)};v.prototype.attach=function(){return this.element.listeners||(this.element.listeners=[]),this.element.listeners.push(this),this.listener.onValueChange(this.handleValueChange),this.attached=!0,this},v.prototype.handleValueChange=function(e){var t=m(e),n=0;for(var s of t)this.listenerAsNode[n]?this.listenerAsNode[n]=f.fuse(this.listenerAsNode[n],s):this.listenerAsNode.push(this.element.appendChild(s)),n+=1;if(n<this.listenerAsNode.length){var i=this.listenerAsNode.splice(n-this.listenerAsNode.length);for(var r of i)f.destroy(r)}},v.prototype.updateElement=function(e){return this.element=e,this.element},v.prototype.deattach=function(){this.listener.deattach(),this.listener=null,this.element=null,this.listenerAsNode=null,this.attached=!1,this.handleValueChange=(()=>{})};var g=(e,n)=>s=>{if(s||"number"==typeof s||(s=""),"function"!=typeof s.buildNode)if(s instanceof p)y(s,e,n);else if(s instanceof t)((e,t)=>new v({listener:e,element:t}).attach())(s,e);else if(Array.isArray(s))b(e,s,n);else if("function"!=typeof s)s instanceof Node?e.appendChild(s):e.appendChild(document.createTextNode(s));else{var i=s();if(i instanceof Promise){var r=document.createElement("section");r.__async=!0;var a=e.appendChild(r);a.__async=!0,i.then(e=>{if(e.default&&e.default.isComponent)g(a,n)(new e.default);else if("function"==typeof e.default){e.default().then(e=>{e.default&&e.default.isComponent&&g(a,n)(new e.default)})}else g(a,n)(e.default)}).catch(console.warn)}else g(e,n)(i)}else g(e,n)(s.buildNode(n))},b=(e,t,n)=>{t.forEach(g(e,n))},N={},C={},L=(e,t,n,...s)=>{if("function"==typeof t&&t.isComponent)return new t(s).setProps(n||{});if("function"==typeof t){var i=n||{};return i.children=s,t(i)}var o=e||"svg"===t,l=(o?(e=>C[e]||(C[e]=a(e,!0)))(t):(e=>N[e]||(N[e]=a(e,!1)))(t)).cloneNode(!1);return null!==n&&r(l,n),b(l,s,o),l},A={html:(...e)=>L(!1,...e),svg:(...e)=>L(!0,...e)},S=(e,...n)=>new t(e,...n);var w={version:e.VERSION,activeComponents:e.ACTIVE_COMPONENTS,r:(e,t,...n)=>({buildNode:s=>A[s?"svg":"html"](e,t,...n)}),listen:S,l:S,worker:function(e,t,n){var s,i,r,a,o=n.value,l=(s=(()=>{}),i=new Blob([`self.onmessage = function(e) {\n    self.postMessage((${o.toString()})(e.data));\n  }`],{type:"text/javascript"}),r=window.URL.createObjectURL(i),(a=new Worker(r)).onmessage=(e=>{s(e.data,null)}),a.onerror=(e=>{s(null,e.data)}),e=>new Promise((t,n)=>{s=((e,s)=>s?n(e):t(e)),a.postMessage(e)}));return n.value=function(...e){l(...e).then(e=>{this.setState.call(this,e)})},n},component:p,Component:p,action:function(e,t,n){var s=n.value;return n.value=function(...e){return this.setState.call(this,s.call(this,...e))},n},subscribe:function(e,t,n){return function(n,s,i){return e["on"+(t||s)]=function(...e){return i.value.call(this,...e)},i}},headless:(t,n)=>{var s="$".concat(t),i=new n;return i.mount(),p.prototype[s]=i,e.HEADLESS_COMPONENTS[s]=i},mount:y,freeze:()=>{e.FROZEN_STATE=!0},unfreeze:()=>{e.FROZEN_STATE=!1,Object.values(e.ACTIVE_COMPONENTS).forEach(e=>{"function"==typeof e.onMount&&e.onMount(e)})},plugin:(e,...t)=>e(w,...t)};return window&&(window.Radi=w),w});
},{"process":16}],17:[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},e=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}();function r(t){if(Array.isArray(t)){for(var e=0,r=Array(t.length);e<t.length;e++)r[e]=t[e];return r}return Array.from(t)}function n(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}function o(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}function i(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function u(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}var a=exports.version="0.3.2";exports.default=function(a,c){var s,f,l,p,h=a.r,y=a.l,v=(a.mount,a.headless),b=a.Component,d={},m=":".charCodeAt(0),w="/".charCodeAt(0),g=function(t){for(var e=t.split("/"),r=[],n=[],o=0;o<e.length;o++)m===e[o].charCodeAt(0)?(r.push("([^/]+?)"),n.push(e[o].substr(1))):""!==e[o]&&r.push(e[o]);return[new RegExp("^/"+r.join("/")+"(?:[/])?(?:[?&].*)?$","i"),n]},O=function(t){return d.config.errors[t]()},_=function(t){return window.location.hash=t,!0},j=function t(e,r,n,o,i,u,a){return e(n,o,function(e){if(void 0===e||!0===e){if("function"==typeof a)return t(a,r,n,o,i,u,null);i({default:r})}else{if("string"==typeof e&&e.charCodeAt(0)===w)return _(e),u();i({default:O(403)})}d.after&&d.after(n,o)})},k=function(t){if(l===t)return p;s||(s=Object.keys(d.routes)),f||(f=function(t){for(var e=t.length,r=new Array(e),n=e-1;n>=0;n--)r[n]=g(t[n]);return r}(s));for(var e=!1,r=0;r<f.length;r++)if(f[r][0].test(t)){p=new C(t,f[r],d.routes,s[r]),e=!0;break}return l=t,e?p:{key:null}},C=function t(e,r,n,o){u(this,t);var a=e.split(/[\?\&]/).slice(1).map(function(t){return t.split("=")}).reduce(function(t,e){return Object.assign(t,i({},e[0],e[1]))},{}),c=e.match(r[0]);this.path=e,this.key=o,this.query=a,this.cmp=n[o],this.params=this.cmp.data||{};for(var s=0;s<r[1].length;s++)this.params[r[1][s]]=c[s+1]},P=function(t){function r(){return u(this,r),n(this,(r.__proto__||Object.getPrototypeOf(r)).apply(this,arguments))}return o(r,b),e(r,[{key:"state",value:function(){return{location:window.location.hash.substr(1)||"/",params:{},query:{},last:null,active:null}}},{key:"on",value:function(){return{mount:function(){var t=this;window.onhashchange=function(){return t.setState(t.hashChange())},this.setState(this.hashChange())}}}},{key:"hashChange",value:function(){var t=window.location.hash.substr(1)||"/",e=k(t);return window.scrollTo(0,0),{last:this.state.active,location:t,params:e.params||{},query:e.query||{},active:e.key||""}}}]),r}(),A=function(t){function i(){return u(this,i),n(this,(i.__proto__||Object.getPrototypeOf(i)).apply(this,arguments))}return o(i,b),e(i,[{key:"state",value:function(){return{to:"/",active:"active",core:!1,class:"",id:null,title:null}}},{key:"view",value:function(){var t=this;return h.apply(void 0,["a",{href:y(this,"to").process(function(t){return"#".concat(t)}),class:y(this,"to").process(function(e){return y(t.$router,"active").process(function(r){return y(t,"class").process(function(n){return[(r===e||t.state.core&&new RegExp("^"+e).test(r))&&t.state.active,n]})})}),id:y(this,"id"),title:y(this,"title")}].concat(r(this.children)))}}]),i}(),E=function(r){function i(){return u(this,i),n(this,(i.__proto__||Object.getPrototypeOf(i)).apply(this,arguments))}return o(i,b),e(i,[{key:"inject",value:function(e){var r=e.active,n=e.last,o=d.routes[r],i="object"===(void 0===o?"undefined":t(o))?o.component:o;return void 0!==i&&"number"!=typeof i&&i||void 0!==o?"string"==typeof o.redirect?_(o.redirect):"function"==typeof d.before||"function"==typeof o.before?function(){return new Promise(function(t,e){"function"==typeof d.before?j(d.before,i,r,n,t,e,o.before):"function"==typeof o.before&&j(o.before,i,r,n,t,e,null)})}:"function"==typeof i&&i.isComponent&&i.isComponent()?h(i):i:O(i||404)}},{key:"view",value:function(){var t=this;return h("template",{},y(this.$router,"active").process(function(){return t.inject(t.$router.state)}),this.children)}}]),i}(),S=c.beforeEach,x=c.afterEach;return d={config:{errors:{404:function(){return h("div",{},"Error 404: Not Found")},403:function(){return h("div",{},"Error 403: Forbidden")}}},before:S,after:x,routes:function t(e){var r=e;for(var n in e)if(e.hasOwnProperty(n)&&e[n].children){var o=t(e[n].children);for(var i in o)o.hasOwnProperty(i)&&(r[n+i]=o[i])}return r}(c.routes),write:_,Link:A,Router:E},v("router",P),d};
},{}],21:[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default={github:"https://github.com/radi-js/radi",slack:"https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ",docs:"/docs",repl:"/fiddle",startingCode:'state: {\n  count: 0\n}\n\n@action change(diff) {\n  return {\n    count: this.state.count + diff\n  }\n}\n\n<template>\n  <h2>{ this.state.count }</h2>\n\n  <button\n    class="btn"\n    disabled={ this.state.count <= 0 }\n    onclick={ () => -1 |> this.change }>\n    -\n  </button>\n\n  <button\n    class="btn"\n    onclick={ () => 1 |> this.change }>\n    +\n  </button>\n</template>'};
},{}],34:[function(require,module,exports) {
var t=null;function r(){return t||(t=e()),t}function e(){try{throw new Error}catch(r){var t=(""+r.stack).match(/(https?|file|ftp):\/\/[^)\n]+/g);if(t)return n(t[0])}return"/"}function n(t){return(""+t).replace(/^((?:https?|file|ftp):\/\/.+)\/[^/]+$/,"$1")+"/"}exports.getBundleURL=r,exports.getBaseURL=n;
},{}],18:[function(require,module,exports) {
var r=require("./bundle-url").getBundleURL;function e(r){Array.isArray(r)||(r=[r]);var e=r[r.length-1];try{return Promise.resolve(require(e))}catch(e){if("MODULE_NOT_FOUND"===e.code)return new s(function(e,n){t(r).then(e,n)});throw e}}function t(r){var e=r[r.length-1];return Promise.all(r.slice(0,-1).map(u)).then(function(){return require(e)})}var n={};function o(r,e){n[r]=e}module.exports=exports=e,exports.load=t,exports.register=o;var i={};function u(e){var t;if(Array.isArray(e)&&(t=e[1],e=e[0]),i[e])return i[e];var o=(e.substring(e.lastIndexOf(".")+1,e.length)||e).toLowerCase(),u=n[o];return u?i[e]=u(r()+e).then(function(r){return r&&(module.bundle.modules[t]=[function(e,t){t.exports=r},{}]),r}):void 0}function s(r){this.executor=r,this.promise=null}s.prototype.then=function(r,e){return this.promise||(this.promise=new Promise(this.executor).then(r,e))},s.prototype.catch=function(r){return this.promise||(this.promise=new Promise(this.executor).catch(r))};
},{"./bundle-url":34}],15:[function(require,module,exports) {
"use strict";var e;Object.defineProperty(exports,"__esModule",{value:!0});var r=require("./helpers/globals"),n=o(r);function o(e){return e&&e.__esModule?e:{default:e}}function u(e,r,n){return r in e?Object.defineProperty(e,r,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[r]=n,e}exports.default={routes:(e={"/":{component:function(){return require("_bundle_loader")(require.resolve("./pages/Index.radi"))}}},u(e,n.default.repl,{component:function(){return require("_bundle_loader")(require.resolve("./pages/Repl.radi"))},children:{"/:code":{component:function(){return require("_bundle_loader")(require.resolve("./pages/Repl.radi"))}}}}),u(e,n.default.docs,{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/Introduction.radi"))},children:{"/installation":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/Installation.radi"))}},"/hyperscript":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/Hyperscript.radi"))}},"/components":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/Components.radi"))}},"/state":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/State.radi"))}},"/actions":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/Actions.radi"))}},"/view":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/View.radi"))}},"/listener":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/Listener.radi"))}},"/events":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/Events.radi"))}},"/headless-components":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/HeadlessComponents.radi"))}},"/plugin":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/Plugin.radi"))}},"/mount":{component:function(){return require("_bundle_loader")(require.resolve("./pages/docs/Mount.radi"))}}}}),e),beforeEach:function(e,r,n){"/restricted"===e?n(!1):n()}};
},{"./helpers/globals":21,"_bundle_loader":18,"./pages/Index.radi":[["c8dcae0a69732e03b210fd058e9198c8.js",19],"c8dcae0a69732e03b210fd058e9198c8.map",["6e70ba7b1d89921e1828e15e26d37127.svg",73],"c8dcae0a69732e03b210fd058e9198c8.css",["ec1044bce9e69aa95df108c9581b0106.png",40],["94d93683a2ebc1a16ed11e7e5c5b09c6.png",42],["68eaf9dda3323f75544cfa111b82b69c.png",43],["90e891bd752da22c18abff180dd8bef9.png",44],["7dac33bb14b9cd6b71ac140d422436f5.png",45],["e63612f23f466482c9d44de0328f92d1.png",46],["4a4cbae5cc9695d074dc7d3e89ed3361.png",47],["866d1a29ff9d6e555a3ce13f0701e90f.png",48],["6fde0edafe606b5119b8fd221444d322.png",49],["0a1ab65f258cdc331a91f1aa5c19ab56.png",50],19],"./pages/Repl.radi":[["7fc0d4a50ff645b1a1d2ac433087a5da.js",20],"7fc0d4a50ff645b1a1d2ac433087a5da.map","7fc0d4a50ff645b1a1d2ac433087a5da.css",20],"./pages/docs/Introduction.radi":[["6c40c1ebffac474856d213c5f6c0a0f6.js",22],"6c40c1ebffac474856d213c5f6c0a0f6.map",22],"./pages/docs/Installation.radi":[["9ca4b6ef18cb1ad75020484ca3a92949.js",23],"9ca4b6ef18cb1ad75020484ca3a92949.map",23],"./pages/docs/Hyperscript.radi":[["febe99e4e30f8cbc24a25a841666e4ca.js",24],"febe99e4e30f8cbc24a25a841666e4ca.map",24],"./pages/docs/Components.radi":[["fcb10d66e4a983a5d80cb9b2493e4462.js",25],"fcb10d66e4a983a5d80cb9b2493e4462.map",25],"./pages/docs/State.radi":[["aa924706c8490558ea487b3a48015eb7.js",26],"aa924706c8490558ea487b3a48015eb7.map",26],"./pages/docs/Actions.radi":[["8881f6b1d97e538095b5d9959ae76432.js",27],"8881f6b1d97e538095b5d9959ae76432.map",27],"./pages/docs/View.radi":[["9fd16ad3d6b1760420b279ae51e5eb46.js",28],"9fd16ad3d6b1760420b279ae51e5eb46.map",28],"./pages/docs/Listener.radi":[["f5264e3e912f4f1852540286e50968cb.js",29],"f5264e3e912f4f1852540286e50968cb.map",29],"./pages/docs/Events.radi":[["f6ec8c37f5cbdd110304e6dc9f922e7a.js",30],"f6ec8c37f5cbdd110304e6dc9f922e7a.map",30],"./pages/docs/HeadlessComponents.radi":[["c3fa139353c849197666d546cdb5392d.js",31],"c3fa139353c849197666d546cdb5392d.map",31],"./pages/docs/Plugin.radi":[["7c9e9d645d84737cb6bae411a7f049a0.js",32],"7c9e9d645d84737cb6bae411a7f049a0.map",32],"./pages/docs/Mount.radi":[["7406b75c376fd94088325c6c5578c6c5.js",33],"7406b75c376fd94088325c6c5578c6c5.map",33]}],9:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

var _radiRouter = require('../../radi-router');

var _radiRouter2 = _interopRequireDefault(_radiRouter);

var _routes = require('./routes.js');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var _radi$plugin = _radi3.default.plugin(_radiRouter2.default, _routes2.default),
    Router = _radi$plugin.Router,
    Link = _radi$plugin.Link;

window.Link = Link;

{}

var App = function (_radi$Component) {
  _inherits(App, _radi$Component);

  function App() {
    var _ref;

    _classCallCheck(this, App);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = App.__proto__ || Object.getPrototypeOf(App)).call.apply(_ref, [this].concat(args)));

    _this.state = {};
    _this.on = {};
    return _this;
  }

  _createClass(App, [{
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(Router, null)];
    }
  }]);

  return App;
}(_radi3.default.Component);

exports.default = App;
;
},{"radi":13,"../../radi-router":17,"./routes.js":15}],11:[function(require,module,exports) {

},{}],5:[function(require,module,exports) {
"use strict";var e=require("./app/App.radi"),t=d(e),o=require("radi");function d(e){return e&&e.__esModule?e:{default:e}}require("./assets/stylus/main.styl"),window.loadJS=function(e,t){var o=document.createElement("script");o.src=e,o.onload=t,o.onreadystatechange=t,document.body.appendChild(o)};var a=(0,o.mount)((0,o.r)(t.default),app);module.hot&&(module.hot.accept(),module.hot.dispose(function(){a.destroy();var e=document.getElementById("app");e.parentNode.replaceChild(e.cloneNode(!1),e)}));
},{"./app/App.radi":9,"radi":13,"./assets/stylus/main.styl":11}],74:[function(require,module,exports) {
"use strict";function e(e){return function(t,n,i){return t.assertVersion||(t=Object.assign(r(t),{assertVersion:function(e){o(e,t.version)}})),e(t,n||{},i)}}function r(e){var r=null;return"string"==typeof e.version&&/^7\./.test(e.version)&&(!(r=Object.getPrototypeOf(e))||t(r,"version")&&t(r,"transform")&&t(r,"template")&&t(r,"types")||(r=null)),Object.assign({},r,e)}function t(e,r){return Object.prototype.hasOwnProperty.call(e,r)}function o(e,r){if("number"==typeof e){if(!Number.isInteger(e))throw new Error("Expected string or integer value.");e="^"+e+".0.0-0"}if("string"!=typeof e)throw new Error("Expected string or integer value.");var t,o=Error.stackTraceLimit;throw"number"==typeof o&&o<25&&(Error.stackTraceLimit=25),t="7."===r.slice(0,2)?new Error('Requires Babel "^7.0.0-beta.41", but was loaded with "'+r+"\". You'll need to update your @babel/core version."):new Error('Requires Babel "'+e+'", but was loaded with "'+r+'". If you are sure you have a compatible version of @babel/core, it is likely that something in your build process is loading the wrong version. Inspect the stack trace of this error to look for the first entry that doesn\'t mention "@babel/core" or "babel-core" to see what is calling Babel.'),"number"==typeof o&&(Error.stackTraceLimit=o),Object.assign(t,{code:"BABEL_VERSION_UNSUPPORTED",version:r,range:e})}Object.defineProperty(exports,"__esModule",{value:!0}),exports.declare=e;
},{}],52:[function(require,module,exports) {
const{declare:e}=require("@babel/helper-plugin-utils");module.exports=e(({types:e},r)=>{const t=/\*?\s*@radi-listen\s+([^\s]+)/;let n=r.pragma||"l";function s(){const r=e.identifier(n);return r.isClean=!0,r}let i={prefix:"_$",count:0};const o=()=>i.prefix.concat(i.count++),p=(r,t)=>{let n=r.slice(1);return r[0].process?e.callExpression(e.memberExpression(e.callExpression(s(),r[0].props),e.identifier("process")),[e.functionExpression(null,[r[0].var],e.blockStatement([e.returnStatement(n.length>0?p(n,t):t)]))]):e.callExpression(s(),r[0].props)};return Array.prototype.extract=function(r){r&&(e.isIdentifier(r.node.property)?this.unshift(e.stringLiteral(r.node.property.name)):this.unshift(r.node.property),e.isIdentifier(r.node.object)&&this.unshift(r.node.object))},{visitor:{Program(e){for(const r of e.container.comments){const e=t.exec(r.value);e&&(n=e[1])}},JSXExpressionContainer(r){if(r)if(r.traverse({ThisExpression(r){r.replaceWith(e.identifier("component"))}}),e.isObjectExpression(r.node.expression)&&e.isJSXAttribute(r.parent))r.traverse({ObjectProperty(r){if(!e.isObjectExpression(r.parent))return;let t=[];r.traverse({MemberExpression(r){if(e.isMemberExpression(r.parent))return;const n=e.isJSXExpressionContainer(r.parent);let s=[];s.extract(r),e.isMemberExpression(r.node.object)&&r.traverse({MemberExpression(e){s.extract(e)},ThisExpression(e){s.unshift(e.node)}});let i=e.isCallExpression(r.parent)&&"callee"===r.parentKey&&s.pop();const p="$".charCodeAt(0);if(s[0]&&!e.isThisExpression(s[0])&&"component"!==s[0].name)return;if(s[1]&&s[1].value&&s[1].value.charCodeAt(0)===p&&(s[0]=e.memberExpression(s[0],e.identifier(s[1].value)),s.splice(1,1)),s[1]&&"state"!==s[1].name&&s.splice(1,1),s.length<2)return;let a=e.identifier(o());e.isIdentifier(r.node.property)&&(r.node.property=e.stringLiteral(r.node.property.name)),t.push({process:!(!i&&n),var:a,props:s}),r.replaceWith(e.expressionStatement(i?e.memberExpression(a,e.identifier(i.value)):a))}}),t.length>0&&r.replaceWith(e.ObjectProperty(r.node.key,p(t,r.node.value)))}});else{let t=[];r.traverse({JSXExpressionContainer(e){e.skip()},MemberExpression(r){if(e.isMemberExpression(r.parent))return;const n=e.isJSXExpressionContainer(r.parent);let s=[];s.extract(r),e.isMemberExpression(r.node.object)&&r.traverse({MemberExpression(e){s.extract(e)},ThisExpression(e){s.unshift(e.node)}});let i=e.isCallExpression(r.parent)&&"callee"===r.parentKey&&s.pop();const p="$".charCodeAt(0);if(s[0]&&!e.isThisExpression(s[0])&&"component"!==s[0].name)return;if(s[1]&&s[1].value&&s[1].value.charCodeAt(0)===p&&(s[0]=e.memberExpression(s[0],e.identifier(s[1].value)),s.splice(1,1)),s[1]&&"state"!==s[1].name&&s.splice(1,1),s.length<2)return;let a=e.identifier(o());e.isIdentifier(r.node.property)&&(r.node.property=e.stringLiteral(r.node.property.name)),t.push({process:!(!i&&n),var:a,props:s}),r.replaceWith(e.expressionStatement(i?e.memberExpression(a,e.identifier(i.value)):a))}}),t.length>0&&(e.isJSXAttribute(r.parent)?r.replaceWith(e.JSXExpressionContainer(p(t,r.node.expression))):r.replaceWith(p(t,r.node.expression)))}}}}});
},{"@babel/helper-plugin-utils":74}],51:[function(require,module,exports) {
var t=function(){return function(t,n){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return function(t,n){var r=[],e=!0,o=!1,a=void 0;try{for(var i,c=t[Symbol.iterator]();!(e=(i=c.next()).done)&&(r.push(i.value),!n||r.length!==n);e=!0);}catch(t){o=!0,a=t}finally{try{!e&&c.return&&c.return()}finally{if(o)throw a}}return r}(t,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),n=/__RTOKEN-([A-Za-z0-9-_]+):([0-9]+);/g,r={comment:{regex:/((?:\/\*(?:[^*]|[\r\n]|(?:\*+([^*\/]|[\r\n])))*\*+\/)|(?:(^|[^\:])\/\/.*))/},state:{regex:/(?:^|\s)state(?:\s|:|)+\{/,extract:[-1,"{","}"]},on:{regex:/(?:^|\s)on(?:\s|:|)+\{/,extract:[-1,"{","}"]},node:{regex:/(?:{\/\*[^\*]+?\*\/\}|<([A-Za-z][A-Za-z0-9-_]*?)(?:\/>|\b[^>]*>(?:[^{]+({[\s\S]*[^}]+})[^<\\]+|([^<\/]*?|[\s\S]+?))<\/\1>))/,custom:function(t){return t.replace(/this\.state/g,"component.state")}},method:{regex:/(?:(?:@[\w]+|[\w]+)*[^\b])(?:\w+)\s*\([^)]*\)\s*\{/,extract:[-1,"{","}"],matchToo:!0,multiple:!0}},e={},o=function(t,n,r){var e=t.on,o=t.state,a=t.method,i=t.node;return("\n  /** @jsx Radi.r **/\n  /** @radi-listen Radi_listen **/\n\n  const action = Radi.action;\n  const subscribe = Radi.subscribe;\n  const Radi_listen = Radi.listen;\n\n  "+(r||"")+"\n\n  class "+(n||"")+" extends Radi.Component {\n    constructor(...args) {\n      super(...args);\n      this.state = "+(o||"{}")+";\n      this.on = "+(e||"{}")+";\n    }\n\n    "+(a?a.join("\n\n"):"")+"\n\n    "+(i&&"view() {\n        const component = this;\n        return ["+i.join(", ")+"];\n      }"||"")+"\n\n  }\n").trim()},a=function t(r){var o=r.replace(n,function(t,n,r){return e[n][r].match});return o===r?o:t(o)},i=function(t,r){var i={},c=t.replace(n,function(t,n,r){return void 0===i[n]&&(i[n]=[]),i[n].push(a(e[n][r].match)),""}).trim();return o(i,r,c)},c=function(n,o,a){e={};var c=function(t,n,o,a){return void 0===e[t]&&(e[t]=[]),"function"==typeof r[t].custom&&(o=r[t].custom(o),a=r[t].custom(a)),"__RTOKEN-"+t+":"+(e[t].push({type:t,contents:n,match:o,input:a})-1)+";"},s=function t(n,e){var o=e.replace(r[n].regex,function(t){for(var r=arguments.length,e=Array(r>1?r-1:0),o=1;o<r;o++)e[o-1]=arguments[o];var a=e.splice(-1)[0];e.splice(-1)[0];return c(n,[].concat(e),t,a)});return o===e?e:t(n,o)},u=function e(o,a){var i=r[o].regex,s=t(r[o].extract,3),u=s[0],l=s[1],f=s[2],h=l.charCodeAt(0),d=f.charCodeAt(0),m=a.match(i);if(!m)return a;for(var v=m.index+m[0].length,p=1,g=-1,x=v;x<=a.length;x++)if(a.charCodeAt(x)===h?p+=1:a.charCodeAt(x)===d&&(p-=1),0===p){g=x+1;break}if(g<0)throw new Error("Cannot find end for "+o+' in "'+n+'": '+m[0].replace(/\n/g,"")+"...");var y=a.substring(v+(r[o].matchToo?-m[0].length:u),g),b=c(o,["state"],y,y),w=a.substr(0,m.index).concat(b).concat(a.substring(g,a.length));return r[o].multiple&&a.match(i)&&(w=e(o,w)),w},l=!0,f=!1,h=void 0;try{for(var d,m=Object.keys(r)[Symbol.iterator]();!(l=(d=m.next()).done);l=!0){var v=d.value;o=void 0!==r[v].extract?u(v,o):s(v,o)}}catch(t){f=!0,h=t}finally{try{!l&&m.return&&m.return()}finally{if(f)throw h}}var p=i(o,n);return"function"==typeof a&&a(e,o,p),p};module.exports=c;
},{}],56:[function(require,module,exports) {
"use strict";function e(e,t){for(var r=e.toLowerCase().replace(/  /g," ").replace(/[^a-zA-z\d]+/g," ").trim().split(" "),o=t.toLowerCase(),a=0,l=100/r.length/2,n=0;n<r.length;n++){var s=2-2/r.length*n;o.indexOf(r[n])>=0&&(a+=l*s),new RegExp("(^|\\b)"+r[n]+"($|\\b)","g").test(o)&&(a+=l*s)}return a}Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=e;
},{}],61:[function(require,module,exports) {
module.exports=`<h2 id="introduction">Introduction</h2>
<p><strong>Radi</strong> is a tiny (4kB minified &amp; gzipped) javascript framework.</p>
<p><a href="https://www.npmjs.com/package/radi"><img src="https://img.shields.io/npm/v/radi.svg?style=flat-square" alt="npm version"></a>
<a href="https://www.npmjs.com/package/radi"><img src="https://img.shields.io/npm/dm/radi.svg?style=flat-square" alt="npm downloads"></a>
<a href="https://unpkg.com/radi@0.3.8/dist/radi.js"><img src="http://img.badgesize.io/https://unpkg.com/radi@0.3.8/dist/radi.es.min.js?compression=gzip&amp;style=flat-square" alt="gzip bundle size"></a>
<a href="https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ"><img src="https://img.shields.io/badge/slack-radijs-3eb891.svg?style=flat-square" alt="radi workspace on slack"></a></p>
<p>It&#39;s built quite differently from any other framework. It doesn&#39;t use any kind of diffing algorithm nor virtual dom which makes it really fast.</p>
<p>With Radi you can create any kind of single-page applications or more complex applications.</p>
`
},{}],63:[function(require,module,exports) {
module.exports=`<h2 id="installation">Installation</h2>
<p>Install with npm or Yarn.</p>
<pre><code>npm i radi
</code></pre><p>Then with a module bundler like <a href="https://rollupjs.org/">Rollup</a> or <a href="https://webpack.js.org/">Webpack</a>, use as you would anything else.</p>
<pre><code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> Component<span class="token punctuation">,</span> mount <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">"radi"</span></code></pre>

<p>If you don&#39;t want to set up a build environment, you can download Radi from a CDN like <a href="https://unpkg.com/radi@latest/dist/radi.min.js">unpkg.com</a> and it will be globally available through the window.Radi object. We support all ES5-compliant browsers, including Internet Explorer 10 and above.</p>
<pre><code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span> <span class="token attr-name">src</span><span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>https://unpkg.com/radi@latest/dist/radi.min.js<span class="token punctuation">"</span></span><span class="token punctuation">></span></span><span class="token script language-javascript"></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script language-javascript">
  <span class="token keyword">const</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> Component<span class="token punctuation">,</span> mount <span class="token punctuation">}</span> <span class="token operator">=</span> Radi<span class="token punctuation">;</span>
  <span class="token operator">...</span>
</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code></pre>
`
},{}],62:[function(require,module,exports) {
module.exports=`<h2 id="hyperscript">Hyperscript</h2>
<p><code>r</code> is a helper for <code>document.createElement</code> with couple of differences.
The basic idea is to simply create elements with <code>r</code> and mount them with <code>mount</code>, almost like you would do with plain JavaScript:</p>
<pre><code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> mount <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">const</span> hello <span class="token operator">=</span> <span class="token function">r</span><span class="token punctuation">(</span><span class="token string">'h1'</span><span class="token punctuation">,</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token string">'Hello Radi!'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token function">mount</span><span class="token punctuation">(</span>hello<span class="token punctuation">,</span> document<span class="token punctuation">.</span>body<span class="token punctuation">)</span><span class="token punctuation">;</span></code></pre>

<pre><code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>body</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span>Hello Radi!<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>body</span><span class="token punctuation">></span></span></code></pre>
`
},{}],64:[function(require,module,exports) {
module.exports=`<h2 id="components">Components</h2>
<p>Simply define a class or function that extends <code>Radi.Component</code>. It can have <code>state</code> method that returns <a href="#state">state object</a>, <code>view</code> method that returns <a href="#view">view data</a> and any other methods that can be decorated as <a href="#actions">action</a>. State can also be defined inside <code>constructor</code> as simple object. But <code>view</code> must always be method.</p>
<pre><code class="language-jsx"><span class="token keyword">import</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> l<span class="token punctuation">,</span> action<span class="token punctuation">,</span> Component <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">Counter</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">state</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      count<span class="token punctuation">:</span> <span class="token number">0</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  @action
  <span class="token function">up</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      count<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>count <span class="token operator">+</span> <span class="token number">1</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">view</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">[</span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>count <span class="token punctuation">}</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">,</span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>button</span> <span class="token attr-name">onclick</span><span class="token script language-javascript"><span class="token script-punctuation punctuation">=</span><span class="token punctuation">{</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">up</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">}</span></span><span class="token punctuation">></span></span><span class="token operator">+</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
    <span class="token punctuation">]</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>
`
},{}],65:[function(require,module,exports) {
module.exports=`<h2 id="state">State</h2>
<p>State is a plain JS object that describes your entire program. Data in it cannot be changed once created, it can only be updated with actions or <code>setState</code> method that is part of Component.</p>
<pre><code class="language-js"><span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
  name<span class="token punctuation">:</span> <span class="token string">'John'</span>
<span class="token punctuation">}</span></code></pre>
`
},{}],66:[function(require,module,exports) {
module.exports=`<h2 id="actions">Actions</h2>
<p>One of the ways to change state is with actions. Every action is regular class method that has been decorated with <code>@action</code> decorator. It must return state changes to modify state.</p>
<pre><code class="language-js">@action
<span class="token function">rename</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">{</span>
    name<span class="token punctuation">:</span> <span class="token string">'Steve'</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>

<p>State is always immutable. Do not mutate it without returning state change in action. DOM will not be re-rendered that way.</p>
`
},{}],68:[function(require,module,exports) {
module.exports=`<h2 id="view">View</h2>
<p>View is a function in Component class that returns <a href="#hyperscript">Hyperscript</a>/JSX nodes, DOM Nodes, Component or Array of these three.</p>
<pre><code class="language-jsx"><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">view</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span>Hello World<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span>
<span class="token punctuation">}</span></code></pre>

<pre><code class="language-jsx"><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">view</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MyComponent</span> <span class="token punctuation">/></span></span>
<span class="token punctuation">}</span></code></pre>

<pre><code class="language-jsx"><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">view</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">[</span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">,</span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MyComponent</span><span class="token punctuation">></span></span><span class="token punctuation">,</span>
    document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">'foo'</span><span class="token punctuation">)</span>
  <span class="token punctuation">]</span>
<span class="token punctuation">}</span></code></pre>

<p>View is rendered only once when Component is mounted or re-mounted. This is where Radi differs from other frameworks - it doesn&#39;t re render whole view, instead it uses <a href="#listener">Listener</a> to re-render only necessary parts of DOM.
So if you write logic inside <code>view</code> method before return statement, it will NOT be triggered every time something updates.</p>
`
},{}],67:[function(require,module,exports) {
module.exports=`<h2 id="listener">Listener</h2>
<p><strong>NOTE:</strong>  Radi has a <a href="https://github.com/radi-js/babel-plugin-transform-radi-listen">babel transformer plugin</a> for listeners to be handled automatically (just like transformation from JSX to <a href="#hyperscript">hyperscript</a>).</p>
<p>Listeners watch for changes in the state of the assigned component and if changes happen it is responsible for re-rendering that part of view and updating it in DOM.
Listener expects to receive component that it should listen to and path of state to listen to.</p>
<pre><code class="language-jsx"><span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
  person<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    name<span class="token punctuation">:</span> <span class="token string">'John'</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
<span class="token operator">...</span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">{</span> <span class="token function">listener</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token string">'person'</span><span class="token punctuation">,</span> <span class="token string">'name'</span><span class="token punctuation">)</span> <span class="token punctuation">}</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span></code></pre>

<p>Listeners can also do some processing with that state value.</p>
<pre><code class="language-jsx"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">{</span> <span class="token function">listener</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token string">'count'</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">process</span><span class="token punctuation">(</span>count <span class="token operator">=></span> count <span class="token operator">+</span> <span class="token number">50</span><span class="token punctuation">)</span> <span class="token punctuation">}</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span></code></pre>
`
},{}],71:[function(require,module,exports) {
module.exports=`<h2 id="events">Events</h2>
<p>Events are part of <code>on</code> method in every Component. It can also be defined inside <code>constructor</code> as simple object. Every method that is part of it is event handler. Every event can also be an <a href="#actions">action</a>.</p>
<pre><code class="language-js"><span class="token keyword">this</span><span class="token punctuation">.</span>on <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token function">buyMilk</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>milk <span class="token operator">===</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Milk not found'</span><span class="token punctuation">)</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
      console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Here you go'</span><span class="token punctuation">)</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  @action
  <span class="token function">outOfMilk</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      milk<span class="token punctuation">:</span> <span class="token number">0</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>

<pre><code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">{</span> action<span class="token punctuation">,</span> Component <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">Grandma</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">state</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      status<span class="token punctuation">:</span> <span class="token string">'busy'</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">on</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      <span class="token function">callGrandma</span><span class="token punctuation">(</span>whatToSay<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Grandma is '</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>status<span class="token punctuation">,</span> <span class="token string">'try to say'</span><span class="token punctuation">,</span> whatToSay<span class="token punctuation">,</span> <span class="token string">'again later'</span><span class="token punctuation">)</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">call</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">trigger</span><span class="token punctuation">(</span><span class="token string">'callGrandma'</span><span class="token punctuation">,</span> <span class="token string">'hello'</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>

<h3 id="component-lifecycle">Component lifecycle</h3>
<p>Radi supports lifecycle events for Components. Currently two events are defined: <code>mount</code> and <code>destroy</code>.</p>
<ul>
<li>When Component gets mounted, <code>mount</code> gets called.</li>
<li>If Component gets unmounted and is no longer part of DOM, <code>destroy</code> gets called.</li>
</ul>
<pre><code class="language-js"><span class="token keyword">this</span><span class="token punctuation">.</span>on <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token function">mount</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'I just got mounted'</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token function">destroy</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Components view was destroyed, but I can still be mounted again'</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code></pre>

<h3 id="global-event-handling">Global event handling</h3>
<p>Coming Soon</p>
`
},{}],69:[function(require,module,exports) {
module.exports=`<h2 id="headless-components">Headless Components</h2>
<p>Components can also be registered as headless (without view). These are components that live in other components as contained mixins and handle logic, events and rendering. This is useful for plugins that handle global data and some logic.</p>
<pre><code class="language-js"><span class="token keyword">import</span> <span class="token punctuation">{</span> action<span class="token punctuation">,</span> headless<span class="token punctuation">,</span> Component <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">GlobalComponent</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">state</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      count<span class="token punctuation">:</span> <span class="token number">0</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  @action <span class="token function">tick</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      count<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>count <span class="token operator">+</span> <span class="token number">1</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">on</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      <span class="token function">mount</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">setInterval</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
          <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">tick</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
        <span class="token punctuation">}</span><span class="token punctuation">)</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token function">headless</span><span class="token punctuation">(</span><span class="token string">'myGlobalComponent'</span><span class="token punctuation">,</span> GlobalComponent<span class="token punctuation">)</span></code></pre>

<p>Now that we registered headless component it can be accessed by every component with dollar sign + handle name <code>this.$myGlobalComponent</code>.</p>
<pre><code class="language-jsx"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span><span class="token punctuation">{</span> <span class="token function">listen</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>$myGlobalComponent<span class="token punctuation">,</span> <span class="token string">'count'</span><span class="token punctuation">)</span> <span class="token punctuation">}</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span></code></pre>

<p>This will output <code>GlobalComponent</code> state.count output.</p>
`
},{}],70:[function(require,module,exports) {
module.exports=`<h2 id="plugin">Plugin</h2>
<p>Plugin is a function that expects a callback function that takes current Radi scope as first argument. This way we can register plugins easily to the current scope of Radi.</p>
<pre><code class="language-js"><span class="token keyword">import</span> plugin <span class="token keyword">from</span> <span class="token string">'radi'</span>

<span class="token keyword">const</span> <span class="token function-variable function">myCoolPlugin</span> <span class="token operator">=</span> _radi <span class="token operator">=></span> <span class="token punctuation">{</span>
  <span class="token comment">// Your plugins logic here</span>
  <span class="token comment">// create _radi.Component, make it headless, sky is the limit</span>
  <span class="token comment">// can also return anyhing</span>
  <span class="token keyword">return</span> <span class="token punctuation">{</span>
    mom<span class="token punctuation">:</span> <span class="token string">'hi'</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">const</span> <span class="token punctuation">{</span> mom <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">plugin</span><span class="token punctuation">(</span>myCoolPlugin<span class="token punctuation">)</span>
<span class="token comment">// mom = 'hi'</span></code></pre>
`
},{}],72:[function(require,module,exports) {
module.exports=`<h2 id="mount">Mount</h2>
<p>Mount is a function that will mount anything that <a href="#view">view</a> returns (<a href="#hyperscript">Hyperscript</a>/JSX nodes, DOM Nodes, Component or Array of these three) to any DOM node. This is how we mount our Apps root component to DOM.</p>
<pre><code class="language-jsx"><span class="token keyword">import</span> <span class="token punctuation">{</span> r<span class="token punctuation">,</span> mount<span class="token punctuation">,</span> Component <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'radi'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">MyComponent</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token operator">...</span>
<span class="token punctuation">}</span>

<span class="token function">mount</span><span class="token punctuation">(</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>MyComponent</span> <span class="token punctuation">/></span></span><span class="token punctuation">,</span> document<span class="token punctuation">.</span>body<span class="token punctuation">)</span></code></pre>
`
},{}],39:[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var e=require("radi/docs/readme.md"),d=b(e),r=require("radi/docs/installation.md"),t=b(r),i=require("radi/docs/hyperscript.md"),a=b(i),s=require("radi/docs/components.md"),u=b(s),o=require("radi/docs/state.md"),n=b(o),l=require("radi/docs/actions.md"),c=b(l),m=require("radi/docs/view.md"),f=b(m),p=require("radi/docs/listener.md"),q=b(p),v=require("radi/docs/events.md"),h=b(v),_=require("radi/docs/headless-components.md"),y=b(_),g=require("radi/docs/plugin.md"),w=b(g),x=require("radi/docs/mount.md"),M=b(x);function b(e){return e&&e.__esModule?e:{default:e}}exports.default={introduction:d.default,installation:t.default,hyperscript:a.default,components:u.default,state:n.default,actions:c.default,view:f.default,listener:q.default,events:h.default,headlessComponents:y.default,plugin:w.default,mount:M.default};
},{"radi/docs/readme.md":61,"radi/docs/installation.md":63,"radi/docs/hyperscript.md":62,"radi/docs/components.md":64,"radi/docs/state.md":65,"radi/docs/actions.md":66,"radi/docs/view.md":68,"radi/docs/listener.md":67,"radi/docs/events.md":71,"radi/docs/headless-components.md":69,"radi/docs/plugin.md":70,"radi/docs/mount.md":72}],57:[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var e=require("./docs-bundle.js"),t=l(e);function l(e){return e&&e.__esModule?e:{default:e}}exports.default=[{page:"/docs",title:"Introduction",html:t.default.introduction,p:t.default.introduction.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/installation",title:"Installation",html:t.default.installation,p:t.default.installation.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/hyperscript",title:"Hyperscript",html:t.default.hyperscript,p:t.default.hyperscript.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/components",title:"Components",html:t.default.components,p:t.default.components.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/state",title:"State",html:t.default.state,p:t.default.state.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/actions",title:"Actions",html:t.default.actions,p:t.default.actions.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/view",title:"View",html:t.default.view,p:t.default.view.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/listener",title:"Listener",html:t.default.listener,p:t.default.listener.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/events",title:"Events",html:t.default.events,p:t.default.events.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/headless-components",title:"Headless Components",html:t.default.headlessComponents,p:t.default.headlessComponents.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/plugin",title:"Plugin",html:t.default.plugin,p:t.default.plugin.replace(/<\/?[^>]+(>|$)/g,"").split(". ")},{page:"/docs/mount",title:"Mount",html:t.default.mount,p:t.default.mount.replace(/<\/?[^>]+(>|$)/g,"").split(". ")}];
},{"./docs-bundle.js":39}],53:[function(require,module,exports) {
module.exports="b6c1be62ed6c8ad78806d81f751dd1d2.png";
},{}],35:[function(require,module,exports) {
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

var _logoLWhite = require('../../assets/img/logo-l-white.png');

var _logoLWhite2 = _interopRequireDefault(_logoLWhite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var Header = function (_radi$Component) {
  _inherits(Header, _radi$Component);

  function Header() {
    var _ref;

    _classCallCheck(this, Header);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = Header.__proto__ || Object.getPrototypeOf(Header)).call.apply(_ref, [this].concat(args)));

    _this.state = {
      location: null
    };
    _this.on = {};
    return _this;
  }

  _createClass(Header, [{
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(
        'header',
        { 'class': _radi_listen(component, 'location') },
        _radi3.default.r(
          'div',
          { 'class': 'wrapper' },
          _radi3.default.r(
            'div',
            { id: 'logo' },
            _radi3.default.r(
              Link,
              { to: '/' },
              _radi3.default.r('img', { src: _logoLWhite2.default, alt: '' })
            )
          ),
          _radi3.default.r(
            'ul',
            { id: 'main-menu' },
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs, core: true },
                'Docs'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.repl },
                'Try online'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                'a',
                { href: _globals2.default.slack, target: '_blank' },
                'Slack'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                'a',
                { href: _globals2.default.github, target: '_blank' },
                'GitHub'
              )
            )
          )
        )
      )];
    }
  }]);

  return Header;
}(_radi3.default.Component);

exports.default = Header;
;
},{"radi":13,"../helpers/globals":21,"../../assets/img/logo-l-white.png":53}],55:[function(require,module,exports) {
module.exports="db77c2553b3a5f7c089c98351a87b700.png";
},{}],38:[function(require,module,exports) {
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

require('github-markdown-css');

require('../../assets/stylus/docs.styl');

var _globals = require('../helpers/globals');

var _globals2 = _interopRequireDefault(_globals);

var _search = require('../helpers/search');

var _search2 = _interopRequireDefault(_search);

var _docs = require('../helpers/docs');

var _docs2 = _interopRequireDefault(_docs);

var _Header = require('../components/Header');

var _Header2 = _interopRequireDefault(_Header);

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

var DocsLayout = (_class = function (_radi$Component) {
  _inherits(DocsLayout, _radi$Component);

  function DocsLayout() {
    var _ref;

    _classCallCheck(this, DocsLayout);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = DocsLayout.__proto__ || Object.getPrototypeOf(DocsLayout)).call.apply(_ref, [this].concat(args)));

    _this.state = {
      searchOverlay: false,
      search: '',
      results: []
    };
    _this.on = {
      mount: function mount() {
        var _this2 = this;

        document.onkeydown = function (e) {
          return _this2.trigger('keydown', e);
        };
      },

      // @subscribe(document)
      keydown: function keydown(e) {
        if ((e.metaKey === true || e.ctrlKey === true) && e.keyCode === 70) {
          e.preventDefault();
          this.openSearch();
          return false;
        } else {
          this.searchKey(e);
        }
      }
    };
    return _this;
  }

  _createClass(DocsLayout, [{
    key: 'searchKey',
    value: function searchKey(e) {
      if (e.keyCode === 27) {
        this.closeSearch();
      }
    }
  }, {
    key: 'makeSearch',
    value: function makeSearch(e) {
      var phrase = e.target.value;

      if (phrase === '') {
        // this.noresults = phrase !== '' && this.results.length <= 0
        return { results: [] };
      }

      var treshold = 100;
      var res = [];
      for (var i = 0; i < _docs2.default.length; i++) {
        for (var n = 0; n < _docs2.default[i].p.length; n++) {
          var s = (0, _search2.default)(phrase, _docs2.default[i].p[n]);
          if (s >= treshold) res.push({
            term: _docs2.default[i].p[n],
            score: s,
            page: _docs2.default[i].page,
            title: _docs2.default[i].title
          });
        }
      }

      if (res.length <= 0) {
        return { results: [] };
      }

      return { results: res };
    }
  }, {
    key: 'closeSearch',
    value: function closeSearch() {
      return { searchOverlay: false };
    }
  }, {
    key: 'openSearch',
    value: function openSearch() {
      return { searchOverlay: true };
    }
  }, {
    key: 'addHighlight',
    value: function addHighlight(text) {
      return text.replace(new RegExp(this.state.search.trim().replace(/  /g, ' ').split(' ').join('|'), 'ig'), function (match) {
        return (
          // '{' + match + '}'
          '<span class="mark">' + match + '</span>'
        );
      });
    }
  }, {
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(
        'template',
        null,
        _radi3.default.r(_Header2.default, { location: 'at-docs' }),
        _radi3.default.r(
          'div',
          { id: 'docs-menu' },
          _radi3.default.r(
            'div',
            { 'class': 'docs-logo' },
            _radi3.default.r(
              Link,
              { to: '/' },
              _radi3.default.r('img', { src: require('../../assets/img/llcolor.png'), alt: '' })
            )
          ),
          _radi3.default.r(
            'ul',
            null,
            _radi3.default.r(
              'li',
              { 'class': 'search-btn-wrap' },
              _radi3.default.r(
                'button',
                { onclick: function onclick(e) {
                    return component.openSearch(e);
                  }, 'class': 'search-btn' },
                _radi3.default.r(
                  'i',
                  { 'class': 'material-icons' },
                  '\uE8B6'
                ),
                'Search docs'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs },
                'Introduction'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/installation' },
                'Installation'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/hyperscript' },
                'Hyperscript'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/components' },
                'Components'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/state' },
                'State'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/actions' },
                'Actions'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/view' },
                'View'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/listener' },
                'Listener'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/events' },
                'Events'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/headless-components' },
                'Headless Components'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/plugin' },
                'Plugin'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.docs + '/mount' },
                'Mount'
              )
            ),
            _radi3.default.r('hr', null),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                Link,
                { to: _globals2.default.repl },
                'Try online'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                'a',
                { href: _globals2.default.slack, target: '_blank' },
                'Slack'
              )
            ),
            _radi3.default.r(
              'li',
              null,
              _radi3.default.r(
                'a',
                { href: _globals2.default.github, target: '_blank' },
                'GitHub'
              )
            )
          )
        ),
        _radi3.default.r(
          'div',
          { 'class': 'docs-wrapper' },
          _radi_listen(component, 'searchOverlay').process(function (_$9) {
            return _$9 && _radi3.default.r(
              'div',
              { 'class': 'docs-search-wrapper' },
              _radi3.default.r('div', { 'class': 'docs-search-wrapper-bg', onclick: function onclick(e) {
                  return component.closeSearch();
                } }),
              _radi3.default.r(
                'div',
                { 'class': 'wrapper' },
                _radi3.default.r('input', { type: 'search', autofocus: 'true', onkeyup: function onkeyup(e) {
                    return component.makeSearch(e);
                  }, onkeydown: function onkeydown(e) {
                    return component.searchKey(e);
                  }, placeholder: 'Search..', model: _radi_listen(component, 'search') }),
                _radi_listen(component, 'results', 'length').process(function (_$11) {
                  return _$11 > 0 ? _radi3.default.r(
                    'ul',
                    { 'class': 'search-results' },
                    _radi_listen(component, 'results').process(function (_$12) {
                      return _$12.map(function (result) {
                        return _radi3.default.r(
                          'li',
                          null,
                          _radi3.default.r(
                            Link,
                            { to: result.page },
                            _radi3.default.r(
                              'strong',
                              null,
                              result.title
                            ),
                            _radi3.default.r('span', { html: component.addHighlight(result.term) })
                          )
                        );
                      });
                    })
                  ) : _radi3.default.r(
                    'div',
                    null,
                    'No results'
                  );
                })
              )
            );
          }),
          component.children,
          _radi3.default.r(
            'footer',
            null,
            _radi3.default.r(
              'p',
              null,
              'Edit this page on ',
              _radi3.default.r(
                'a',
                { href: 'https://github.com/radi-js/radi/docs', target: '_blank' },
                'Github'
              )
            )
          )
        )
      )];
    }
  }]);

  return DocsLayout;
}(_radi3.default.Component), (_applyDecoratedDescriptor(_class.prototype, 'makeSearch', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'makeSearch'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'closeSearch', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'closeSearch'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'openSearch', [action], Object.getOwnPropertyDescriptor(_class.prototype, 'openSearch'), _class.prototype)), _class);
exports.default = DocsLayout;
;
},{"radi":13,"github-markdown-css":11,"../../assets/stylus/docs.styl":11,"../helpers/globals":21,"../helpers/search":56,"../helpers/docs":57,"../components/Header":35,"../../assets/img/llcolor.png":55}],78:[function(require,module,exports) {
module.exports=function(e){return new Promise(function(n,o){var r=document.createElement("link");r.rel="stylesheet",r.href=e,r.onerror=function(e){r.onerror=r.onload=null,o(e)},r.onload=function(){r.onerror=r.onload=null,n()},document.getElementsByTagName("head")[0].appendChild(r)})};
},{}],79:[function(require,module,exports) {
module.exports=function(n){return new Promise(function(e,o){var r=document.createElement("script");r.async=!0,r.type="text/javascript",r.charset="utf-8",r.src=n,r.onerror=function(n){r.onerror=r.onload=null,o(n)},r.onload=function(){r.onerror=r.onload=null,e()},document.getElementsByTagName("head")[0].appendChild(r)})};
},{}],0:[function(require,module,exports) {
var b=require(18);b.register("css",require(78));b.register("js",require(79));
},{}]},{},[0,5])
//# sourceMappingURL=radi-website.map