import { GLOBALS } from '../consts/GLOBALS';
import * as REGEX from '../consts/REGEX';
import { Component } from './ComponentClass';

class ViewParser {
  constructor(view) {
    this.view = this.removeComments(view.toString());
    this.parsedView = '';
  }

  removeComments(view) {
    return view.replace(REGEX.COMMENTS, '');
  }

  parse() {
    let $view = '';
    let match = REGEX.FIND_L.exec(this.view);
    let cursor = 0;

    console.log('match', match)
    console.log('cursor', cursor)

    while (match !== null) {
      const n = match.index;
      const all = match.input;
      console.log('n', n)
      console.log('all', all)
      console.log('all === this.view', all === this.view)
      let _l = 1;
      let _r = 0;
      console.log('_l', _l)
      console.log('_r', _r)

      const len = all.length;

      let i = n + 2;
      console.log('i', i)
      for (i = n + 2; i < len; i++) {
        const char = all.charCodeAt(i);
        if (char === GLOBALS.RL) {
          _l++;
        } else if (char === GLOBALS.RR) {
          _r++;
        }
        console.log('loop > i', i)
        console.log('char', char)
        console.log('loop > _l', _l)
        console.log('loop > _r', _r)
        console.log('_l === _r', _l === _r)
        if (_l === _r) break;
      }

      let found = all.substr(n, i + 1 - n);

      console.log('found', found)

      let m = found.match(/[a-zA-Z_$]+(?:\.[a-zA-Z_$]+(?:\[.*\])?)+/g) || [];
      console.log('m', m)
      // var obs = (m.length > 0) ? m.join('__ob__,') + '__ob__' : '';
      let obs = [];
      for (let i = 0; i < m.length; i++) {
        console.log('loop 2 > i', i)
        var temp = m[i].split('.');
        console.log('loop 2 > temp')
        console.log('temp.length > 2', temp.length > 2)
        if (temp.length > 1) {
          var last = temp.splice(-1)[0];
          console.log('last', last)
          obs.push('[' + temp.join('.') + `, '` + last + `']`);
        }
      }
      console.log('obs', obs)
      obs = obs.join(',');
      console.log('obs', obs)
      const newString =
       `
        ll(
          function() { return ${found.substr(1)}; },
          [\`${obs}\`],
          '${m.join(',')}'
        )
       `;


      console.log('newString', newString)
      $view = $view.concat(this.view.substr(cursor, n - cursor)).concat(newString);
      console.log('$view', $view)
      cursor = n + found.length;
      console.log('cursor', cursor)

      match = REGEX.FIND_L.exec(this.view);
      console.log('math', match)
    }
    $view = $view.concat(this.view.substr(cursor, this.view.length - cursor));
    console.log('$view outside while', $view)
    this.parsedView = $view;
    return this.parsedView;
  }
}

// TODO: Properly refactor
export function component(o) {
  const parsedView = new ViewParser(o.view).parse();
  o.$view = parsedView;
  console.log(o.$view)
  return Component.bind(this, o);
}
