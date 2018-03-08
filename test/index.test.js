'use strict';

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const testdir = path.join(__dirname, './fixtures');

global.window = {};
global.document = new JSDOM('<div id="app"></div>').window.document;
global.testapp = document.getElementById('app');
const radi = require('../dist/radi.js');

test("dummy test", () => {
  expect(1 + 1).toBe(2);
});

// TODO: Make this work again
/*describe('radi.js', function () {

  fs.readdirSync(testdir)
    .forEach(function(name) {
      if (/^(\.|\~)/.test(name)) {
        return;
      }

      it(name, () => {
        testapp.innerHTML = '';
        expect(
          (require(testdir + '/' + name)(radi)).trim()
        ).to.equal(
          fs.readFileSync(testdir + '/' + name + '/expected.html', 'utf8').trim()
        );
      });

    });

});*/
