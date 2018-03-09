import { GLOBALS } from '../consts/GLOBALS';
import * as REGEX from '../consts/REGEX';
import { Component } from './ComponentClass';

// TODO: Properly refactor
export function component(o) {
  const fn = o.view.toString().replace(REGEX.COMMENTS, '');
  let match = REGEX.FIND_L.exec(fn);
  let cursor = 0;
  o.$view = '';

  while (match !== null) {
    const n = match.index;
    const all = match.input;
    let _l = 1;
    let _r = 1;

    const len = all.length;

    for (var i = n + 2; i < len; i++) {
      const char = all.charCodeAt(i);
      if (char === GLOBALS.RL) {
        _l++;
      } else if (char === GLOBALS.RR) {
        _r++;
      }
      if (_l === _r) break;
    }

    let found = all.substr(n, i + 1 - n);

    let m = found.match(/[a-zA-Z_$]+(?:\.[a-zA-Z_$]+(?:\[.*\])?)+/g) || [];
    // var obs = (m.length > 0) ? m.join('__ob__,') + '__ob__' : '';
    let obs = [];
    for (let i = 0; i < m.length; i++) {
      var temp = m[i].split('.');
      if (temp.length > 1) {
        var last = temp.splice(-1)[0];
        obs.push('[' + temp.join('.') + `, '` + last + `']`);
      }
    }
    obs = obs.join(',');
    const newString =
     `
      ll(
        function() { return ${found.substr(1)}; },
        ['${obs}'],
        '${m.join(',')}'
      )
     `;

    o.$view = o.$view.concat(fn.substr(cursor, n - cursor)).concat(newString);
    cursor = n + found.length;

    match = REGEX.FIND_L.exec(fn);
  }
  o.$view = o.$view.concat(fn.substr(cursor, fn.length - cursor));
  return Component.bind(this, o);
}
