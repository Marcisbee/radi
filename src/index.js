(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.radi = {})));
}(this, (function (exports) { 'use strict';

  exports.r = () => ('Hello World');

  Object.defineProperty(exports, '__esModule', { value: true });
})));
