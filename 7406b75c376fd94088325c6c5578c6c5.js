require=function(r,e,n){function t(n,o){function i(r){return t(i.resolve(r))}function f(e){return r[n][1][e]||e}if(!e[n]){if(!r[n]){var c="function"==typeof require&&require;if(!o&&c)return c(n,!0);if(u)return u(n,!0);var l=new Error("Cannot find module '"+n+"'");throw l.code="MODULE_NOT_FOUND",l}i.resolve=f;var s=e[n]=new t.Module(n);r[n][0].call(s.exports,i,s,s.exports)}return e[n].exports}function o(r){this.id=r,this.bundle=t,this.exports={}}var u="function"==typeof require&&require;t.isParcelRequire=!0,t.Module=o,t.modules=r,t.cache=e,t.parent=u;for(var i=0;i<n.length;i++)t(n[i]);return t}({61:[function(require,module,exports) {
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
},{"radi/docs/readme.md":61,"radi/docs/installation.md":63,"radi/docs/hyperscript.md":62,"radi/docs/components.md":64,"radi/docs/state.md":65,"radi/docs/actions.md":66,"radi/docs/view.md":68,"radi/docs/listener.md":67,"radi/docs/events.md":71,"radi/docs/headless-components.md":69,"radi/docs/plugin.md":70,"radi/docs/mount.md":72}],33:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _radi2 = require('radi');

var _radi3 = _interopRequireDefault(_radi2);

var _DocsLayout = require('../../layouts/DocsLayout.radi');

var _DocsLayout2 = _interopRequireDefault(_DocsLayout);

var _docsBundle = require('../../helpers/docs-bundle.js');

var _docsBundle2 = _interopRequireDefault(_docsBundle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /** @jsx _radi.r **/
/** @radi-listen _radi_listen **/

var action = _radi3.default.action;
var subscribe = _radi3.default.subscribe;
var worker = _radi3.default.worker;
var _radi_listen = _radi3.default.listen;

var Mount = function (_radi$Component) {
  _inherits(Mount, _radi$Component);

  function Mount() {
    var _ref;

    _classCallCheck(this, Mount);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = Mount.__proto__ || Object.getPrototypeOf(Mount)).call.apply(_ref, [this].concat(args)));

    _this.state = {};
    _this.on = {};
    return _this;
  }

  _createClass(Mount, [{
    key: 'view',
    value: function view() {
      var component = this;
      return [_radi3.default.r(
        _DocsLayout2.default,
        null,
        _radi3.default.r('div', { 'class': 'wrapper main markdown-body', html: _docsBundle2.default.mount })
      )];
    }
  }]);

  return Mount;
}(_radi3.default.Component);

exports.default = Mount;
;
},{"radi":13,"../../layouts/DocsLayout.radi":38,"../../helpers/docs-bundle.js":39}]},{},[33])
//# sourceMappingURL=7406b75c376fd94088325c6c5578c6c5.map