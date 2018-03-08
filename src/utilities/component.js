import { GLOBALS } from "../consts/GLOBALS";
import * as REGEX from "../consts/REGEX";
import { Component } from "./ComponentClass";

export function component(o) {
  var fn = o.view.toString().replace(REGEX.COMMENTS, ""),
    match = REGEX.FIND_L.exec(fn),
    cursor = 0;
  o.$view = "";

  while (match !== null) {
    var n = match.index,
      all = match.input,
      _l = 1,
      _r = 0;

    const len = all.length;

    for (var i = n + 2; i < len; i++) {
      var char = all.charCodeAt(i);
      if (char === GLOBALS.RL) {
        _l += 1;
      } else if (char === GLOBALS.RR) {
        _r += 1;
      }
      if (_l === _r) break;
    }

    var found = all.substr(n, i + 1 - n);

    var m = found.match(/[a-zA-Z_$]+(?:\.[a-zA-Z_$]+(?:\[.*\])?)+/g) || [];
    // var obs = (m.length > 0) ? m.join('__ob__,') + '__ob__' : '';
    var obs = [];
    for (var i = 0; i < m.length; i++) {
      var temp = m[i].split(".");
      if (temp.length > 1) {
        var last = temp.splice(-1)[0];
        obs.push("[" + temp.join(".") + ', "' + last + '"]');
      }
    }
    var obs = obs.join(",");
    var newString =
      "ll(function(){ return " +
      found.substr(1) +
      "; },[" +
      obs +
      '], "' +
      m.join(",") +
      '")';

    o.$view = o.$view.concat(fn.substr(cursor, n - cursor)).concat(newString);
    cursor = n + found.length;

    match = REGEX.FIND_L.exec(fn);
  }
  o.$view = o.$view.concat(fn.substr(cursor, fn.length - cursor));

  return Component.bind(this, o);
}
